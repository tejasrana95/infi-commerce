'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import styles from '../products/product-form.module.scss';

export default function NewCurrencyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', symbol: '', exchangeRate: '', isActive: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/currencies', { ...formData, exchangeRate: parseFloat(formData.exchangeRate) });
      router.push('/currencies');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create currency');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}><h2>Add New Currency</h2></div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Code *</label>
            <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required placeholder="USD" />
          </div>
          <div className={styles.formGroup}>
            <label>Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="US Dollar" />
          </div>
          <div className={styles.formGroup}>
            <label>Symbol *</label>
            <input type="text" value={formData.symbol} onChange={(e) => setFormData({...formData, symbol: e.target.value})} required placeholder="$" />
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
          <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Creating...' : 'Create Currency'}</button>
        </div>
      </form>
    </div>
  );
}
