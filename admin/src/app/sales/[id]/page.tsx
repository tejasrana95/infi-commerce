'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import styles from '../products/product-form.module.scss';

export default function EditSalePage() {
  const router = useRouter();
  const params = useParams();
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
      alert('Failed to fetch sale');
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
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}><h2>Edit Sale</h2></div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className={styles.formGroup}>
            <label>Discount Type *</label>
            <select value={formData.discountType} onChange={(e) => setFormData({...formData, discountType: e.target.value})} required>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Discount Value *</label>
            <input type="number" step="0.01" value={formData.discountValue} onChange={(e) => setFormData({...formData, discountValue: e.target.value})} required />
          </div>
          <div className={styles.formGroup}>
            <label>Start Date *</label>
            <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} required />
          </div>
          <div className={styles.formGroup}>
            <label>End Date *</label>
            <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} required />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.checkbox}>
            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} />
            <span>Active</span>
          </label>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={() => router.back()} className={styles.cancelBtn}>Cancel</button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Updating...' : 'Update Sale'}</button>
        </div>
      </form>
    </div>
  );
}
