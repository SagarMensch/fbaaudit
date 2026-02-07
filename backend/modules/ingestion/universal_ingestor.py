import os
import pandas as pd
from typing import Dict, Any, List, Optional
from docling.document_converter import DocumentConverter
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions

class UniversalIngestor:
    """
    Layer 0: Universal Ingestion
    Unified parsing of PDF, Excel, and Images into a rich structured format.
    integrates Docling for layout-aware parsing.
    """
    
    def __init__(self):
        # Configure Docling options
        self.pipeline_options = PdfPipelineOptions()
        self.pipeline_options.do_ocr = True
        self.pipeline_options.do_table_structure = True
        
        # Initialize converter
        self.doc_converter = DocumentConverter(
            allowed_formats=[
                InputFormat.PDF,
                InputFormat.IMAGE,
                InputFormat.DOCX,
                InputFormat.PPTX,
                InputFormat.HTML
            ],
            format_options={
                InputFormat.PDF: self.pipeline_options
            }
        )

    def ingest(self, file_path: str) -> Dict[str, Any]:
        """
        Ingest a file and return a structured representation.
        Supports: PDF, Images (via Docling), Excel (via Pandas), Email (Text).
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        file_ext = os.path.splitext(file_path)[1].lower()

        try:
            if file_ext in ['.xlsx', '.xls', '.csv']:
                return self._ingest_tabular(file_path, file_ext)
            elif file_ext in ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.docx', '.pptx', '.html']:
                return self._ingest_document(file_path)
            elif file_ext in ['.eml', '.msg']:
                return self._ingest_email(file_path) # Placeholder for now
            else:
                raise ValueError(f"Unsupported file format: {file_ext}")
        except Exception as e:
            return {
                "status": "error",
                "file_path": file_path,
                "error": str(e)
            }

    def _ingest_document(self, file_path: str) -> Dict[str, Any]:
        """
        Use Docling to parse documents (PDF, Images, etc.) preserving layout.
        Returns a simplified structured format.
        """
        print(f"Processing document with Docling: {file_path}")
        conv_result = self.doc_converter.convert(file_path)
        doc = conv_result.document
        
        # Convert to Markdown for LLM consumption
        markdown_content = doc.export_to_markdown()
        
        # Extract tables specifically if needed
        tables = []
        for table in doc.tables:
            # Simple representation of tables
            tables.append({
                "data": table.export_to_dataframe().to_dict(orient='records'),
                "grid": table.export_to_html() # or another grid format
            })

        return {
            "status": "success",
            "type": "document",
            "content_markdown": markdown_content,
            "tables": tables,
            "meta": doc.metadata if hasattr(doc, 'metadata') else {}
        }

    def _ingest_tabular(self, file_path: str, ext: str) -> Dict[str, Any]:
        """
        Use Pandas for native tabular data (Excel, CSV).
        """
        print(f"Processing tabular data: {file_path}")
        dfs = []
        if ext == '.csv':
            df = pd.read_csv(file_path)
            dfs.append({"sheet": "Sheet1", "data": df.to_dict(orient='records')})
        else:
            # Excel
            xls = pd.ExcelFile(file_path)
            for sheet_name in xls.sheet_names:
                df = pd.read_excel(xls, sheet_name=sheet_name)
                dfs.append({"sheet": sheet_name, "data": df.to_dict(orient='records')})
        
        # Construct a markdown representation for consistency
        markdown_repr = ""
        for sheet in dfs:
            markdown_repr += f"## Sheet: {sheet['sheet']}\n"
            if sheet['data']:
                df_preview = pd.DataFrame(sheet['data'])
                markdown_repr += df_preview.to_markdown(index=False)
            markdown_repr += "\n\n"

        return {
            "status": "success",
            "type": "tabular",
            "content_markdown": markdown_repr,
            "sheets": dfs
        }

    def _ingest_email(self, file_path: str) -> Dict[str, Any]:
        # Placeholder for Email ingestion
        return {
            "status": "success",
            "type": "email",
            "content_markdown": f"Email content from {file_path} (parsing not implemented yet).",
        }

if __name__ == "__main__":
    # verification test
    ingestor = UniversalIngestor()
    print("UniversalIngestor initialized.")
