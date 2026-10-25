import sys
import os
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, DATABASE_URL
from app.models.incident import Section, AuditChecklist

# 1. Database Connection
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

EXCEL_FILE = "Octomber 3st &4nd week health and Safety audit score.xlsx"

# 17 Sections Mapping (Excel Sheet Name -> DB Section Name & Responsible Person)
sections_config = [
    ("General Maintenance", "General Maintenance", "Ruwandika"),
    ("Admin", "Admin", "Dalton"),
    ("RM Stores", "RM Stores", "Chandrasiri"),
    ("FG", "FG", "Chandrasiri"),
    ("Accessories", "Accessories", "Sampath"),
    ("Cutting", "Cutting", "Chamila"),
    ("Ground floor modules & Molding", "Ground floor modules & Molding", "Gamini"),
    ("Packing ", "Packing", "Gamini"),
    ("Audit room & Final Inspection", "Audit room & Final Inspection", "Lalinda"),
    ("Lab & CPI", "Lab & CPI", "Chandani"),
    ("Screen Printing & Modules", "Screen Printing & Modules", "Gamini"),
    ("Sample Room", "Sample Room", "Samitha"),
    ("Coating", "Coating", "Chandani"),
    ("Forte ", "Forte", "Cooray"),
    ("IE", "IE", "Dilan"),
    ("Training School", "Training School", "Dilan"),
    ("Medical Centre", "Medical Centre", "Nadee")
]

def seed_database():
    print("--- Starting Database Seeding ---")
    
    # 1. Seed Sections
    for sheet_name, sec_name, resp in sections_config:
        existing_sec = db.query(Section).filter(Section.name == sec_name).first()
        if not existing_sec:
            sec = Section(name=sec_name, responsible_person=resp)
            db.add(sec)
            db.commit()
            db.refresh(sec)
            print(f"Created Section: {sec_name}")

    # 2. Seed Checklists from Excel Sheets
    xls = pd.ExcelFile(EXCEL_FILE)
    
    for sheet_name, sec_name, resp in sections_config:
        if sheet_name not in xls.sheet_names:
            print(f"Sheet '{sheet_name}' not found in Excel!")
            continue

        section_obj = db.query(Section).filter(Section.name == sec_name).first()
        if not section_obj:
            continue

        df = pd.read_excel(EXCEL_FILE, sheet_name=sheet_name)
        
        # Find header row index containing 'Description' and 'Allocated'
        header_row_idx = None
        for i, row in df.iterrows():
            row_str = str(row.values)
            if 'Description' in row_str and ('Allocated' in row_str or 'Score' in row_str):
                header_row_idx = i
                break

        if header_row_idx is not None:
            # Parse rows below header
            current_category = "General"
            for i in range(header_row_idx + 1, len(df)):
                row = df.iloc[i]
                col1 = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""
                col2 = str(row.iloc[2]).strip() if pd.notna(row.iloc[2]) else ""
                col_score = row.iloc[4] if len(row) > 4 and pd.notna(row.iloc[4]) else None

                # Check if col1 is a category header (e.g. 'Emergency Response', 'Washrooms')
                if col1 and col1 != 'nan' and (not col2 or col2 == 'nan' or col2.isdigit() == False):
                    # Sometimes col1 is category and col2 has description
                    if col2 and col2 != 'nan' and col2.isdigit():
                        pass # It's an item number
                    else:
                        current_category = col1
                        continue

                # If col2 has description and score is a number
                if col2 and col2 != 'nan' and col_score is not None:
                    try:
                        score = int(col_score)
                        # Check if checklist already exists to avoid duplicates
                        exists = db.query(AuditChecklist).filter(
                            AuditChecklist.section_id == section_obj.id,
                            AuditChecklist.description == col2
                        ).first()
                        
                        if not exists:
                            checklist = AuditChecklist(
                                section_id=section_obj.id,
                                category=current_category,
                                description=col2,
                                allocated_score=score
                            )
                            db.add(checklist)
                    except ValueError:
                        pass
            db.commit()
            print(f"Checklists seeded for section: {sec_name}")

    print("--- Database Seeding Completed Successfully! ---")

if __name__ == "__main__":
    seed_database()