"""
Supabase Storage Service - Enterprise Document Management
==========================================================
Provides file upload/download operations using Supabase Storage (S3-compatible).

Usage:
    from services.storage_service import storage_service
    
    # Upload
    url = await storage_service.upload_document('invoices', file_bytes, 'path/to/file.pdf')
    
    # Get signed URL (for private buckets)
    signed_url = storage_service.get_signed_url('invoices', 'path/to/file.pdf', expires_in=3600)
    
    # Download
    file_bytes = await storage_service.download_document('invoices', 'path/to/file.pdf')
"""

import os
import logging
from typing import Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://nwyrcwizbmdvuntgqygd.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", os.getenv("SUPABASE_KEY", ""))

# Initialize Supabase client
_supabase_client = None

def get_supabase_client():
    """Lazy initialization of Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        try:
            from supabase import create_client, Client
            if not SUPABASE_URL or not SUPABASE_ANON_KEY:
                logger.error("Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env")
                return None
            _supabase_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
            logger.info(f"✅ Supabase client initialized: {SUPABASE_URL}")
        except ImportError:
            logger.error("supabase package not installed. Run: pip install supabase")
            return None
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            return None
    return _supabase_client


class StorageService:
    """Enterprise-grade document storage using Supabase Storage."""
    
    DEFAULT_BUCKET = "invoices"
    
    def __init__(self):
        self.client = None
    
    def _get_client(self):
        """Get or initialize the Supabase client."""
        if self.client is None:
            self.client = get_supabase_client()
        return self.client
    
    async def upload_document(
        self, 
        bucket: str, 
        file_bytes: bytes, 
        path: str,
        content_type: str = "application/pdf"
    ) -> Tuple[bool, Optional[str]]:
        """
        Upload a document to Supabase Storage.
        
        Args:
            bucket: Storage bucket name (e.g., 'invoices')
            file_bytes: File content as bytes
            path: Path within bucket (e.g., 'invoices/GPT_24-25_1145/invoice.pdf')
            content_type: MIME type of the file
            
        Returns:
            Tuple of (success, public_url or error_message)
        """
        client = self._get_client()
        if not client:
            return False, "Supabase client not initialized"
        
        try:
            # Upload to Supabase Storage
            response = client.storage.from_(bucket).upload(
                path=path,
                file=file_bytes,
                file_options={"content-type": content_type}
            )
            
            # Get public URL (for public buckets) or path for signed URL
            public_url = client.storage.from_(bucket).get_public_url(path)
            
            logger.info(f"✅ Uploaded document: {bucket}/{path}")
            return True, public_url
            
        except Exception as e:
            error_msg = str(e)
            # Handle duplicate file - try to update instead
            if "Duplicate" in error_msg or "already exists" in error_msg.lower():
                try:
                    # Update existing file
                    client.storage.from_(bucket).update(
                        path=path,
                        file=file_bytes,
                        file_options={"content-type": content_type}
                    )
                    public_url = client.storage.from_(bucket).get_public_url(path)
                    logger.info(f"✅ Updated existing document: {bucket}/{path}")
                    return True, public_url
                except Exception as update_err:
                    logger.error(f"❌ Failed to update document: {update_err}")
                    return False, str(update_err)
            
            logger.error(f"❌ Failed to upload document: {e}")
            return False, error_msg
    
    def get_signed_url(
        self, 
        bucket: str, 
        path: str, 
        expires_in: int = 3600
    ) -> Optional[str]:
        """
        Get a signed URL for private bucket access.
        
        Args:
            bucket: Storage bucket name
            path: Path to the file within the bucket
            expires_in: URL expiration time in seconds (default: 1 hour)
            
        Returns:
            Signed URL string or None if failed
        """
        client = self._get_client()
        if not client:
            return None
        
        try:
            response = client.storage.from_(bucket).create_signed_url(
                path=path,
                expires_in=expires_in
            )
            
            if response and 'signedURL' in response:
                return response['signedURL']
            elif response and 'signed_url' in response:
                return response['signed_url']
            
            logger.warning(f"Signed URL response unexpected format: {response}")
            return None
            
        except Exception as e:
            logger.error(f"❌ Failed to get signed URL: {e}")
            return None
    
    def get_public_url(self, bucket: str, path: str) -> str:
        """
        Get public URL for a file in a public bucket.
        
        Args:
            bucket: Storage bucket name
            path: Path to the file
            
        Returns:
            Public URL string
        """
        client = self._get_client()
        if not client:
            return ""
        
        return client.storage.from_(bucket).get_public_url(path)
    
    async def download_document(self, bucket: str, path: str) -> Optional[bytes]:
        """
        Download a document from Supabase Storage.
        
        Args:
            bucket: Storage bucket name
            path: Path to the file
            
        Returns:
            File content as bytes or None if failed
        """
        client = self._get_client()
        if not client:
            return None
        
        try:
            response = client.storage.from_(bucket).download(path)
            return response
        except Exception as e:
            logger.error(f"❌ Failed to download document: {e}")
            return None
    
    async def delete_document(self, bucket: str, path: str) -> bool:
        """
        Delete a document from Supabase Storage.
        
        Args:
            bucket: Storage bucket name
            path: Path to the file
            
        Returns:
            True if deleted successfully
        """
        client = self._get_client()
        if not client:
            return False
        
        try:
            client.storage.from_(bucket).remove([path])
            logger.info(f"✅ Deleted document: {bucket}/{path}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to delete document: {e}")
            return False
    
    def list_documents(self, bucket: str, folder: str = "") -> list:
        """
        List documents in a bucket/folder.
        
        Args:
            bucket: Storage bucket name
            folder: Optional folder path to list
            
        Returns:
            List of file metadata
        """
        client = self._get_client()
        if not client:
            return []
        
        try:
            response = client.storage.from_(bucket).list(folder)
            return response
        except Exception as e:
            logger.error(f"❌ Failed to list documents: {e}")
            return []


# Singleton instance
storage_service = StorageService()
