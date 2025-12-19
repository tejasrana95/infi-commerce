'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    List,
    ListItem,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { FooterElement } from '@/types';
import MenuAutocomplete from '@/components/molecules/MenuAutocomplete';
import RichTextEditor from '@/components/molecules/RichTextEditor';

interface FooterElementConfigProps {
    open: boolean;
    element: FooterElement | null;
    onClose: () => void;
    onSave: (element: FooterElement) => void;
    storeId: string;
    menus?: any[];
}

export default function FooterElementConfig({
    open,
    element,
    onClose,
    onSave,
    storeId,
}: FooterElementConfigProps) {
    const [formData, setFormData] = useState<FooterElement | null>(null);

    useEffect(() => {
        if (element) {
            setFormData({ ...element });
        }
    }, [element]);

    const handleSave = () => {
        if (formData) {
            onSave(formData);
        }
        onClose();
    };

    // Social Links Management
    const handleAddSocialLink = () => {
        if (!formData) return;
        const currentLinks = formData.settings?.socialLinks || [];
        setFormData({
            ...formData,
            settings: {
                ...formData.settings,
                socialLinks: [
                    ...currentLinks,
                    { id: Date.now().toString(), platform: 'facebook', url: '' },
                ],
            },
        });
    };

    const handleUpdateSocialLink = (id: string, field: 'platform' | 'url', value: string) => {
        if (!formData) return;
        const currentLinks = formData.settings?.socialLinks || [];
        setFormData({
            ...formData,
            settings: {
                ...formData.settings,
                socialLinks: currentLinks.map(link =>
                    link.id === id ? { ...link, [field]: value } : link
                ),
            },
        });
    };

    const handleDeleteSocialLink = (id: string) => {
        if (!formData) return;
        const currentLinks = formData.settings?.socialLinks || [];
        setFormData({
            ...formData,
            settings: {
                ...formData.settings,
                socialLinks: currentLinks.filter(link => link.id !== id),
            },
        });
    };

    // Payment Methods Management
    const handleAddPaymentMethod = () => {
        if (!formData) return;
        const currentMethods = formData.settings?.paymentMethods || [];
        setFormData({
            ...formData,
            settings: {
                ...formData.settings,
                paymentMethods: [
                    ...currentMethods,
                    { id: Date.now().toString(), name: '', icon: '' },
                ],
            },
        });
    };

    const handleUpdatePaymentMethod = (id: string, field: 'name' | 'icon', value: string) => {
        if (!formData) return;
        const currentMethods = formData.settings?.paymentMethods || [];
        setFormData({
            ...formData,
            settings: {
                ...formData.settings,
                paymentMethods: currentMethods.map(method =>
                    method.id === id ? { ...method, [field]: value } : method
                ),
            },
        });
    };

    const handleDeletePaymentMethod = (id: string) => {
        if (!formData) return;
        const currentMethods = formData.settings?.paymentMethods || [];
        setFormData({
            ...formData,
            settings: {
                ...formData.settings,
                paymentMethods: currentMethods.filter(method => method.id !== id),
            },
        });
    };

    if (!element || !formData) return null;

    const getTitle = () => {
        const titles: Record<string, string> = {
            'menu': 'Menu Settings',
            'text': 'Text Block Settings',
            'html': 'Custom HTML Settings',
            'newsletter': 'Newsletter Settings',
            'social': 'Social Links Settings',
            'contact': 'Contact Info Settings',
            'payment-methods': 'Payment Methods Settings',
        };
        return titles[formData.type] || 'Element Settings';
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{getTitle()}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    {/* Menu Configuration */}
                    {formData.type === 'menu' && (
                        <>
                            <MenuAutocomplete
                                value={formData.menuId || null}
                                onChange={(value) => setFormData({ ...formData, menuId: value })}
                                storeId={storeId}
                                label="Select Menu"
                                placeholder="Choose a menu to display"
                                location="footer"
                            />
                            <Typography variant="caption" color="text.secondary">
                                Select a menu to display. Create menus in the Menu Designer.
                            </Typography>
                        </>
                    )}

                    {/* Text Configuration */}
                    {formData.type === 'text' && (
                        <>
                            <RichTextEditor
                                value={formData.content || ''}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        content: value,
                                    })
                                }
                                variant="minimal"
                                placeholder="Enter your text content..."
                            />
                            <Typography variant="caption" color="text.secondary">
                                Add formatted text content for the footer
                            </Typography>
                        </>
                    )}

                    {/* HTML Configuration */}
                    {formData.type === 'html' && (
                        <>
                            <TextField
                                label="HTML Content"
                                value={formData.content || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        content: e.target.value,
                                    })
                                }
                                multiline
                                rows={6}
                                fullWidth
                                placeholder="<div>Your custom HTML here</div>"
                            />
                            <Typography variant="caption" color="text.secondary">
                                Add custom HTML content. Use with caution.
                            </Typography>
                        </>
                    )}

                    {/* Newsletter Configuration */}
                    {formData.type === 'newsletter' && (
                        <>
                            <TextField
                                label="Title"
                                value={formData.settings?.newsletterTitle || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            newsletterTitle: e.target.value,
                                        },
                                    })
                                }
                                fullWidth
                                placeholder="Subscribe to our newsletter"
                            />
                            <TextField
                                label="Description"
                                value={formData.settings?.newsletterDescription || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            newsletterDescription: e.target.value,
                                        },
                                    })
                                }
                                multiline
                                rows={2}
                                fullWidth
                                placeholder="Get the latest updates and offers"
                            />
                            <TextField
                                label="Placeholder"
                                value={formData.settings?.newsletterPlaceholder || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            newsletterPlaceholder: e.target.value,
                                        },
                                    })
                                }
                                fullWidth
                                placeholder="Enter your email"
                            />
                            <TextField
                                label="Button Text"
                                value={formData.settings?.newsletterButtonText || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            newsletterButtonText: e.target.value,
                                        },
                                    })
                                }
                                fullWidth
                                placeholder="Subscribe"
                            />
                        </>
                    )}

                    {/* Social Links Configuration */}
                    {formData.type === 'social' && (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2">Social Links</Typography>
                                <Button size="small" startIcon={<AddIcon />} onClick={handleAddSocialLink}>
                                    Add Link
                                </Button>
                            </Box>
                            <List>
                                {(formData.settings?.socialLinks || []).map((link) => (
                                    <ListItem
                                        key={link.id}
                                        sx={{ gap: 1, px: 0 }}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleDeleteSocialLink(link.id)}
                                                size="small"
                                                color="error"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        }
                                    >
                                        <FormControl sx={{ minWidth: 120 }} size="small">
                                            <Select
                                                value={link.platform}
                                                onChange={(e) =>
                                                    handleUpdateSocialLink(link.id, 'platform', e.target.value)
                                                }
                                            >
                                                <MenuItem value="facebook">Facebook</MenuItem>
                                                <MenuItem value="twitter">Twitter</MenuItem>
                                                <MenuItem value="instagram">Instagram</MenuItem>
                                                <MenuItem value="linkedin">LinkedIn</MenuItem>
                                                <MenuItem value="youtube">YouTube</MenuItem>
                                                <MenuItem value="pinterest">Pinterest</MenuItem>
                                                <MenuItem value="tiktok">TikTok</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            size="small"
                                            placeholder="URL"
                                            value={link.url}
                                            onChange={(e) => handleUpdateSocialLink(link.id, 'url', e.target.value)}
                                            fullWidth
                                        />
                                    </ListItem>
                                ))}
                            </List>
                            {(formData.settings?.socialLinks || []).length === 0 && (
                                <Typography variant="body2" color="text.secondary" textAlign="center">
                                    No social links added yet
                                </Typography>
                            )}
                        </>
                    )}

                    {/* Contact Info Configuration */}
                    {formData.type === 'contact' && (
                        <>
                            <TextField
                                label="Address"
                                value={formData.settings?.contactInfo?.address || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            contactInfo: {
                                                ...formData.settings?.contactInfo,
                                                address: e.target.value,
                                            },
                                        },
                                    })
                                }
                                multiline
                                rows={2}
                                fullWidth
                            />
                            <TextField
                                label="Phone"
                                value={formData.settings?.contactInfo?.phone || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            contactInfo: {
                                                ...formData.settings?.contactInfo,
                                                phone: e.target.value,
                                            },
                                        },
                                    })
                                }
                                fullWidth
                            />
                            <TextField
                                label="Email"
                                type="email"
                                value={formData.settings?.contactInfo?.email || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            contactInfo: {
                                                ...formData.settings?.contactInfo,
                                                email: e.target.value,
                                            },
                                        },
                                    })
                                }
                                fullWidth
                            />
                            <TextField
                                label="Working Hours"
                                value={formData.settings?.contactInfo?.workingHours || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            contactInfo: {
                                                ...formData.settings?.contactInfo,
                                                workingHours: e.target.value,
                                            },
                                        },
                                    })
                                }
                                fullWidth
                                placeholder="Mon-Fri: 9AM-6PM"
                            />
                        </>
                    )}

                    {/* Payment Methods Configuration */}
                    {formData.type === 'payment-methods' && (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2">Payment Methods</Typography>
                                <Button size="small" startIcon={<AddIcon />} onClick={handleAddPaymentMethod}>
                                    Add Method
                                </Button>
                            </Box>
                            <List>
                                {(formData.settings?.paymentMethods || []).map((method) => (
                                    <ListItem
                                        key={method.id}
                                        sx={{ gap: 1, px: 0 }}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                onClick={() => handleDeletePaymentMethod(method.id)}
                                                size="small"
                                                color="error"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        }
                                    >
                                        <TextField
                                            size="small"
                                            placeholder="Name (e.g., Visa)"
                                            value={method.name}
                                            onChange={(e) => handleUpdatePaymentMethod(method.id, 'name', e.target.value)}
                                            sx={{ flex: 1 }}
                                        />
                                        <TextField
                                            size="small"
                                            placeholder="Icon URL"
                                            value={method.icon}
                                            onChange={(e) => handleUpdatePaymentMethod(method.id, 'icon', e.target.value)}
                                            sx={{ flex: 1 }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                            {(formData.settings?.paymentMethods || []).length === 0 && (
                                <Typography variant="body2" color="text.secondary" textAlign="center">
                                    No payment methods added yet
                                </Typography>
                            )}
                        </>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
}
