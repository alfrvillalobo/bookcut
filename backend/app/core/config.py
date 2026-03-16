from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720
    APP_NAME: str = "BookCut"
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    RESEND_API_KEY: str = ""
    BARBERSHOP_NAME: str = "BookCut Barbería"
    BARBERSHOP_EMAIL: str = ""

    class Config:
        env_file = ".env"

settings = Settings()