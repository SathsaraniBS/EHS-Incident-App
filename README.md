cd server
venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

cd admin-dashboard
npm run dev

cd client
npx expo start
