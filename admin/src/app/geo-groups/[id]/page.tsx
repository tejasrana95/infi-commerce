'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Geo } from '@/types';
import styles from '../products/product-form.module.scss';

export default function EditGeoGroupPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [geos, setGeos] = useState<Geo[]>([]);
  const [formData, setFormData] = useState({ name: '', description: '', geos: [] as string[], isActive: true });

  useEffect(() => {
    fetchGeoGroup();
    fetchGeos();
  }, []);

  const fetchGeoGroup = async () => {
    try {
      const response = await api.get(`/geo-groups/${params.id}`);
      const group = response.data;
      setFormData({
        name: group.name || '',
        description: group.description || '',
        geos: group.geos?.map((g: any) => typeof g === 'string' ? g : g._id) || [],
        isActive: group.isActive
      });
    } catch (err) {
      alert('Failed to fetch geo group');
      router.push('/geo-groups');
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
      await api.put(`/geo-groups/${params.id}`, formData);
      router.push('/geo-groups');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleGeoToggle = (geoId: string) => {
    setFormData({
      ...formData,
      geos: formData.geos.includes(geoId)
        ? formData.geos.filter(id => id !== geoId)
        : [...formData.geos, geoId]
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}><h2>Edit Geo Group</h2></div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>Description</label>
          <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
        </div>
        <div className={styles.formGroup}>
          <label>Select Locations ({formData.geos.length} selected)</label>
          <div style={{maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem'}}>
            {geos.map((geo) => (
              <label key={geo._id} className={styles.checkbox} style={{marginBottom: '0.5rem'}}>
                <input type="checkbox" checked={formData.geos.includes(geo._id)} onChange={() => handleGeoToggle(geo._id)} />
                <span>{geo.name} ({geo.type})</span>
              </label>
            ))}
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
          <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Updating...' : 'Update Geo Group'}</button>
        </div>
      </form>
    </div>
  );
}
