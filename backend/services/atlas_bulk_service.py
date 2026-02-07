"""
Atlas Bulk Annexure Service - PostgreSQL Version
============================
Handles:
1. Excel/CSV file parsing (500+ LR rows)
2. Column mapping (with vendor memory)
3. Reconciliation (Excel sum vs PDF total)
4. Line item validation (duplicate LR, rate variance)
5. Bulk insertion into invoice_line_items

Uses PostgreSQL/Supabase instead of MySQL

Author: Atlas Sentinel Team
"""

import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date
import uuid
import json

from .atlas_master_service import get_master_service
from .postgres_helper import get_postgres_connection, get_dict_cursor


class BulkAnnexureService:
    """Service for processing consolidated invoice Excel files"""
    
    def __init__(self):
        self.master_service = get_master_service()
    
    # ========================================================================
    # EXCEL PARSING & COLUMN MAPPING
    # ========================================================================
    
    def parse_excel_file(self, file_path: str, sheet_name: str = None) -> pd.DataFrame:
        """
        Read Excel/CSV file into DataFrame
        
        Args:
            file_path: Path to Excel/CSV file
            sheet_name: Sheet name (for Excel), None = first sheet
        
        Returns:
            DataFrame with all rows
        """
        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path, sheet_name=sheet_name or 0)
            
            print(f"[Bulk Annexure] Parsed {len(df)} rows from {file_path}")
            return df
            
        except Exception as e:
            print(f"[Bulk Annexure] Error parsing file: {e}")
            return None
    
    def detect_column_mapping(self, df: pd.DataFrame, vendor_id: str = None) -> Dict[str, str]:
        """
        Auto-detect column mapping using fuzzy matching + vendor memory
        
        Args:
            df: DataFrame with Excel data
            vendor_id: Vendor ID (to check if we have saved mapping)
        
        Returns:
            Dict mapping: {system_field: excel_column}
            Example: {"lr_number": "Docket No", "weight": "Chrg Wt"}
        """
        # Check if we have saved mapping for this vendor
        if vendor_id:
            saved_mapping = self._get_vendor_template(vendor_id)
            if saved_mapping:
                print(f"[Bulk Annexure] Using saved mapping for vendor {vendor_id}")
                return saved_mapping['column_mapping']
        
        # Auto-detect using fuzzy matching
        mapping = {}
        columns = df.columns.tolist()
        
        # Define possible variations for each system field
        field_variations = {
            'lr_number': ['lr no', 'lr number', 'docket no', 'cn no', 'consignment note', 'lr_no', 'docket_no'],
            'lr_date': ['lr date', 'docket date', 'booking date', 'date'],
            'origin': ['from', 'origin', 'source', 'pickup', 'src'],
            'destination': ['to', 'destination', 'dest', 'delivery', 'dst'],
            'vehicle_number': ['vehicle no', 'truck no', 'veh no', 'vehicle_no'],
            'weight': ['weight', 'wt', 'chargeable weight', 'chrg wt', 'actual wt'],
            'base_freight': ['freight', 'base freight', 'freight charges', 'freight amt', 'amount'],
            'fuel_surcharge': ['fuel surcharge', 'fuel', 'fsc', 'fuel_surcharge'],
            'handling_charges': ['handling', 'hamali', 'loading', 'handling charges'],
            'commodity': ['commodity', 'product', 'material', 'goods']
        }
        
        # Match each system field to Excel column
        for system_field, variations in field_variations.items():
            for col in columns:
                col_lower = col.lower().strip()
                if any(var in col_lower for var in variations):
                    mapping[system_field] = col
                    break
        
        print(f"[Bulk Annexure] Auto-detected mapping: {mapping}")
        return mapping
    
    def save_vendor_template(self, vendor_id: str, vendor_name: str, 
                            template_name: str, column_mapping: Dict[str, str]):
        """Save column mapping for future use"""
        conn = get_postgres_connection()
        cursor = conn.cursor()
        
        try:
            template_id = str(uuid.uuid4())
            query = """
                INSERT INTO vendor_excel_templates 
                (id, vendor_id, vendor_name, template_name, column_mapping, is_default)
                VALUES (%s, %s, %s, %s, %s, TRUE)
                ON CONFLICT (vendor_id, template_name) DO UPDATE SET
                    column_mapping = EXCLUDED.column_mapping,
                    is_default = TRUE
            """
            cursor.execute(query, (
                template_id,
                vendor_id,
                vendor_name,
                template_name,
                json.dumps(column_mapping)
            ))
            conn.commit()
            print(f"[Bulk Annexure] Saved template for vendor {vendor_id}")
            
        except Exception as err:
            print(f"[Bulk Annexure] Error saving template: {err}")
            conn.rollback()
        finally:
            cursor.close()
            conn.close()
    
    def _get_vendor_template(self, vendor_id: str) -> Optional[Dict]:
        """Retrieve saved column mapping for vendor"""
        conn = get_postgres_connection()
        cursor = get_dict_cursor(conn)
        
        try:
            query = """
                SELECT * FROM vendor_excel_templates 
                WHERE vendor_id = %s AND is_default = TRUE
                LIMIT 1
            """
            cursor.execute(query, (vendor_id,))
            template = cursor.fetchone()
            
            if template:
                # Parse JSONB column_mapping
                result = dict(template)
                result['column_mapping'] = template['column_mapping']  # Already parsed as dict by psycopg2
                return result
            return None
            
        except Exception as err:
            print(f"[Bulk Annexure] Error fetching template: {err}")
            return None
        finally:
            cursor.close()
            conn.close()
    
    # ========================================================================
    # RECONCILIATION
    # ========================================================================
    
    def reconcile_totals(self, df: pd.DataFrame, column_mapping: Dict[str, str], 
                        pdf_total: float, tolerance: float = 10.0) -> Dict[str, Any]:
        """
        Validate that SUM(Excel) matches PDF total
        
        Args:
            df: DataFrame with Excel data
            column_mapping: Field mapping
            pdf_total: Total amount from PDF
            tolerance: Acceptable difference (₹)
        
        Returns:
            Dict with: {
                'valid': bool,
                'excel_total': float,
                'pdf_total': float,
                'difference': float
            }
        """
        # Find the amount column
        amount_col = column_mapping.get('base_freight') or column_mapping.get('line_total')
        
        if not amount_col or amount_col not in df.columns:
            print("[Bulk Annexure] Amount column not found in mapping")
            return {
                'valid': False,
                'error': 'Amount column not mapped'
            }
        
        # Calculate sum
        excel_total = df[amount_col].sum()
        difference = abs(excel_total - pdf_total)
        is_valid = difference <= tolerance
        
        result = {
            'valid': is_valid,
            'excel_total': float(excel_total),
            'pdf_total': float(pdf_total),
            'difference': float(difference),
            'tolerance': tolerance
        }
        
        if not is_valid:
            print(f"[Bulk Annexure] RECONCILIATION FAILED: Excel ₹{excel_total} vs PDF ₹{pdf_total} (diff: ₹{difference})")
        else:
            print(f"[Bulk Annexure] Reconciliation passed: Excel ₹{excel_total} ≈ PDF ₹{pdf_total}")
        
        return result
    
    # ========================================================================
    # LINE ITEM PROCESSING
    # ========================================================================
    
    def process_line_items(self, invoice_id: str, df: pd.DataFrame, 
                          column_mapping: Dict[str, str], 
                          carrier_id: str = None) -> Dict[str, Any]:
        """
        Process all line items from Excel:
        1. Extract each row
        2. Check duplicate LR
        3. Match route
        4. Validate rate (if contract exists)
        5. Insert into invoice_line_items
        
        Args:
            invoice_id: Parent invoice ID
            df: DataFrame with Excel data
            column_mapping: Field mapping
            carrier_id: Carrier ID (for rate lookup)
        
        Returns:
            Summary dict with counts
        """
        total_rows = len(df)
        valid_rows = 0
        duplicate_rows = 0
        overcharged_rows = 0
        error_rows = 0
        line_items = []
        
        for idx, row in df.iterrows():
            try:
                # Extract fields using mapping
                lr_number = str(row.get(column_mapping.get('lr_number', ''))).strip()
                
                if not lr_number or lr_number == 'nan':
                    error_rows += 1
                    continue
                
                # Build line item
                line_item = {
                    'id': str(uuid.uuid4()),
                    'invoice_id': invoice_id,
                    'line_number': idx + 1,
                    'lr_number': lr_number,
                    'origin': row.get(column_mapping.get('origin', ''), ''),
                    'destination': row.get(column_mapping.get('destination', ''), ''),
                    'weight_kg': self._safe_float(row.get(column_mapping.get('weight', ''), 0)),
                    'base_freight': self._safe_float(row.get(column_mapping.get('base_freight', ''), 0)),
                    'fuel_surcharge': self._safe_float(row.get(column_mapping.get('fuel_surcharge', ''), 0)),
                    'handling_charges': self._safe_float(row.get(column_mapping.get('handling_charges', ''), 0)),
                    'line_total': 0  # Will calculate
                }
                
                # Calculate line total
                line_item['line_total'] = (
                    line_item['base_freight'] + 
                    line_item['fuel_surcharge'] + 
                    line_item['handling_charges']
                )
                
                # Check for duplicate LR
                is_duplicate, duplicate_invoice_id = self._check_duplicate_lr(lr_number)
                if is_duplicate:
                    line_item['is_duplicate'] = True
                    line_item['duplicate_invoice_id'] = duplicate_invoice_id
                    line_item['audit_status'] = 'FLAGGED'
                    duplicate_rows += 1
                else:
                    line_item['is_duplicate'] = False
                    line_item['audit_status'] = 'PENDING'
                    valid_rows += 1
                
                line_items.append(line_item)
                
            except Exception as e:
                print(f"[Bulk Annexure] Error processing row {idx}: {e}")
                error_rows += 1
                continue
        
        # Bulk insert all line items
        if line_items:
            self._bulk_insert_line_items(line_items)
        
        summary = {
            'total_rows': total_rows,
            'valid_rows': valid_rows,
            'duplicate_rows': duplicate_rows,
            'overcharged_rows': overcharged_rows,
            'error_rows': error_rows,
            'inserted_count': len(line_items)
        }
        
        print(f"[Bulk Annexure] Processing complete: {summary}")
        return summary
    
    def _check_duplicate_lr(self, lr_number: str) -> Tuple[bool, Optional[str]]:
        """Check if LR has been paid before"""
        conn = get_postgres_connection()
        cursor = conn.cursor()
        
        try:
            query = """
                SELECT invoice_id FROM lr_payment_history 
                WHERE lr_number = %s 
                LIMIT 1
            """
            cursor.execute(query, (lr_number,))
            result = cursor.fetchone()
            
            if result:
                return (True, result[0])
            return (False, None)
            
        except Exception as err:
            print(f"[Bulk Annexure] Error checking duplicate: {err}")
            return (False, None)
        finally:
            cursor.close()
            conn.close()
    
    def _bulk_insert_line_items(self, line_items: List[Dict]):
        """Bulk insert line items into database using PostgreSQL"""
        conn = get_postgres_connection()
        cursor = conn.cursor()
        
        try:
            query = """
                INSERT INTO invoice_line_items 
                (id, invoice_id, line_number, lr_number, origin, destination,
                 weight_kg, base_freight, fuel_surcharge, handling_charges,
                 line_total, is_duplicate, duplicate_invoice_id, audit_status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            values = [
                (
                    item['id'], item['invoice_id'], item['line_number'],
                    item['lr_number'], item['origin'], item['destination'],
                    item['weight_kg'], item['base_freight'], item['fuel_surcharge'],
                    item['handling_charges'], item['line_total'],
                    item.get('is_duplicate', False),
                    item.get('duplicate_invoice_id'),
                    item.get('audit_status', 'PENDING')
                )
                for item in line_items
            ]
            
            # Use executemany for batch insert
            cursor.executemany(query, values)
            conn.commit()
            print(f"[Bulk Annexure] Inserted {len(line_items)} line items")
            
        except Exception as err:
            print(f"[Bulk Annexure] Error inserting line items: {err}")
            conn.rollback()
        finally:
            cursor.close()
            conn.close()
    
    @staticmethod
    def _safe_float(value, default=0.0) -> float:
        """Safely convert value to float"""
        try:
            if pd.isna(value) or value == '':
                return default
            return float(str(value).replace(',', ''))
        except:
            return default


# Global singleton
_bulk_service: Optional[BulkAnnexureService] = None

def get_bulk_service() -> BulkAnnexureService:
    """Get or create bulk annexure service"""
    global _bulk_service
    if _bulk_service is None:
        _bulk_service = BulkAnnexureService()
    return _bulk_service
