import { FormField, FormSection, FormColumn } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Field type definitions with icons and labels
export interface FieldTypeDefinition {
    type: FormField['type'];
    label: string;
    icon: string;
    category: 'basic' | 'advanced' | 'file';
    description: string;
}

export const fieldTypeDefinitions: FieldTypeDefinition[] = [
    // Basic Fields
    { type: 'text', label: 'Text Input', icon: 'TextFields', category: 'basic', description: 'Single line text input' },
    { type: 'textarea', label: 'Text Area', icon: 'Notes', category: 'basic', description: 'Multi-line text input' },
    { type: 'email', label: 'Email', icon: 'Email', category: 'basic', description: 'Email address input' },
    { type: 'phone', label: 'Phone', icon: 'Phone', category: 'basic', description: 'Phone number input' },
    { type: 'date', label: 'Date', icon: 'CalendarToday', category: 'basic', description: 'Date picker' },
    { type: 'time', label: 'Time', icon: 'AccessTime', category: 'basic', description: 'Time picker' },
    { type: 'datetime', label: 'Date & Time', icon: 'Event', category: 'basic', description: 'Date and time picker' },

    // Advanced Fields
    { type: 'select', label: 'Dropdown', icon: 'ArrowDropDown', category: 'advanced', description: 'Select from options' },
    { type: 'radio', label: 'Radio Buttons', icon: 'RadioButtonChecked', category: 'advanced', description: 'Single choice from options' },
    { type: 'checkbox', label: 'Checkboxes', icon: 'CheckBox', category: 'advanced', description: 'Multiple choices' },
    { type: 'richtext', label: 'Rich Text', icon: 'FormatBold', category: 'advanced', description: 'Rich text editor' },
    { type: 'repeater', label: 'Repeater', icon: 'Repeat', category: 'advanced', description: 'Repeatable field group' },
    { type: 'query_param', label: 'Capture Query Params', icon: 'Link', category: 'advanced', description: 'Auto-capture URL query parameters' },

    // File Fields
    { type: 'file', label: 'File Upload', icon: 'AttachFile', category: 'file', description: 'File upload field' },
    { type: 'image', label: 'Image Upload', icon: 'Image', category: 'file', description: 'Image upload field' },
];

// Helper to get field definition
export const getFieldDefinition = (type: FormField['type']): FieldTypeDefinition | undefined => {
    return fieldTypeDefinitions.find(def => def.type === type);
};

// Create a new field
export const createField = (type: FormField['type'], order: number = 0): FormField => {
    const definition = getFieldDefinition(type);

    return {
        id: uuidv4(),
        type,
        label: definition?.label || type,
        name: `field_${Date.now()}`,
        required: false,
        order,
    };
};

// Create a new section
export const createFormSection = (type: FormSection['type'] = 'full-width'): FormSection => {
    const section: FormSection = {
        id: uuidv4(),
        type,
        fields: [],
        order: 0,
    };

    // Create columns for split layouts
    if (type === 'split-2') {
        section.columns = [
            { id: uuidv4(), width: 50, fields: [] },
            { id: uuidv4(), width: 50, fields: [] },
        ];
    } else if (type === 'split-3') {
        section.columns = [
            { id: uuidv4(), width: 33.33, fields: [] },
            { id: uuidv4(), width: 33.33, fields: [] },
            { id: uuidv4(), width: 33.34, fields: [] },
        ];
    } else if (type === 'split-4') {
        section.columns = [
            { id: uuidv4(), width: 25, fields: [] },
            { id: uuidv4(), width: 25, fields: [] },
            { id: uuidv4(), width: 25, fields: [] },
            { id: uuidv4(), width: 25, fields: [] },
        ];
    }

    return section;
};

// Get field validation rules based on type
export const getDefaultValidation = (type: FormField['type']): FormField['validation'] => {
    switch (type) {
        case 'email':
            return {
                pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
            };
        case 'phone':
            return {
                pattern: '^[0-9+\\-\\s()]+$',
                minLength: 10,
            };
        case 'text':
        case 'textarea':
            return {
                maxLength: type === 'text' ? 255 : 5000,
            };
        case 'file':
        case 'image':
            return {
                maxFileSize: 10 * 1024 * 1024, // 10MB
                fileTypes: type === 'image'
                    ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
                    : ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            };
        default:
            return undefined;
    }
};
