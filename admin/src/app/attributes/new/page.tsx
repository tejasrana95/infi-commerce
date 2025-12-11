'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import styles from '../products/product-form.module.scss';

export default function NewAttributePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'text',
    values: '',
    isRequired: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/attributes', {
        ...formData,
        values: formData.values.split(',').map(v => v.trim()).filter(v => v),
      });
      router.push('/attributes');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create attribute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Add New Attribute</h2>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Name *</label>
            <input type="text" name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className={styles.formGroup}>
            <label>Type *</label>
            <select name="type" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} required>
              <option value="text">Text</option>
              <option value="select">Select</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
            </select>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>Values (comma-separated)</label>
          <input type="text" name="values" value={formData.values} onChange={(e) => setFormData({...formData, values: e.target.value})} placeholder="Red, Blue, Green" />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.checkbox}>
            <input type="checkbox" checked={formData.isRequired} onChange={(e) => setFormData({...formData, isRequired: e.target.checked})} />
            <span>Required</span>
          </label>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={() => router.back()} className={styles.cancelBtn}>Cancel</button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating...' : 'Create Attribute'}
          </button>
        </div>
      </form>
    </div>
  );
}
