import { Store } from './store';

export interface FormField {
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
        maxFileSize?: number;
    };
    options?: Array<{ label: string; value: string }>;
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
        width?: number;
    };
    subFields?: Array<{
        id: string;
        label: string;
        type: 'text' | 'email' | 'phone' | 'date';
        name: string;
    }>;
    repeaterConfig?: {
        minInstances?: number;
        maxInstances?: number;
        addButtonText?: string;
    };
    order: number;
}

export interface FormColumn {
    id: string;
    width: number;
    fields: FormField[];
}

export interface FormSection {
    id: string;
    name?: string;
    type: 'full-width' | 'split-2' | 'split-3' | 'split-4';
    columns?: FormColumn[];
    fields: FormField[];
    order: number;
}

export interface Form {
    _id: string;
    storeId: string;
    name: string;
    slug: string;
    description?: string;
    sections: FormSection[];
    emailSettings: {
        to: string[];
        cc?: string[];
        bcc?: string[];
        replyTo?: string;
        subject: string;
        body: string;
    };
    confirmationEmail?: {
        enabled: boolean;
        replyTo?: string;
        subject?: string;
        body?: string;
    };
    status: 'draft' | 'published';
    submissionsCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface FormSubmission {
    _id: string;
    formId: string;
    storeId: string;
    data: Record<string, any>;
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
    };
    emailSent: boolean;
    confirmationEmailSent?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NewsletterSubscriber {
    _id: string;
    email: string;
    storeId: string | Store;
    status: 'subscribed' | 'unsubscribed';
    createdAt: string;
    updatedAt: string;
}
