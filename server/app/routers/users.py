# server/app/routers/users.py
import re

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password
from app.models.user import User
from app.routers.auth import require_role

router = APIRouter(prefix="/api/v1/users", tags=["Users"])

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
ROLES = ("admin", "client")


def _check_password(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters")
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Password is too long (max 72 bytes)")
    return value


def _check_email(value: str) -> str:
    value = value.strip().lower()
    if not EMAIL_RE.match(value):
        raise ValueError("Invalid email address")
    return value


def _check_name(value: str) -> str:
    value = value.strip()
    if not value:
        raise ValueError("Full name is required")
    return value


def _check_role(value: str) -> str:
    if value not in ROLES:
        raise ValueError("Role must be 'admin' or 'client'")
    return value


# ---------- Schemas ----------
class UserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    full_name: str = Field(min_length=1, max_length=120)
    role: str = "client"
    password: str

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        return _check_email(v)

    @field_validator("full_name")
    @classmethod
    def _name(cls, v: str) -> str:
        return _check_name(v)

    @field_validator("role")
    @classmethod
    def _role(cls, v: str) -> str:
        return _check_role(v)

    @field_validator("password")
    @classmethod
    def _pw(cls, v: str) -> str:
        return _check_password(v)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=120)
    email: str | None = Field(default=None, max_length=254)
    role: str | None = None
    is_active: bool | None = None
    password: str | None = None  # password reset

    @field_validator("full_name")
    @classmethod
    def _name(cls, v):
        return _check_name(v) if v is not None else v

    @field_validator("email")
    @classmethod
    def _email(cls, v):
        return _check_email(v) if v is not None else v

    @field_validator("role")
    @classmethod
    def _role(cls, v):
        return _check_role(v) if v is not None else v

    @field_validator("password")
    @classmethod
    def _pw(cls, v):
        return _check_password(v) if v is not None else v


class UserListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    is_active: bool


# ---------- Endpoints (admin only) ----------
@router.get("/", response_model=list[UserListItem])
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    return db.query(User).order_by(User.id.asc()).all()


@router.post("/", response_model=UserListItem, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "A user with this email already exists")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role,
        hashed_password=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserListItem)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    if user.id == admin.id:
        if payload.is_active is False:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot deactivate your own account")
        if payload.role is not None and payload.role != "admin":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot remove your own admin role")

    if payload.email is not None and payload.email != user.email:
        clash = db.query(User).filter(User.email == payload.email, User.id != user.id).first()
        if clash:
            raise HTTPException(status.HTTP_409_CONFLICT, "A user with this email already exists")
        user.email = payload.email

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password is not None:
        user.hashed_password = hash_password(payload.password)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if user.id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot delete your own account")

    db.delete(user)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)