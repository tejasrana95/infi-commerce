'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Category, Store } from '@/types';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
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
    fetchProduct();
    fetchCategories();
    fetchStores();
  }, []);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${params.id}`);
      const product = response.data;
      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        price: product.price?.toString() || '',
        salePrice: product.salePrice?.toString() || '',
        cost: product.cost?.toString() || '',
        stock: product.stock?.toString() || '',
        category: product.category?._id || product.category || '',
        store: product.store?._id || product.store || '',
        isActive: product.isActive !== undefined ? product.isActive : true,
      });
    } catch (err) {
      alert('Failed to fetch product');
      router.push('/products');
    } finally {
      setFetchLoading(false);
    }
  };

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
      await api.put(`/products/${params.id}`, {
        ...formData,
        price: parseFloat(formData.price),
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        stock: parseInt(formData.stock),
      });
      router.push('/products');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update product');
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

  if (fetchLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>
        <h2>Edit Product</h2>
        <p>Update product information</p>
      </div>

      <form onSubmit={handleSubmit} >
        <div>
          <div>
            <label htmlFor="name">Product Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="sku">SKU *</label>
            <input
              id="sku"
              name="sku"
              type="text"
              value={formData.sku}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="price">Price *</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="salePrice">Sale Price</label>
            <input
              id="salePrice"
              name="salePrice"
              type="number"
              step="0.01"
              value={formData.salePrice}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="cost">Cost</label>
            <input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="stock">Stock *</label>
            <input
              id="stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
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
            <label htmlFor="store">Store</label>
            <select
              id="store"
              name="store"
              value={formData.store}
              onChange={handleChange}
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

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
          />
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            <span>Active</span>
          </label>
        </div>

        <div>
          <button
            type="button"
            onClick={() => router.back()}
            
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit"  disabled={loading}>
            {loading ? 'Updating...' : 'Update Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
