import { Award } from 'lucide-react';

export default function HseScorecardPage() {
  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <Award className="mx-auto h-10 w-10 text-red-500" />
        <h1 className="mt-3 text-xl font-bold text-slate-800">HSE Scorecard</h1>
        <p className="mt-1 text-sm text-slate-500">This page is under construction.</p>
      </div>
    </div>
  );
}