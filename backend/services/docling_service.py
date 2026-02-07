"""
Docling Document Processing Service - Layer 0
================================================
Unified document intelligence layer using Docling for:
- Excel files (xlsx, xls, csv)
- PDF documents
- Word documents (docx, doc)
- Images
- OCR processing

This is the BASE LAYER for all document processing in the application.
"""
import logging
from typing import Dict, List, Any, Optional
from pathlib import Path
import pandas as pd

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lazy import Docling components
_docling_converter = None
_docling_options = None

def get_docling():
    """Lazy load Docling library with proper configuration"""
    global _docling_converter, _docling_options
    if _docling_converter is None:
        try:
            from docling.document_converter import DocumentConverter
            from docling.datamodel.base_models import InputFormat
            from docling.backend.msexcel_backend import MsExcelBackendOptions
            from docling.datamodel.pipeline_options import PdfPipelineOptions
            
            # Configure Docling for proper Excel parsing
            _docling_options = {
                'InputFormat': InputFormat,
                'MsExcelBackendOptions': MsExcelBackendOptions,
                'PdfPipelineOptions': PdfPipelineOptions
            }
            _docling_converter = DocumentConverter
            logger.info("Docling library loaded with Excel support")
        except ImportError as e:
            logger.error(f"Docling import error: {e}")
            raise ImportError(f"Docling not properly installed: {e}")
    return _docling_converter, _docling_options


