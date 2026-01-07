import { Request, Response } from 'express';
import HeroSlider from '../models/HeroSlider';
import { getEffectiveStoreId } from '../utils/request.utils';

// Get all sliders for a store
export const getHeroSliders = async (req: Request, res: Response) => {
    try {
        const filter: any = {};
        const storeId = getEffectiveStoreId(req);

        if (storeId) {
            filter.storeId = storeId;
        }

        const sliders = await HeroSlider.find(filter).sort({ createdAt: -1 });
        res.status(200).json(sliders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sliders', error });
    }
};

// Get single slider by ID
export const getHeroSliderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const slider = await HeroSlider.findById(id);

        if (!slider) {
            return res.status(404).json({ message: 'Slider not found' });
        }

        res.status(200).json(slider);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching slider', error });
    }
};

// Create new slider
export const createHeroSlider = async (req: Request | any, res: Response) => {
    try {
        let storeId = getEffectiveStoreId(req);

        // If no storeId in request, try to get from user logic (like banner controller)
        if (!storeId && req.user?.storeIds?.length) {
            storeId = req.user.storeIds[0];
        }

        if (!storeId && req.user?.role !== 'super_admin') {
            // If not super admin and no store ID, we might want to error, 
            // but for now let's adhere to the model validation. 
            // If the model requires storeId, it will fail there.
        }

        // If super admin and no storeId, we might be creating a "global" slider or it might be an error.
        // For now, let's proceed and let the model validation handle missing required fields if any.
        // However, the original code returned 400. Let's keep it robust but safer.

        if (!storeId) {
            // If we still don't have a store ID, return error as it's required for the data
            return res.status(400).json({ message: 'Store ID is required' });
        }

        const newSlider = new HeroSlider({
            ...req.body,
            storeId
        });

        const savedSlider = await newSlider.save();
        res.status(201).json(savedSlider);
    } catch (error) {
        res.status(500).json({ message: 'Error creating slider', error });
    }
};

// Update slider
export const updateHeroSlider = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updatedSlider = await HeroSlider.findByIdAndUpdate(
            id,
            { ...req.body },
            { new: true }
        );

        if (!updatedSlider) {
            return res.status(404).json({ message: 'Slider not found' });
        }

        res.status(200).json(updatedSlider);
    } catch (error) {
        res.status(500).json({ message: 'Error updating slider', error });
    }
};

// Delete slider
export const deleteHeroSlider = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deletedSlider = await HeroSlider.findByIdAndDelete(id);

        if (!deletedSlider) {
            return res.status(404).json({ message: 'Slider not found' });
        }

        res.status(200).json({ message: 'Slider deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting slider', error });
    }
};
