import mongoose, { Schema, Document } from 'mongoose';

export interface IRedirection extends Document {
    storeId: mongoose.Types.ObjectId;
    origin_url: string;
    destination_url: string;
    status: 'active' | 'inactive';
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const RedirectionSchema = new Schema<IRedirection>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        origin_url: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            validate: {
                validator: function (v: string) {
                    return v.startsWith('/');
                },
                message: 'origin_url must be a relative URL starting with /'
            },
            set: function (v: string) {
                // Remove trailing slash for consistency
                return v.endsWith('/') && v.length > 1 ? v.slice(0, -1) : v;
            }
        },
        destination_url: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index to prevent duplicate origin URLs within a store
RedirectionSchema.index({ storeId: 1, origin_url: 1 }, { unique: true });

// Query optimization index for filtering by status
RedirectionSchema.index({ storeId: 1, status: 1 });

const Redirection = mongoose.model<IRedirection>('Redirection', RedirectionSchema);

export default Redirection;
