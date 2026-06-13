import api from '@/lib/api';
import { HeroBanner } from '@/types/content';

export type CreateHeroBannerData = Omit<HeroBanner, '_id' | 'createdAt' | 'updatedAt' | 'storeId'> & { storeId?: string };
export type UpdateHeroBannerData = Partial<CreateHeroBannerData>;

const heroBannerService = {
    getAll: async (storeId?: string) => {
        const params: any = {};
        if (storeId) params.storeId = storeId;
        return api.get<{ success: boolean; heroBanners: HeroBanner[] }>('/hero-banners', { params });
    },

    getById: async (id: string) => {
        return api.get<{ success: boolean; heroBanner: HeroBanner }>(`/hero-banners/${id}`);
    },

    create: async (data: CreateHeroBannerData) => {
        return api.post<{ success: boolean; heroBanner: HeroBanner }>('/hero-banners', data);
    },

    update: async (id: string, data: UpdateHeroBannerData) => {
        return api.put<{ success: boolean; heroBanner: HeroBanner }>(`/hero-banners/${id}`, data);
    },

    delete: async (id: string) => {
        return api.delete<{ success: boolean; message: string }>(`/hero-banners/${id}`);
    },

    reorder: async (items: Array<{ id: string; order: number }>) => {
        return api.put<{ success: boolean; message: string }>('/hero-banners/reorder', { items });
    }
};

export default heroBannerService;
