'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { Category } from '@/types';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentCategory: '',
    isActive: true,
  });

  useEffect(() => {
    fetchCategory();
    fetchCategories();
  }, []);

  const fetchCategory = async () => {
    try {
      const response = await api.get(`/categories/${params.id}`);
      const category = response.data;
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        parentCategory: category.parentCategory?._id || category.parentCategory || '',
        isActive: category.isActive !== undefined ? category.isActive : true,
      });
    } catch (err) {
      alert('Failed to fetch category');
      router.push('/categories');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.put(`/categories/${params.id}`, {
        ...formData,
        parentCategory: formData.parentCategory || undefined,
      });
      router.push('/categories');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update category');
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
        <h2>Edit Category</h2>
        <p>Update category information</p>
      </div>

      <form onSubmit={handleSubmit} >
        <div>
          <div>
            <label htmlFor="name">Category Name *</label>
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
            <label htmlFor="slug">Slug *</label>
            <input
              id="slug"
              name="slug"
              type="text"
              value={formData.slug}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="parentCategory">Parent Category</label>
            <select
              id="parentCategory"
              name="parentCategory"
              value={formData.parentCategory}
              onChange={handleChange}
            >
              <option value="">None (Top Level)</option>
              {categories.filter(cat => cat._id !== params.id).map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
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
            {loading ? 'Updating...' : 'Update Category'}
          </button>
        </div>
      </form>
    </div>
  );
}
