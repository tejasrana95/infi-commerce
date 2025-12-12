'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Category, Store } from '@/types';


export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    salePrice: '',
    cost: '',
    stock: '',
    category: '',
    store: '',
    isActive: true,
  });

  useEffect(() => {
    fetchCategories();
    fetchStores();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchStores = async () => {
    try {
      const response = await api.get('/stores');
      setStores(response.data.data || response.data);
    } catch (err) {
      console.error('Failed to fetch stores');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/products', {
        ...formData,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        stock: parseInt(formData.stock),
      });
      router.push('/products');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Add New Product</h2>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Create a new product in your catalog</p>
      </div>

      <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Product Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label htmlFor="sku" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>SKU *</label>
            <input
              id="sku"
              name="sku"
              type="text"
              value={formData.sku}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label htmlFor="price" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Price *</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label htmlFor="salePrice" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Sale Price</label>
            <input
              id="salePrice"
              name="salePrice"
              type="number"
              step="0.01"
              value={formData.salePrice}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label htmlFor="cost" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Cost</label>
            <input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label htmlFor="stock" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Stock *</label>
            <input
              id="stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          <div>
            <label htmlFor="category" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="store" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Store</label>
            <select
              id="store"
              name="store"
              value={formData.store}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
            >
              <option value="">Select Store</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Active</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', backgroundColor: 'white' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', backgroundColor: '#4f46e5', color: 'white' }}
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
