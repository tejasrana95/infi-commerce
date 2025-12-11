'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import styles from '../products/product-form.module.scss';

export default function EditCurrencyPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', symbol: '', exchangeRate: '', isActive: true });

  useEffect(() => {
    fetchCurrency();
  }, []);

  const fetchCurrency = async () => {
    try {
      const response = await api.get(`/currencies/${params.id}`);
      const currency = response.data;
      setFormData({ code: currency.code || '', name: currency.name || '', symbol: currency.symbol || '', exchangeRate: currency.exchangeRate?.toString() || '', isActive: currency.isActive });
    } catch (err) {
      alert('Failed to fetch currency');
      router.push('/currencies');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/currencies/${params.id}`, { ...formData, exchangeRate: parseFloat(formData.exchangeRate) });
      router.push('/currencies');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}><h2>Edit Currency</h2></div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Code *</label>
            <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required />
          </div>
          <div className={styles.formGroup}>
            <label>Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className={styles.formGroup}>
            <label>Symbol *</label>
            <input type="text" value={formData.symbol} onChange={(e) => setFormData({...formData, symbol: e.target.value})} required />
          </div>
          <div className={styles.formGroup}>
            <label>Exchange Rate *</label>
            <input type="number" step="0.000001" value={formData.exchangeRate} onChange={(e) => setFormData({...formData, exchangeRate: e.target.value})} required />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.checkbox}>
            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} />
            <span>Active</span>
          </label>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={() => router.back()} className={styles.cancelBtn}>Cancel</button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Updating...' : 'Update Currency'}</button>
        </div>
      </form>
    </div>
  );
}
