'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useNotification } from '@/contexts/NotificationContext';

export default function EditSalePage() {
  const router = useRouter();
  const params = useParams();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', discountType: 'percentage', discountValue: '', startDate: '', endDate: '', isActive: true });

  useEffect(() => {
    fetchSale();
  }, []);

  const fetchSale = async () => {
    try {
      const response = await api.get(`/sales/${params.id}`);
      const sale = response.data;
      setFormData({
        name: sale.name || '',
        description: sale.description || '',
        discountType: sale.discountType || 'percentage',
        discountValue: sale.discountValue?.toString() || '',
        startDate: sale.startDate ? new Date(sale.startDate).toISOString().split('T')[0] : '',
        endDate: sale.endDate ? new Date(sale.endDate).toISOString().split('T')[0] : '',
        isActive: sale.isActive,
      });
    } catch (err) {
      showNotification('Failed to fetch sale', 'error');
      router.push('/sales');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/sales/${params.id}`, { ...formData, discountValue: parseFloat(formData.discountValue) });
      router.push('/sales');
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to update', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div><h2>Edit Sale</h2></div>
      <form onSubmit={handleSubmit} >
        <div>
          <div>
            <label>Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div>
            <label>Discount Type *</label>
            <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} required>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div>
            <label>Discount Value *</label>
            <input type="number" step="0.01" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })} required />
          </div>
          <div>
            <label>Start Date *</label>
            <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
          </div>
          <div>
            <label>End Date *</label>
            <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required />
          </div>
        </div>
        <div>
          <label>Description</label>
          <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} />
        </div>
        <div>
          <label>
            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
            <span>Active</span>
          </label>
        </div>
        <div>
          <button type="button" onClick={() => router.back()} >Cancel</button>
          <button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Sale'}</button>
        </div>
      </form>
    </div>
  );
}
