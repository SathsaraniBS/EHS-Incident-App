cd server
venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

cd admin-dashboard
npm run dev

cd client
npx expo start

# 🛡️ Enterprise EHS Incident & Safety Audit System

An enterprise-grade Environment, Health, and Safety (EHS) digital audit and incident reporting system engineered for **Bondville (Pvt) Ltd** (Garment Manufacturer). This platform transforms traditional paper-based workflows into a unified, real-time web and mobile ecosystem.

---

## 🌟 Key Capabilities

- **Mobile Application (React Native / Expo):** Designed for 30+ safety officers to carry out multi-section health & safety audits, capture photo evidence, and submit geotagged incident reports directly from the factory floor.
- **Admin Dashboard (Next.js & TypeScript):** Interactive web dashboard empowering safety managers to track incidents in real time, monitor severity metrics, manage 17 operational audit section scores, and oversee compliance analytics.
- **Robust Backend Services (FastAPI & PostgreSQL):** High-performance RESTful API layer utilizing SQLAlchemy for handling complex safety audit models, data migrations, and secure media file serving.
- **Data Integrity & Resiliency:** Prevents duplicate or incomplete submissions using request-state locking, schema-level validations, health checks, and Axios timeout retry policies.
- **End-to-End Reliability:** Admin web interface covered by automated **Playwright E2E testing** to ensure zero regressions in critical workflows.

---

## 🏗️ Architecture & Tech Stack

This project is organized as a structured **Monorepo**:

- **Backend:** Python 3.x, FastAPI, SQLAlchemy, PostgreSQL (`ehs_db`), Pydantic
- **Admin Portal:** Next.js (App Router), TypeScript, Tailwind CSS, Axios, Lucide Icons
- **Mobile Client:** React Native, Expo, React Navigation
- **DevOps & QA:** Docker, Render (Backend deployment), Vercel (Frontend deployment), Playwright (E2E Testing)

---

## 📂 Repository Structure

```text
ehs-incident-app/
├── admin-dashboard/       # Next.js Web Admin Portal
│   ├── src/
│   │   ├── app/           # Next.js App Router Pages & Sections
│   │   └── components/    # Reusable UI Components (Sidebar, Charts)
│   └── package.json
│
├── client/                # React Native / Expo Mobile Application
│   ├── src/               # Screens, Navigation & API Helpers
│   └── package.json
│
└── server/                # FastAPI Backend Application
    ├── app/               # Models, Core Database Setup & API Routes
    ├── uploads/           # Media / Photo Evidence Storage
    ├── seed_database.py   # Initial Excel Data Seeding Script
    └── requirements.txt


🚀 Local Development Setup
1. Backend (FastAPI)

cd server
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload


2. Admin Dashboard (Next.js)

cd admin-dashboard
npm install
npm run dev


3. Mobile Client (React Native / Expo)

cd client
npm install
npx expo start


👤 Author
 Sanduni Sathsarani (BSS)

Full-Stack Developer