'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function NewSalePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/sales', { ...formData, discountValue: parseFloat(formData.discountValue) });
      router.push('/sales');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div><h2>Add New Sale</h2></div>
      <form onSubmit={handleSubmit} >
        <div>
          <div>
            <label>Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div>
            <label>Discount Type *</label>
            <select value={formData.discountType} onChange={(e) => setFormData({...formData, discountType: e.target.value})} required>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label>Discount Value *</label>
            <input type="number" step="0.01" value={formData.discountValue} onChange={(e) => setFormData({...formData, discountValue: e.target.value})} required />
          </div>
          <div>
            <label>Start Date *</label>
            <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} required />
          </div>
          <div>
            <label>End Date *</label>
            <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} required />
          </div>
        </div>
        <div>
          <label>Description</label>
          <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} />
        </div>
        <div>
          <label>
            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} />
            <span>Active</span>
          </label>
        </div>
        <div>
          <button type="button" onClick={() => router.back()} >Cancel</button>
          <button type="submit"  disabled={loading}>{loading ? 'Creating...' : 'Create Sale'}</button>
        </div>
      </form>
    </div>
  );
}
