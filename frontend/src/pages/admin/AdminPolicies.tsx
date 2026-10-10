import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/client';
import { BookingPolicy } from '../../types';
import { Card } from '../../components/common/Card';
import { Settings, Save, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const AdminPolicies: React.FC = () => {
  const [policies, setPolicies] = useState<BookingPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editValues, setEditValues] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPolicies();
      setPolicies(res.data);
      const initialMap: Record<number, string> = {};
      res.data.forEach((p) => {
        initialMap[p.id] = p.policyValue;
      });
      setEditValues(initialMap);
    } catch (e) {
      console.error('Failed to load policies:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleSave = async (policy: BookingPolicy) => {
    const newVal = editValues[policy.id];
    if (newVal === undefined) return;
    setSavingId(policy.id);

    try {
      await adminApi.updatePolicy(policy.id, newVal.trim());
      toast.success(`Policy "${policy.policyKey}" updated successfully.`);
      fetchPolicies();
    } catch (err: any) {
      toast.error('Failed to update booking policy.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          University Booking Policies & Governance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure advance scheduling windows, notice thresholds, and auto-approval rules.
        </p>
      </div>

      <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 text-xs text-brand-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Changes to booking policies take effect immediately across all client requests and server-side
          transaction boundaries. Active existing reservations remain preserved.
        </p>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 divide-y divide-slate-100">
            {policies.map((p) => (
              <div key={p.id} className="pt-6 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 max-w-md">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {p.policyKey}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editValues[p.id] ?? p.policyValue}
                    onChange={(e) =>
                      setEditValues((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    className="w-28 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-center font-bold text-slate-900"
                  />
                  <button
                    onClick={() => handleSave(p)}
                    disabled={savingId === p.id}
                    className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingId === p.id ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
