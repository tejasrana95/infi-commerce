import mongoose, { Schema, Document } from 'mongoose';

/**
 * Form Field - Individual form field configuration
 */
export interface IFormField {
    id: string;
    type: 'text' | 'textarea' | 'email' | 'phone' | 'date' | 'time' | 'datetime' |
    'select' | 'radio' | 'checkbox' | 'file' | 'image' | 'richtext' | 'repeater';
    label: string;
    name: string;
    placeholder?: string;
    required: boolean;
    validation?: {
        minLength?: number;
        maxLength?: number;
        pattern?: string;
        min?: number;
        max?: number;
        fileTypes?: string[];
        maxFileSize?: number; // in bytes
    };
    options?: Array<{ label: string; value: string }>; // For select, radio, checkbox
    defaultValue?: any;
    conditionalLogic?: {
        show: boolean;
        conditions: Array<{
            field: string;
            operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
            value: any;
        }>;
    };
    styling?: {
        className?: string;
        width?: number; // Percentage
    };
    subFields?: IFormField[]; // For repeater fields
    repeaterConfig?: {
        minInstances?: number;
        maxInstances?: number;
        addButtonText?: string;
    };
    order: number;
}

/**
 * Form Column - For split-layout sections
 */
export interface IFormColumn {
    id: string;
    width: number;
    fields: IFormField[];
}

/**
 * Form Section - Container for form fields
 */
export interface IFormSection {
    id: string;
    name?: string;
    type: 'full-width' | 'split-2' | 'split-3' | 'split-4';
    columns?: IFormColumn[];
    fields: IFormField[];
    order: number;
}

/**
 * Form Model - Custom form builder
 */
export interface IForm extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
    sections: IFormSection[];
    emailSettings: {
        to: string[]; // Email addresses
        cc?: string[];
        bcc?: string[];
        replyTo?: string;
        subject: string;
        body: string; // Auto-generated with form fields
    };
    confirmationEmail?: {
        enabled: boolean;
        replyTo?: string;
        subject?: string;
        body?: string; // Rich text
    };
    status: 'draft' | 'published';
    submissionsCount: number;
    createdAt: Date;
    updatedAt: Date;
}

// Form Field sub-schema
const FormFieldSchema = new Schema<IFormField>(
    {
        id: { type: String, required: true },
        type: {
            type: String,
            required: true,
            enum: ['text', 'textarea', 'email', 'phone', 'date', 'time', 'datetime',
                'select', 'radio', 'checkbox', 'file', 'image', 'richtext', 'repeater'],
        },
        label: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        placeholder: { type: String, trim: true },
        required: { type: Boolean, default: false },
        validation: {
            minLength: { type: Number },
            maxLength: { type: Number },
            pattern: { type: String },
            min: { type: Number },
            max: { type: Number },
            fileTypes: { type: [String] },
            maxFileSize: { type: Number },
        },
        options: [{
            label: { type: String, required: true },
            value: { type: String, required: true },
        }],
        defaultValue: { type: Schema.Types.Mixed },
        conditionalLogic: {
            show: { type: Boolean },
            conditions: [{
                field: { type: String, required: true },
                operator: {
                    type: String,
                    enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'],
                },
                value: { type: Schema.Types.Mixed },
            }],
        },
        styling: {
            className: { type: String },
            width: { type: Number },
        },
        repeaterConfig: {
            minInstances: { type: Number },
            maxInstances: { type: Number },
            addButtonText: { type: String },
        },
        order: { type: Number, default: 0 },
    },
    { _id: false }
);

// Add subFields recursively to allow nested structures
FormFieldSchema.add({
    subFields: { type: [FormFieldSchema], default: undefined }
});

// Form Column sub-schema
const FormColumnSchema = new Schema<IFormColumn>(
    {
        id: { type: String, required: true },
        width: { type: Number, default: 50 },
        fields: { type: [FormFieldSchema], default: [] },
    },
    { _id: false }
);

// Form Section sub-schema
const FormSectionSchema = new Schema<IFormSection>(
    {
        id: { type: String, required: true },
        name: { type: String, trim: true },
        type: {
            type: String,
            enum: ['full-width', 'split-2', 'split-3', 'split-4'],
            default: 'full-width',
        },
        columns: { type: [FormColumnSchema] },
        fields: { type: [FormFieldSchema], default: [] },
        order: { type: Number, default: 0 },
    },
    { _id: false }
);

const FormSchema = new Schema<IForm>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        sections: {
            type: [FormSectionSchema],
            default: [],
        },
        emailSettings: {
            to: {
                type: [String],
                required: true,
                validate: {
                    validator: function (v: string[]) {
                        return v && v.length > 0;
                    },
                    message: 'At least one recipient email is required',
                },
            },
            cc: { type: [String] },
            bcc: { type: [String] },
            replyTo: { type: String },
            subject: {
                type: String,
                required: true,
                trim: true,
            },
            body: {
                type: String,
                required: true,
            },
        },
        confirmationEmail: {
            enabled: { type: Boolean, default: false },
            replyTo: { type: String },
            subject: { type: String, trim: true },
            body: { type: String },
        },
        status: {
            type: String,
            enum: ['draft', 'published'],
            default: 'draft',
        },
        submissionsCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
FormSchema.index({ storeId: 1, slug: 1 }, { unique: true });
FormSchema.index({ storeId: 1, status: 1 });
FormSchema.index({ slug: 1 });

const Form = mongoose.model<IForm>('Form', FormSchema);

export default Form;
