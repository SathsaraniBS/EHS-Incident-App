# server/seed_compliance.py
# Dev-only demo data. Run:  python seed_compliance.py          (add)
#                           python seed_compliance.py --reset  (remove seeded rows)
import os
import sys
from datetime import date, timedelta

from app.core.database import SessionLocal
from app.models.compliance import Audit, NCReport

if os.getenv("APP_ENV", "development") == "production":
    sys.exit("Refusing to seed in production.")

FACTORY = "Demo Factory - Unit A"
TODAY = date.today()
d = lambda days: TODAY + timedelta(days=days)  # noqa: E731

# code, type, auditor, scheduled, start, end, status
AUDITS = [
    ("SEED-001", "Ethical Audit 2026", "Auditor One",   d(-200), d(-199), d(-195), "Closed"),
    ("SEED-002", "Ethical Audit 2026", "Auditor Two",   d(-120), d(-118), d(-115), "Closed"),
    ("SEED-003", "Safety Audit",       "Auditor One",   d(-60),  d(-58),  d(-55),  "Closed"),
    ("SEED-004", "Safety Audit",       "Auditor Three", d(-30),  d(-29),  d(-27),  "Closed"),
    ("SEED-005", "Ethical Audit 2026", "Auditor Two",   d(-1),   d(-1),   None,    "In Progress"),
    ("SEED-006", "Ethical Audit 2027", None,            d(21),   None,    None,    "Scheduled"),
]

# audit code, raised_on, acknowledged_on, status, progress, notes
NCS = [
    ("SEED-001", d(-190), d(-188), "Closed",       100, "All findings resolved and verified."),
    ("SEED-002", d(-110), d(-108), "Acknowledged",  60, "Corrective actions in progress."),
    ("SEED-003", d(-50),  None,    "NC Sent",         0, "Waiting for factory acknowledgement."),
    ("SEED-004", None,    None,    "Pending",         0, "Report being prepared."),
]


def reset(db):
    n = db.query(Audit).filter(Audit.audit_code.like("SEED-%")).delete(synchronize_session=False)
    db.commit()
    print(f"Removed {n} seeded audits (NC reports cascade).")


def seed(db):
    by_code, added_a, added_n = {}, 0, 0
    for code, a_type, auditor, sched, start, end, st in AUDITS:
        audit = db.query(Audit).filter(Audit.audit_code == code).first()
        if not audit:
            audit = Audit(
                audit_code=code, factory_name=FACTORY, audit_type=a_type,
                auditor_name=auditor, scheduled_date=sched,
                actual_start_date=start, end_date=end, status=st,
            )
            db.add(audit)
            added_a += 1
        by_code[code] = audit
    db.flush()

    for code, raised, ack, st, prog, notes in NCS:
        audit = by_code[code]
        if not db.query(NCReport).filter(NCReport.audit_id == audit.id).first():
            db.add(NCReport(audit_id=audit.id, raised_on=raised, acknowledged_on=ack,
                            status=st, progress=prog, notes=notes))
            added_n += 1
    db.commit()
    print(f"Added {added_a} audits and {added_n} NC reports.")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        reset(db) if "--reset" in sys.argv else seed(db)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()