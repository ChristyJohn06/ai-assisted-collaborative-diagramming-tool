from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from database import Base

class Diagram(Base):
    __tablename__ = "diagrams"

    id = Column(Integer, primary_key=True, index=True)
    owner = Column(String, index=True)
    title = Column(String, index=True)
    data_json = Column(Text)
    is_shared = Column(Boolean, default=False)
    created_at = Column(DateTime)
