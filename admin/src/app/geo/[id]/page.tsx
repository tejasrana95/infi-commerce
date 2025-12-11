'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Geo } from '@/types';
import styles from '../products/product-form.module.scss';

export default function EditGeoPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [geos, setGeos] = useState<Geo[]>([]);
  const [formData, setFormData] = useState({ name: '', type: 'country', code: '', parent: '', isActive: true });

  useEffect(() => {
    fetchGeo();
    fetchGeos();
  }, []);

  const fetchGeo = async () => {
    try {
      const response = await api.get(`/geo/${params.id}`);
      const geo = response.data;
      setFormData({ name: geo.name || '', type: geo.type || 'country', code: geo.code || '', parent: geo.parent?._id || geo.parent || '', isActive: geo.isActive });
    } catch (err) {
      alert('Failed to fetch geo');
      router.push('/geo');
    }
  };

  const fetchGeos = async () => {
    try {
      const response = await api.get('/geo');
      setGeos(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch geos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/geo/${params.id}`, { ...formData, parent: formData.parent || undefined });
      router.push('/geo');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}><h2>Edit Geographic Location</h2></div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className={styles.formGroup}>
            <label>Type *</label>
            <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} required>
              <option value="country">Country</option>
              <option value="state">State</option>
              <option value="city">City</option>
              <option value="zone">Zone</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Code</label>
            <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} />
          </div>
          <div className={styles.formGroup}>
            <label>Parent Location</label>
            <select value={formData.parent} onChange={(e) => setFormData({...formData, parent: e.target.value})}>
              <option value="">None</option>
              {geos.filter(g => g._id !== params.id).map((geo) => (
                <option key={geo._id} value={geo._id}>{geo.name} ({geo.type})</option>
              ))}
            </select>
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
          <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Updating...' : 'Update Geo'}</button>
        </div>
      </form>
    </div>
  );
}
