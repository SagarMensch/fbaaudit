"""
Startup script for FastAPI backend server
"""
import uvicorn
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("🚀 Starting SequelString AI Control Tower Backend...")
    print("📍 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/health")
    print("💬 Chat Endpoint: http://localhost:8000/api/chat")
    print("🔄 Workflow Endpoint: http://localhost:8000/api/workflows/invoice/process")
    print("\n" + "="*60 + "\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
