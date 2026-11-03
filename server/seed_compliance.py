# server/seed_compliance.py
# Run: python seed_compliance.py   
from datetime import date

from app.core.database import Base, SessionLocal, engine
from app.models.compliance import Audit, NCReport

FACTORY = "Bondville (Pvt) Ltd - Horana"

AUDITS = [
    # code, type, auditor, scheduled, start, end
    ("10064", "NL ETHICAL AUDIT 2026", "Ravindra Abeysinghe", date(2026, 6, 18), date(2026, 6, 18), date(2026, 6, 22)),
    ("C1-9091", "NL ETHICAL AUDIT_6", None, date(2024, 11, 8), date(2024, 11, 8), date(2024, 11, 11)),
    ("C1-9403", "NL ETHICAL AUDIT_6", "Ravindra Abeysinghe", date(2025, 10, 31), date(2025, 11, 3), date(2025, 11, 6)),
    ("C1-9290", "NL ETHICAL AUDIT_6", "Ravindra Abeysinghe", date(2025, 8, 6), date(2025, 8, 7), date(2025, 8, 13)),
    ("C1-9179", "NL ETHICAL AUDIT_6", "Chathura Edirisooriya", date(2025, 4, 24), date(2025, 4, 24), date(2025, 4, 25)),
    ("C1-9556", "NL ETHICAL AUDIT_6", "Ravindra Abeysinghe", date(2026, 2, 24), date(2026, 2, 26), date(2026, 2, 26)),
]

NCS = [
    # audit code, raised_on, acknowledged_on, status, progress
    ("10064", date(2026, 8, 6), date(2026, 8, 6), "NC Sent", 100),
    ("C1-9556", None, date(2026, 2, 26), "NC Sent", 0),
    ("C1-9403", date(2025, 11, 6), date(2025, 11, 6), "NC Sent", 100),
    ("C1-9290", None, date(2025, 8, 13), "NC Sent", 0),
    ("C1-9179", None, date(2025, 4, 25), "NC Sent", 0),
    ("C1-9091", date(2024, 11, 19), date(2024, 11, 19), "NC Sent", 0),
]


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        by_code = {}
        added_audits = 0
        for code, a_type, auditor, sched, start, end in AUDITS:
            audit = db.query(Audit).filter(Audit.audit_code == code).first()
            if not audit:
                audit = Audit(
                    audit_code=code, factory_name=FACTORY, audit_type=a_type,
                    auditor_name=auditor, scheduled_date=sched, actual_start_date=start,
                    end_date=end, status="Closed",
                )
                db.add(audit)
                added_audits += 1
            by_code[code] = audit
        db.flush()

        added_ncs = 0
        for code, raised, ack, st, prog in NCS:
            audit = by_code[code]
            if not db.query(NCReport).filter(NCReport.audit_id == audit.id).first():
                db.add(NCReport(audit_id=audit.id, raised_on=raised, acknowledged_on=ack, status=st, progress=prog))
                added_ncs += 1

        db.commit()
        print(f"✅ Added {added_audits} audits and {added_ncs} NC reports")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()