# server/seed_scorecard.py
# Loads the "1st & 2nd Week, November 2026" Dashboard sheet into the database.
#   python seed_scorecard.py            (add; safe to run twice)
#   python seed_scorecard.py --reset    (remove this cycle again)
import sys

from app.core.database import Base, SessionLocal, engine
from app.models.incident import Section
from app.models.scorecard import AuditCycle, SectionScore

CYCLE_LABEL = "1st & 2nd Week, November 2026"

# no, section, responsible, allocated, actual, adjustable
ROWS = [
    (1, "General Maintenance", "Ruwandika", 465, 305, 350),
    (2, "Admin", "Dalton", 275, 205, 255),
    (3, "RM Stores", "Chandrasiri", 235, 220, 230),
    (4, "FG", "Chandrasiri", 155, 140, 140),
    (5, "Accessories", "Sampath", 230, 145, 185),
    (6, "Cutting", "Chamila", 155, 155, 155),
    (7, "Ground floor modules & Molding", "Gamini", 265, 195, 225),
    (8, "Packing", "Gamini", 140, 140, 140),
    (9, "Audit room & Final Inspection", "Lalinda", 95, 95, 95),
    (10, "Lab & CPI", "Chandani", 130, 120, 130),
    (11, "Screen Printing & Modules", "Gamini", 210, 125, 140),
    (12, "Sample Room", "Samitha", 180, 180, 180),
    (13, "Coating", "Chandani", 205, 190, 190),
    (14, "Forte", "Cooray", 180, 170, 180),
    (15, "IE", "Dilan", 220, 130, 150),
    (16, "Training School", "Dilan", 130, 130, 130),
    (17, "Medical Centre", "Nadee", 100, 95, 95),
]

# Totals quoted from the workbook, used as a sanity check after loading.
EXPECTED_ALLOCATED = 3370
EXPECTED_ACTUAL = 2740


def reset(db):
    n = db.query(AuditCycle).filter(AuditCycle.label == CYCLE_LABEL).delete(synchronize_session=False)
    db.commit()
    print(f"Removed {n} cycle(s) (their score rows cascade).")


def seed(db):
    if db.query(AuditCycle).filter(AuditCycle.label == CYCLE_LABEL).first():
        print(f'Cycle "{CYCLE_LABEL}" already exists - nothing to do. Use --reset to reload it.')
        return

    sections_by_name = {(s.name or "").strip().lower(): s for s in db.query(Section).all()}

    cycle = AuditCycle(label=CYCLE_LABEL)
    unmatched = []
    for no, name, who, allocated, actual, adjustable in ROWS:
        match = sections_by_name.get(name.strip().lower())
        if not match:
            unmatched.append(name)
        cycle.scores.append(
            SectionScore(
                sort_no=no,
                section_name=name,
                responsible_name=who,
                section_id=match.id if match else None,
                allocated=allocated,
                actual=actual,
                adjustable=adjustable,
            )
        )
    db.add(cycle)
    db.commit()

    tot_alloc = sum(r[3] for r in ROWS)
    tot_actual = sum(r[4] for r in ROWS)
    tot_adj = sum(r[5] for r in ROWS)
    print(f'Added cycle "{CYCLE_LABEL}" with {len(ROWS)} sections.')
    print(f"Totals: allocated={tot_alloc}, actual={tot_actual}, adjustable={tot_adj}")
    if (tot_alloc, tot_actual) != (EXPECTED_ALLOCATED, EXPECTED_ACTUAL):
        print(f"WARNING: expected allocated={EXPECTED_ALLOCATED}, actual={EXPECTED_ACTUAL}. Check the ROWS list.")
    if unmatched:
        print("Not linked to a Sections Audit section (name differs in the database):")
        for n in unmatched:
            print(f"  - {n}")


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        reset(db) if "--reset" in sys.argv else seed(db)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()