from datetime import date

from app.core.database import SessionLocal           
from app.models.section import AuditPeriod, AuditSection, ChecklistItem

# (name, slug, responsible, category, allocated, actual, adjustable)
SECTIONS = [
    ("General Maintenance", "general-maintenance", "Ruwandika", "Engineering / Factory Premises", 465, 265, 330),
    ("Admin", "admin", "Dalton", "Factory Premises / Guard Room / Canteen", 265, 225, 245),
    ("RM Stores", "rm-stores", "Chandrasiri", "Loading bay / RM Stores / Chemical room", 235, 205, 215),
    ("FG", "fg", "Chandrasiri", "Finished Goods", 155, 130, 130),
    ("Accessories", "accessories", "Sampath", "Accessories", 225, 160, 180),
    ("Cutting", "cutting", "Chamila", "Cutting", 155, 155, 155),
    ("Ground floor modules & Molding", "ground-floor-modules-molding", "Gamini", "Production", 265, 205, 225),
    ("Packing", "packing", "Gamini", "Production", 140, 140, 140),
    ("Audit room & Final Inspection", "audit-room-final-inspection", "Lalinda", "Quality", 95, 80, 95),
    ("Lab & CPI", "lab-cpi", "Chandani", "Quality", 130, 115, 130),
    ("Screen Printing & Modules", "screen-printing-modules", "Gamini", "Production", 210, 125, 140),
    ("Sample Room", "sample-room", "Samitha", "Sample Room", 180, 170, 180),
    ("Coating", "coating", "Chandani", "Production", 205, 190, 190),
    ("Forte", "forte", "Cooray", "Production", 180, 180, 180),
    ("IE", "ie", "Dilan", "Industrial Engineering", 220, 130, 150),
    ("Training School", "training-school", "Dilan", "Training", 130, 130, 130),
    ("Medical Centre", "medical-centre", "Nadee", "Medical", 100, 95, 95),
]

# slug -> [(description, allocated, actual, adjustable, remark)]
DEFAULT_ITEMS = {
    "general-maintenance": [
        ("Table, chairs, Tap and electric equipment, fences not broken (Boiler, Fan, Light, Emergency light)", 20, 0, 20, "Catering Table broken, Cupboard doors broken"),
        ("Squatting pans, commodes, wash basins, tiles and doors in good condition", 20, 20, 20, None),
        ("Insufficient number of toilets in ratio", 10, 10, 10, None),
        ("Condition monitoring system available for fire pump system", 5, 5, 5, None),
        ("Contractors use suitable PPEs depending on nature of work", 15, 15, 15, None),
    ],
    "admin": [
        ("Separate waste collection bins provided (Foot operated or closed lid)", 10, 10, 10, None),
        ("All food handling areas free of pests/animals and maintaining hygiene", 5, 5, 5, None),
        ("Kitchen is designed to prevent cross-contamination", 15, 0, 0, "Corrective action not taken as per PHI record"),
        ("Covered bins available in toilets", 10, 10, 10, None),
    ],
    "rm-stores": [
        ("Emergency Exit doors are not closed", 20, 20, 20, None),
        ("Emergency exits pathways are not obstructed", 10, 0, 10, "Obstruction found near adhesive room"),
        ("Smoke detectors & Fire fighting equipment not obstructed", 10, 10, 10, None),
    ],
}


def run():
    db = SessionLocal()
    try:
        if db.query(AuditSection).count():
            print("Already seeded")
            return

        period = AuditPeriod(name="October 2026 - Week 3 & 4",
                             start_date=date(2026, 10, 12), end_date=date(2026, 10, 25),
                             is_active=True)
        db.add(period)
        db.flush()

        for order, (name, slug, resp, cat, alloc, act, adj) in enumerate(SECTIONS, start=1):
            sec = AuditSection(name=name, slug=slug, responsible=resp, category=cat, display_order=order)
            db.add(sec)
            db.flush()

            items = DEFAULT_ITEMS.get(slug)
            if items:
                for d, a, ac, aj, rem in items:
                    db.add(ChecklistItem(section_id=sec.id, period_id=period.id,
                                         description=d, allocated=a, actual=ac, adjustable=aj, remark=rem))
            else:
                db.add(ChecklistItem(section_id=sec.id, period_id=period.id,
                                     description="Imported baseline score (replace with real checklist items)",
                                     allocated=alloc, actual=act, adjustable=adj))
        db.commit()
        print("Seeded successfully")
    finally:
        db.close()


if __name__ == "__main__":
    run()