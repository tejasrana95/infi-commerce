import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
    key: string;
    value: any;
    description?: string;
    isPublic: boolean; // Accessible without authentication (e.g., logo, admin name)
}

const SettingSchema = new Schema<ISetting>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        value: {
            type: Schema.Types.Mixed,
            required: true,
        },
        description: {
            type: String,
            trim: true,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for fast lookups by key
SettingSchema.index({ key: 1 });

const Setting = mongoose.model<ISetting>('Setting', SettingSchema);

export default Setting;
