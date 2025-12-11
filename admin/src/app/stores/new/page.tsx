'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import styles from '../products/product-form.module.scss';

export default function NewStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: '',
    currency: 'USD',
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/stores', formData);
      router.push('/stores');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}><h2>Add New Store</h2></div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className={styles.formGroup}>
            <label>Domain *</label>
            <input type="text" value={formData.domain} onChange={(e) => setFormData({...formData, domain: e.target.value})} required />
          </div>
          <div className={styles.formGroup}>
            <label>Currency *</label>
            <input type="text" value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} required />
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
          <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Creating...' : 'Create Store'}</button>
        </div>
      </form>
    </div>
  );
}
