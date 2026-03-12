from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://adityagautam01008gmail.com@localhost:5432/crm_hcp_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from database.models import Base
    Base.metadata.create_all(bind=engine)
    _seed_hcps()


def _seed_hcps():
    """Seed some sample HCPs for demo."""
    db = SessionLocal()
    try:
        from database.models import HCP
        if db.query(HCP).count() == 0:
            sample_hcps = [
                HCP(name="Dr. Anika Sharma", specialty="Oncology", hospital="AIIMS Delhi", email="anika.sharma@aiims.in"),
                HCP(name="Dr. Rajesh Mehta", specialty="Cardiology", hospital="Fortis Hospital", email="rajesh.mehta@fortis.in"),
                HCP(name="Dr. Priya Nair", specialty="Endocrinology", hospital="Apollo Hospital", email="priya.nair@apollo.in"),
                HCP(name="Dr. Vikram Singh", specialty="Nephrology", hospital="Max Hospital", email="vikram.singh@max.in"),
                HCP(name="Dr. Sunita Patel", specialty="Pulmonology", hospital="Medanta", email="sunita.patel@medanta.in"),
            ]
            db.add_all(sample_hcps)
            db.commit()
    finally:
        db.close()
