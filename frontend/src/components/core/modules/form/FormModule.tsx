'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/services/api-client';
import { ModuleProps } from '@/components/core/modules';
import styles from './form.module.scss';

interface FormField {
    id: string;
    type: string;
    label: string;
    name: string;
    placeholder?: string;
    required: boolean;
    options?: Array<{ label: string; value: string }>;
    validation?: any;
    subFields?: any[];
    repeaterConfig?: any;
}

interface FormSection {
    id: string;
    name?: string;
    type: 'full-width' | 'split-2' | 'split-3' | 'split-4';
    columns?: Array<{ id: string; width: number; fields: FormField[] }>;
    fields: FormField[];
}

interface FormData {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    sections: FormSection[];
    status: 'draft' | 'published';
}

export default function FormModule({ config }: ModuleProps) {
    const [form, setForm] = useState<FormData | null>(null);
    const [formValues, setFormValues] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});

    const {
        formId,
        showTitle = true,
        showDescription = true,
        submitButtonText = 'Submit',
        successMessage = 'Thank you! Your submission has been received.',
        redirectUrl,
    } = config;

    useEffect(() => {
        if (formId) {
            fetchForm();
        }
    }, [formId]);

    const fetchForm = async () => {
        try {
            const response = await apiClient.get(`forms/public/id/${formId}`);
            const formData = response.form || response.data;
            setForm(formData);

            // Initialize default values for repeater fields
            const initialValues: Record<string, any> = {};
            const allFields = getAllFields(formData.sections);

            allFields.forEach(field => {
                if (field.type === 'repeater') {
                    const min = field.repeaterConfig?.minInstances || 0;
                    const defaultItem = (field.subFields || []).reduce((acc: any, sub: any) => {
                        acc[sub.name] = '';
                        return acc;
                    }, {});
                    initialValues[field.name] = Array(min).fill(null).map(() => ({ ...defaultItem }));
                }
            });

            setFormValues(prev => ({ ...prev, ...initialValues }));
        } catch (error) {
            console.error('Error fetching form:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (fieldName: string, value: any, repeaterIndex?: number, subFieldName?: string) => {
        if (repeaterIndex !== undefined && subFieldName) {
            setFormValues(prev => {
                const repeaterValues = [...(prev[fieldName] || [])];
                repeaterValues[repeaterIndex] = {
                    ...repeaterValues[repeaterIndex],
                    [subFieldName]: value
                };
                return { ...prev, [fieldName]: repeaterValues };
            });

            const errorKey = `${fieldName}[${repeaterIndex}].${subFieldName}`;
            if (errors[errorKey]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[errorKey];
                    return newErrors;
                });
            }
        } else {
            setFormValues(prev => ({ ...prev, [fieldName]: value }));
            if (errors[fieldName]) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[fieldName];
                    return newErrors;
                });
            }
        }
    };

    const handleRepeaterAdd = (fieldName: string, subFields: any[]) => {
        const field = getAllFields(form?.sections || []).find(f => f.name === fieldName);
        const max = field?.repeaterConfig?.maxInstances;
        const currentCount = (formValues[fieldName] || []).length;

        if (max && currentCount >= max) return;

        const defaultItem = (subFields || []).reduce((acc: any, sub: any) => {
            acc[sub.name] = '';
            return acc;
        }, {});

        setFormValues(prev => ({
            ...prev,
            [fieldName]: [...(prev[fieldName] || []), defaultItem]
        }));
    };

    const handleRepeaterRemove = (fieldName: string, index: number) => {
        const field = getAllFields(form?.sections || []).find(f => f.name === fieldName);
        const min = field?.repeaterConfig?.minInstances || 0;
        const currentCount = (formValues[fieldName] || []).length;

        if (currentCount <= min) return;

        setFormValues(prev => ({
            ...prev,
            [fieldName]: (prev[fieldName] || []).filter((_: any, i: number) => i !== index)
        }));
    };

    const handleFileChange = (fieldName: string, files: FileList | null) => {
        if (files) {
            setUploadedFiles(prev => ({ ...prev, [fieldName]: Array.from(files) }));
        }
    };

    const validateField = (field: FormField, value: any): string | null => {
        // Handle strings, arrays, and other types for required check
        const isEmpty =
            value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '') ||
            (Array.isArray(value) && value.length === 0);

        if (field.required && isEmpty) {
            return `${field.label} is required`;
        }

        if (!isEmpty && field.validation) {
            const { minLength, maxLength, pattern, min, max } = field.validation;
            const strValue = String(value);

            if (minLength && strValue.length < minLength) {
                return `${field.label} must be at least ${minLength} characters`;
            }
            if (maxLength && strValue.length > maxLength) {
                return `${field.label} must be at most ${maxLength} characters`;
            }
            if (pattern && !new RegExp(pattern).test(strValue)) {
                return `${field.label} format is invalid`;
            }
            if (min !== undefined && parseFloat(strValue) < min) {
                return `${field.label} must be at least ${min}`;
            }
            if (max !== undefined && parseFloat(strValue) > max) {
                return `${field.label} must be at most ${max}`;
            }
        }

        // Standard validation by type
        if (!isEmpty) {
            if (field.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
                if (!emailRegex.test(String(value))) {
                    return `Please enter a valid email address (e.g., example@domain.com)`;
                }
            }
            if (field.type === 'phone') {
                const phoneRegex = /^[\d\s+\-()]*$/;
                if (!phoneRegex.test(String(value))) {
                    return `Please enter a valid phone number (numbers and symbols only)`;
                }
            }
        }

        return null;
    };

    const getAllFields = (sections: FormSection[]): FormField[] => {
        const fields: FormField[] = [];
        sections.forEach(section => {
            if (section.type !== 'full-width' && section.columns && section.columns.length > 0) {
                section.columns.forEach(col => fields.push(...col.fields));
            } else if (section.fields) {
                fields.push(...section.fields);
            }
        });
        return fields;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form) return;

        // Validate all fields
        const newErrors: Record<string, string> = {};
        const allFields = getAllFields(form.sections);

        allFields.forEach(field => {
            if (field.type === 'repeater') {
                const repeaterItems = formValues[field.name] || [];
                const min = field.repeaterConfig?.minInstances || 0;

                if (field.required && repeaterItems.length === 0) {
                    newErrors[field.name] = `${field.label} requires at least one item`;
                } else if (repeaterItems.length < min) {
                    newErrors[field.name] = `${field.label} requires at least ${min} items`;
                }

                repeaterItems.forEach((item: any, index: number) => {
                    (field.subFields || []).forEach((subField: any) => {
                        const error = validateField(subField, item[subField.name]);
                        if (error) {
                            newErrors[`${field.name}[${index}].${subField.name}`] = error;
                        }
                    });
                });
            } else if (field.type === 'file' || field.type === 'image') {
                const files = uploadedFiles[field.name] || [];
                if (field.required && files.length === 0) {
                    newErrors[field.name] = `${field.label} is required`;
                }
                // Custom validation for file size/type can be added here
            } else {
                const error = validateField(field, formValues[field.name]);
                if (error) {
                    newErrors[field.name] = error;
                }
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSubmitting(true);

        try {
            const formData = new FormData();

            // Append form values individually for backend to process
            Object.entries(formValues).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    // Check if it's a repeater (array of objects) or a multi-select (array of primitives)
                    if (value.length > 0 && typeof value[0] === 'object' && !Array.isArray(value[0])) {
                        formData.append(key, JSON.stringify(value));
                    } else {
                        value.forEach(v => formData.append(key, v));
                    }
                } else {
                    formData.append(key, value);
                }
            });

            // Append files
            Object.entries(uploadedFiles).forEach(([fieldName, files]) => {
                files.forEach(file => {
                    formData.append(fieldName, file);
                });
            });

            await apiClient.upload(
                `forms/public/submit/id/${formId}`,
                formData
            );

            setSubmitted(true);

            // Redirect if URL provided
            if (redirectUrl) {
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 1500);
            }
        } catch (error: any) {
            console.error('Error submitting form:', error);

            // Extract the most relevant error message from the server response
            const serverMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Failed to submit form. Please try again.';

            setErrors({ submit: serverMessage });
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (field: FormField) => {
        const value = formValues[field.name] || '';
        const error = errors[field.name];

        const commonProps = {
            id: field.id,
            name: field.name,
            required: field.required,
            className: `${styles.input} ${error ? styles.error : ''}`,
        };

        const renderFieldContent = () => {
            switch (field.type) {
                case 'text':
                case 'email':
                case 'phone':
                    return (
                        <input
                            {...commonProps}
                            type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                            value={value}
                            onChange={(e) => {
                                let val = e.target.value;
                                if (field.type === 'phone') {
                                    val = val.replace(/[a-zA-Z]/g, '');
                                }
                                handleInputChange(field.name, val);
                            }}
                            placeholder={field.placeholder}
                        />
                    );

                case 'textarea':
                case 'richtext':
                    return (
                        <textarea
                            {...commonProps}
                            value={value}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            rows={field.type === 'richtext' ? 6 : 4}
                        />
                    );

                case 'date':
                case 'time':
                case 'datetime':
                    return (
                        <input
                            {...commonProps}
                            type={field.type === 'datetime' ? 'datetime-local' : field.type}
                            value={value}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                        />
                    );

                case 'select':
                    return (
                        <select
                            {...commonProps}
                            value={value}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                        >
                            <option value="">Select an option</option>
                            {field.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    );

                case 'radio':
                    return (
                        <div className={`${styles.radioGroup} ${error ? styles.errorGroup : ''}`}>
                            {field.options?.map((opt) => (
                                <label key={opt.value} className={styles.radioLabel}>
                                    <input
                                        type="radio"
                                        name={field.name}
                                        value={opt.value}
                                        checked={value === opt.value}
                                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                                        required={field.required}
                                    />
                                    <span>{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    );

                case 'checkbox':
                    return (
                        <div className={`${styles.checkboxGroup} ${error ? styles.errorGroup : ''}`}>
                            {field.options?.map((opt) => (
                                <label key={opt.value} className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        name={field.name}
                                        value={opt.value}
                                        checked={(value || []).includes(opt.value)}
                                        onChange={(e) => {
                                            const currentValues = value || [];
                                            const newValues = e.target.checked
                                                ? [...currentValues, opt.value]
                                                : currentValues.filter((v: string) => v !== opt.value);
                                            handleInputChange(field.name, newValues);
                                        }}
                                    />
                                    <span>{opt.label}</span>
                                </label>
                            ))}
                        </div>
                    );

                case 'file':
                case 'image':
                    return (
                        <input
                            {...commonProps}
                            type="file"
                            accept={field.type === 'image' ? 'image/*' : undefined}
                            onChange={(e) => handleFileChange(field.name, e.target.files)}
                            multiple={false}
                        />
                    );

                case 'repeater': {
                    const items = formValues[field.name] || [];
                    const config = field.repeaterConfig || {};
                    const min = config.minInstances || 0;
                    const max = config.maxInstances;

                    return (
                        <div className={`${styles.repeater} ${error ? styles.errorContainer : ''}`}>
                            <div className={styles.repeaterList}>
                                {items.map((item: any, index: number) => (
                                    <div key={index} className={styles.repeaterItem}>
                                        <div className={styles.repeaterItemHeader}>
                                            <span className={styles.repeaterItemTitle}>
                                                Item #{index + 1}
                                            </span>
                                            {items.length > min && (
                                                <button
                                                    type="button"
                                                    className={styles.removeButton}
                                                    onClick={() => handleRepeaterRemove(field.name, index)}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                        <div className={styles.repeaterItemFields}>
                                            {(field.subFields || []).map((subField) => {
                                                const subValue = item[subField.name] || '';
                                                const subError = errors[`${field.name}[${index}].${subField.name}`];

                                                return (
                                                    <div key={subField.name} className={styles.field}>
                                                        <label className={styles.label}>
                                                            {subField.label}
                                                        </label>
                                                        <input
                                                            className={`${styles.input} ${subError ? styles.error : ''}`}
                                                            type={
                                                                subField.type === 'email' ? 'email' :
                                                                    subField.type === 'phone' ? 'tel' :
                                                                        subField.type === 'date' ? 'date' :
                                                                            'text'
                                                            }
                                                            value={subValue}
                                                            onChange={(e) => {
                                                                let val = e.target.value;
                                                                // Prevent alphabets in phone fields immediately
                                                                if (subField.type === 'phone') {
                                                                    val = val.replace(/[a-zA-Z]/g, '');
                                                                }
                                                                handleInputChange(field.name, val, index, subField.name);
                                                            }}
                                                            placeholder={subField.placeholder}
                                                        />
                                                        {subError && <span className={styles.errorText}>{subError}</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {(!max || items.length < max) && (
                                <button
                                    type="button"
                                    className={styles.addButton}
                                    onClick={() => handleRepeaterAdd(field.name, field.subFields || [])}
                                >
                                    + {config.addButtonText || 'Add Item'}
                                </button>
                            )}
                        </div>
                    );
                }

                default:
                    return null;
            }
        };

        return (
            <div key={field.id} className={styles.field}>
                <label htmlFor={field.id} className={styles.label}>
                    {field.label}
                    {field.required && <span className={styles.required}>*</span>}
                </label>
                {renderFieldContent()}
                {error && <span className={styles.errorText}>{error}</span>}
            </div>
        );
    };

    const renderSection = (section: FormSection) => {
        const hasVisibleName = section.name && section.name !== 'Untitled Section';
        const isFullWidth = section.type === 'full-width' || !section.columns || section.columns.length === 0;

        if (isFullWidth) {
            return (
                <div key={section.id} className={styles.section}>
                    {hasVisibleName && <h3 className={styles.sectionTitle}>{section.name}</h3>}
                    <div className={styles.fullWidthFields}>
                        {(section.fields || []).map(renderField)}
                    </div>
                </div>
            );
        }

        return (
            <div key={section.id} className={styles.section}>
                {hasVisibleName && <h3 className={styles.sectionTitle}>{section.name}</h3>}
                <div
                    className={styles.columns}
                    style={{
                        gridTemplateColumns: (section.columns || []).map(c => `${c.width}fr`).join(' ')
                    }}
                >
                    {(section.columns || []).map(column => (
                        <div key={column.id} className={styles.column}>
                            {column.fields.map(renderField)}
                        </div>
                    ))}
                </div>            </div>
        );
    };

    if (loading) {
        return <div className={styles.loading}>Loading form...</div>;
    }

    if (!form) {
        return <div className={styles.error}>Form not found</div>;
    }

    if (form.status !== 'published') {
        return <div className={styles.error}>This form is not currently available</div>;
    }

    if (submitted) {
        return (
            <div className={styles.success}>
                <div className={styles.successIcon}>✓</div>
                <h3>{successMessage}</h3>
                {redirectUrl && <p>Redirecting...</p>}
            </div>
        );
    }

    return (
        <div className={styles.formModule}>
            {showTitle && <h2 className={styles.title}>{form.name}</h2>}
            {showDescription && form.description && (
                <p className={styles.description}>{form.description}</p>
            )}

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
                {form.sections.map(renderSection)}

                {errors.submit && (
                    <div className={styles.submitError}>{errors.submit}</div>
                )}

                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={submitting}
                >
                    {submitting ? 'Submitting...' : submitButtonText}
                </button>
            </form>
        </div>
    );
}
