'use client';
import { useState } from 'form'; // or react standard useState
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error('Invalid credentials');

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      
      // Redirect based on role
      if (data.role === 'admin') {
        router.push('/dashboard');
      } else {
        setError('Access denied. Admin credentials required.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleLogin} className="w-96 p-8 bg-gray-800 rounded-xl shadow-lg space-y-4">
        <h2 className="text-2xl font-bold text-center">Admin Login</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <div>
          <label className="block text-sm">Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 mt-1"
            required 
          />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 mt-1"
            required 
          />
        </div>
        <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold transition">
          Login to Dashboard
        </button>
      </form>
    </div>
  );
}