    # backend/models.py
from sqlalchemy import create_engine, Column, String, Integer, DateTime, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "db.sqlite3")
ENGINE = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread":False})
Session = sessionmaker(bind=ENGINE)
db_session = Session()
Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True)
    filename = Column(String)
    path = Column(String)
    lang = Column(String, default="hin")
    ocr_text = Column(Text)
    summary = Column(Text)
    corrected_text = Column(Text)
    created_at = Column(DateTime)

class QuizResult(Base):
    __tablename__ = "quiz_results"
    id = Column(Integer, primary_key=True, autoincrement=True)
    doc_id = Column(String)
    score = Column(Float)
    details = Column(Text)
    created_at = Column(DateTime)

def init_db():
    Base.metadata.create_all(ENGINE)
