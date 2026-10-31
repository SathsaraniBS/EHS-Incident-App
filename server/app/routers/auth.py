from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    # 1. Find user by email in your PostgreSQL database
    # user = db.query(User).filter(User.email == credentials.email).first()
    
    # 2. Verify password (use bcrypt or passlib)
    # if not user or not verify_password(credentials.password, user.hashed_password):
    #     raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # 3. Return role-based data so frontends know where to redirect
    return {
        "access_token": "mock_jwt_token_12345",
        "token_type": "bearer",
        "role": "admin", # or "client"
        "user": {
            "email": credentials.email,
            "name": "Bss"
        }
    }