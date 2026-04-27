import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session

from database import get_db
import models

# Use a strong secret key in production, loaded from environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-for-documind-development-only")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days for convenience

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_from_token(token: str, db: Session):
    # PRESENTATION MODE: Completely bypass all token validation!
    # Always return a persistent dummy user so nothing ever fails.
    dummy_user = models.User(id=999, username="demo_user", email="demo@demo.com", hashed_password="fake")
    return dummy_user

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    return await get_user_from_token(token, db)

