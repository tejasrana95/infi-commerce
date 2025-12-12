'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { GeoGroup } from '@/types';

export default function EditShippingRulePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [geoGroups, setGeoGroups] = useState<GeoGroup[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    geoGroup: '',
    minWeight: '',
    maxWeight: '',
    minOrderValue: '',
    maxOrderValue: '',
    shippingCost: '',
    estimatedDays: '',
    isActive: true,
  });

  useEffect(() => {
    fetchShippingRule();
    fetchGeoGroups();
  }, []);

  const fetchShippingRule = async () => {
    try {
      const response = await api.get(`/shipping/${params.id}`);
      const rule = response.data;
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        geoGroup: rule.geoGroup?._id || rule.geoGroup || '',
        minWeight: rule.minWeight?.toString() || '',
        maxWeight: rule.maxWeight?.toString() || '',
        minOrderValue: rule.minOrderValue?.toString() || '',
        maxOrderValue: rule.maxOrderValue?.toString() || '',
        shippingCost: rule.shippingCost?.toString() || '',
        estimatedDays: rule.estimatedDays?.toString() || '',
        isActive: rule.isActive,
      });
    } catch (err) {
      alert('Failed to fetch shipping rule');
      router.push('/shipping');
    }
  };

  const fetchGeoGroups = async () => {
    try {
      const response = await api.get('/geo-groups');
      setGeoGroups(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch geo groups');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/shipping/${params.id}`, {
        ...formData,
        geoGroup: formData.geoGroup || undefined,
        minWeight: formData.minWeight ? parseFloat(formData.minWeight) : undefined,
        maxWeight: formData.maxWeight ? parseFloat(formData.maxWeight) : undefined,
        minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : undefined,
        maxOrderValue: formData.maxOrderValue ? parseFloat(formData.maxOrderValue) : undefined,
        shippingCost: parseFloat(formData.shippingCost),
        estimatedDays: formData.estimatedDays ? parseInt(formData.estimatedDays) : undefined,
      });
      router.push('/shipping');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div><h2>Edit Shipping Rule</h2></div>
      <form onSubmit={handleSubmit} >
        <div>
          <div>
            <label>Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div>
            <label>Shipping Cost *</label>
            <input type="number" step="0.01" value={formData.shippingCost} onChange={(e) => setFormData({...formData, shippingCost: e.target.value})} required />
          </div>
          <div>
            <label>Geo Group</label>
            <select value={formData.geoGroup} onChange={(e) => setFormData({...formData, geoGroup: e.target.value})}>
              <option value="">All Locations</option>
              {geoGroups.map((group) => (
                <option key={group._id} value={group._id}>{group.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Estimated Days</label>
            <input type="number" value={formData.estimatedDays} onChange={(e) => setFormData({...formData, estimatedDays: e.target.value})} />
          </div>
          <div>
            <label>Min Weight (kg)</label>
            <input type="number" step="0.01" value={formData.minWeight} onChange={(e) => setFormData({...formData, minWeight: e.target.value})} />
          </div>
          <div>
            <label>Max Weight (kg)</label>
            <input type="number" step="0.01" value={formData.maxWeight} onChange={(e) => setFormData({...formData, maxWeight: e.target.value})} />
          </div>
          <div>
            <label>Min Order Value</label>
            <input type="number" step="0.01" value={formData.minOrderValue} onChange={(e) => setFormData({...formData, minOrderValue: e.target.value})} />
          </div>
          <div>
            <label>Max Order Value</label>
            <input type="number" step="0.01" value={formData.maxOrderValue} onChange={(e) => setFormData({...formData, maxOrderValue: e.target.value})} />
          </div>
        </div>
        <div>
          <label>Description</label>
          <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
        </div>
        <div>
          <label>
            <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} />
            <span>Active</span>
          </label>
        </div>
        <div>
          <button type="button" onClick={() => router.back()} >Cancel</button>
          <button type="submit"  disabled={loading}>{loading ? 'Updating...' : 'Update Shipping Rule'}</button>
        </div>
      </form>
    </div>
  );
}