class DoclingService:
    """
    Docling-powered document processing service
    Handles ALL document types through a single interface
    LAYER 0: All document processing goes through Docling
    """
    
    def __init__(self):
        self.converter = None
        self.options = None
        logger.info("DoclingService initialized (Layer 0)")
    
    def _get_converter(self):
        """Get or create Docling converter instance with proper configuration"""
        if self.converter is None:
            DocumentConverter, options = get_docling()
            self.options = options
            
            # Create converter with Excel support enabled
            self.converter = DocumentConverter()
            logger.info("Docling DocumentConverter ready with Excel support")
        return self.converter
    
    def process_excel(self, file_path: str) -> Dict[str, Any]:
        """
        Process Excel file using ONLY Docling
        
        Docling extracts tables from Excel and returns structured data.
        This is Layer 0 - ALL document processing uses Docling.
        
        Args:
            file_path: Path to Excel file (.xlsx, .xls, .csv)
        
        Returns:
            Dict containing:
                - sheets: Dict of sheet_name -> pandas DataFrame
                - metadata: File metadata
                - success: Boolean status
        """
        try:
            logger.info(f"Processing Excel file with Docling: {file_path}")
            
            converter = self._get_converter()
            
            # Convert with Docling
            result = converter.convert(file_path)
            
            sheets = {}
            total_rows = 0
            
            # Extract document from result
            if hasattr(result, 'document'):
                if hasattr(result, 'document'):
                    doc = result.document
                    
                    # Export to markdown and parse tables
                    if hasattr(doc, 'export_to_markdown'):
                        markdown_content = doc.export_to_markdown()
                        logger.info(f"Docling extracted {len(markdown_content)} chars of content")
                    
                    # Extract tables from Docling document
                    if hasattr(doc, 'tables') and doc.tables:
                        logger.info(f"Found {len(doc.tables)} table(s) in document")
                        
                        for idx, table in enumerate(doc.tables):
                            sheet_name = f"Sheet{idx + 1}"
                            
                            # Try different methods to convert table to DataFrame
                            df = None
                            
                            if hasattr(table, 'export_to_dataframe'):
                                df = table.export_to_dataframe()
                            elif hasattr(table, 'to_dataframe'):
                                df = table.to_dataframe()
                            elif hasattr(table, 'data'):
                                # Handle TableData structure
                                table_data = table.data
                                if hasattr(table_data, 'grid'):
                                    # Build DataFrame from grid
                                    rows = []
                                    for row in table_data.grid:
                                        row_data = []
                                        for cell in row:
                                            cell_text = cell.text if hasattr(cell, 'text') else str(cell)
                                            row_data.append(cell_text)
                                        rows.append(row_data)
                                    if rows:
                                        df = pd.DataFrame(rows[1:], columns=rows[0] if rows else None)
                                else:
                                    df = pd.DataFrame(table_data)
                            
                            if df is not None:
                                sheets[sheet_name] = df
                                total_rows += len(df)
                                logger.info(f"  - {sheet_name}: {len(df)} rows, {len(df.columns)} columns")
                    
                    # If no tables found, try to extract content as single table
                    if not sheets:
                        logger.warning("No tables extracted by Docling, check file format")
            
            if sheets:
                logger.info(f"Docling extracted {len(sheets)} sheet(s), {total_rows} total rows")
            else:
                logger.warning("No data extracted from Excel file")
            
            return {
                "success": bool(sheets),
                "file_path": file_path,
                "sheets": sheets,
                "sheet_names": list(sheets.keys()),
                "total_sheets": len(sheets),
                "total_rows": total_rows,
                "metadata": {
                    "file_name": Path(file_path).name,
                    "file_size": Path(file_path).stat().st_size if Path(file_path).exists() else 0,
                    "processor": "Docling Layer 0"
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing Excel with Docling: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e),
                "file_path": file_path
            }
    
    def process_pdf(self, file_path: str) -> Dict[str, Any]:
        """
        Process PDF using Docling
        
        Args:
            file_path: Path to PDF file
        
        Returns:
            Dict containing extracted text, tables, images, and metadata
        """
        try:
            logger.info(f"Processing PDF file: {file_path}")
            
            converter = self._get_converter()
            result = converter.convert(file_path)
            
            # Extract content from Docling result
            text = ""
            tables = []
            images = []
            
            if hasattr(result, 'document'):
                doc = result.document
                
                # Extract text
                if hasattr(doc, 'text') or hasattr(doc, 'export_to_markdown'):
                    text = doc.export_to_markdown() if hasattr(doc, 'export_to_markdown') else str(doc.text)
                
                # Extract tables
                if hasattr(doc, 'tables'):
                    for table in doc.tables:
                        if hasattr(table, 'to_dataframe'):
                            tables.append(table.to_dataframe())
                        elif hasattr(table, 'data'):
                            tables.append(pd.DataFrame(table.data))
                
                # Extract images/figures
                if hasattr(doc, 'pictures'):
                    images = [img for img in doc.pictures]
            
            logger.info(f"PDF processed: {len(text)} chars, {len(tables)} tables, {len(images)} images")
            
            return {
                "success": True,
                "file_path": file_path,
                "text": text,
                "tables": tables,
                "images": images,
                "page_count": len(text.split('\n\n')) if text else 0,
                "metadata": {
                    "file_name": Path(file_path).name,
                    "file_size": Path(file_path).stat().st_size if Path(file_path).exists() else 0
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing PDF with Docling: {e}")
            return {
                "success": False,
                "error": str(e),
                "file_path": file_path
            }
    
    def process_any_document(self, file_path: str) -> Dict[str, Any]:
        """
        Process any document type using Docling auto-detection
        
        Args:
            file_path: Path to any document
        
        Returns:
            Dict containing extracted content and metadata
        """
        try:
            file_ext = Path(file_path).suffix.lower()
            
            # Route to specific processor based on file type
            if file_ext in ['.xlsx', '.xls', '.csv']:
                return self.process_excel(file_path)
            elif file_ext == '.pdf':
                return self.process_pdf(file_path)
            else:
                # Use generic Docling processing
                logger.info(f"Processing document: {file_path}")
                converter = self._get_converter()
                result = converter.convert(file_path)
                
                return {
                    "success": True,
                    "file_path": file_path,
                    "result": result,
                    "file_type": file_ext
                }
        
        except Exception as e:
            logger.error(f"Error processing document: {e}")
            return {
                "success": False,
                "error": str(e),
                "file_path": file_path
            }


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_docling_service: Optional[DoclingService] = None

def get_docling_service() -> DoclingService:
    """Get or create singleton Docling service instance"""
    global _docling_service
    if _docling_service is None:
        _docling_service = DoclingService()
    return _docling_service


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def read_excel_file(file_path: str) -> Dict[str, pd.DataFrame]:
    """
    Read Excel file and return dict of DataFrames
    
    Args:
        file_path: Path to Excel file
    
    Returns:
        Dict of sheet_name -> DataFrame
    """
    service = get_docling_service()
    result = service.process_excel(file_path)
    
    if result.get("success"):
        return result.get("sheets", {})
    else:
        logger.error(f"Failed to read Excel: {result.get('error')}")
        return {}


def read_pdf_file(file_path: str) -> Dict[str, Any]:
    """
    Read PDF file and extract content
    
    Args:
        file_path: Path to PDF file
    
    Returns:
        Dict containing text, tables, images
    """
    service = get_docling_service()
    return service.process_pdf(file_path)
