import mongoose, { Schema, Document } from 'mongoose';

/**
 * Form Submission - Stores form submission data
 */
export interface IFormSubmission extends Document {
    formId: mongoose.Types.ObjectId;
    storeId: mongoose.Types.ObjectId;
    data: Record<string, any>; // Field name -> value mapping
    files?: Array<{
        fieldName: string;
        fileName: string;
        fileUrl: string;
        fileSize: number;
    }>;
    metadata: {
        ip?: string;
        userAgent?: string;
        referer?: string;
        geo?: {
            country_code?: string;
            region_code?: string;
            city?: string;
        };
        clientMetadata?: {
            userAgent?: string;
            platform?: string;
            language?: string;
            screenResolution?: string;
        };
    };
    emailSent: boolean;
    confirmationEmailSent?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FormSubmissionSchema = new Schema<IFormSubmission>(
    {
        formId: {
            type: Schema.Types.ObjectId,
            ref: 'Form',
            required: true,
            index: true,
        },
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        data: {
            type: Schema.Types.Mixed,
            required: true,
        },
        files: [{
            fieldName: { type: String, required: true },
            fileName: { type: String, required: true },
            fileUrl: { type: String, required: true },
            fileSize: { type: Number, required: true },
        }],
        metadata: {
            ip: { type: String },
            userAgent: { type: String },
            referer: { type: String },
            geo: {
                country_code: { type: String },
                region_code: { type: String },
                city: { type: String },
            },
            clientMetadata: {
                userAgent: { type: String },
                platform: { type: String },
                language: { type: String },
                screenResolution: { type: String },
            },
        },
        emailSent: {
            type: Boolean,
            default: false,
        },
        confirmationEmailSent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
FormSubmissionSchema.index({ formId: 1, createdAt: -1 });
FormSubmissionSchema.index({ storeId: 1 });
FormSubmissionSchema.index({ createdAt: -1 });

const FormSubmission = mongoose.model<IFormSubmission>('FormSubmission', FormSubmissionSchema);

export default FormSubmission;
