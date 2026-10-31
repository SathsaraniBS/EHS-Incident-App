# server/app/core/security.py
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt  # PyJWT
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
REMEMBER_ME_DAYS = int(os.getenv("REMEMBER_ME_DAYS", "7"))

if len(JWT_SECRET) < 32:
    raise RuntimeError(
        "JWT_SECRET is missing or too short (min 32 chars). Set it in server/.env"
    )


def hash_password(password: str) -> str:
    # bcrypt allows max 72 bytes
    if len(password.encode("utf-8")) > 72:
        raise ValueError("Password must be 72 bytes or fewer")
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


DUMMY_HASH = hash_password("dummy-password-for-timing")


def create_access_token(*, user_id: int, role: str, remember_me: bool = False) -> tuple[str, int]:
    """Returns (token, expires_in_seconds)."""
    delta = (
        timedelta(days=REMEMBER_ME_DAYS)
        if remember_me
        else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": now + delta,
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, int(delta.total_seconds())


def decode_access_token(token: str) -> dict:
    """Returns user_id and role."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])