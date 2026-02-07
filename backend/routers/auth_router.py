from fastapi import APIRouter, HTTPException, Depends, Header, Body
from pydantic import BaseModel
from typing import Optional
from services.auth_service import auth_service_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Pydantic Models
class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    vendor_id: Optional[str] = None
    token: Optional[str] = None

class CreateUserRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "SUPPLIER"
    vendor_id: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None

class PasswordUpdateRequest(BaseModel):
    user_id: str
    password: str

@router.post("/login", response_model=dict)
async def login(request: LoginRequest):
    """
    Authenticate user and return session token.
    Uses secure PBKDF2-SHA256 hashing from auth_service.
    """
    user = auth_service_db.login(request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {
        "success": True,
        "user": user,
        "token": user.get("token")
    }

@router.get("/me", response_model=dict)
async def get_current_user(x_user_id: Optional[str] = Header(None, alias="X-User-ID")):
    """
    Get current user profile based on ID.
    (Simple identification for now, meant to be replaced by JWT in Phase 3)
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-ID header")
    
    user = auth_service_db.get_user_by_id(x_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {"success": True, "user": user}

@router.post("/register", response_model=dict)
async def register(request: CreateUserRequest):
    """
    Register a new user (Admin only in production, open for demo)
    """
    # Check if user exists
    existing = auth_service_db.get_user_by_email(request.email)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
        
    user_data = request.dict()
    user_id = auth_service_db.create_user(user_data)
    
    if not user_id:
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    return {"success": True, "message": "User created successfully", "user_id": user_id}

@router.put("/password", response_model=dict)
async def update_password(request: PasswordUpdateRequest):
    """
    Update user password
    """
    success = auth_service_db.update_password(request.user_id, request.password)
    if not success:
         raise HTTPException(status_code=500, detail="Failed to update password")
         
    return {"success": True, "message": "Password updated successfully"}
