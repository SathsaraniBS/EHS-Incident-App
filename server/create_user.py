# server/create_user.py
# Run: python create_user.py   (server folder , venv activate)
import getpass

from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.user import User

Base.metadata.create_all(bind=engine)  


def main():
    email = input("Email: ").strip().lower()
    full_name = input("Full name: ").strip()
    role = input("Role (admin/client) [client]: ").strip().lower() or "client"
    if role not in ("admin", "client"):
        raise SystemExit("Role must be 'admin' or 'client'")

    password = getpass.getpass("Password (min 8 chars): ")
    if len(password) < 8:
        raise SystemExit("Password too short")
    if password != getpass.getpass("Confirm password: "):
        raise SystemExit("Passwords do not match")

    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == email).first():
            raise SystemExit("User already exists")
        db.add(
            User(
                email=email,
                full_name=full_name,
                role=role,
                hashed_password=hash_password(password),
            )
        )
        db.commit()
        print(f"✅ Created {role}: {email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()