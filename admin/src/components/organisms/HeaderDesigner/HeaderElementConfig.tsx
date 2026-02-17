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
    FormControlLabel,
    Switch,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import { HeaderElement } from '@/types';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import MenuAutocomplete from '@/components/molecules/MenuAutocomplete';
import { FileItem } from '@/types/file';

interface HeaderElementConfigProps {
    open: boolean;
    element: HeaderElement | null;
    onClose: () => void;
    onSave: (element: HeaderElement) => void;
    storeId: string;
}

export default function HeaderElementConfig({
    open,
    element,
    onClose,
    onSave,
    storeId,
}: HeaderElementConfigProps) {
    const [formData, setFormData] = useState<HeaderElement | null>(null);

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

    const handleFileSelect = (files: FileItem[]) => {
        if (files.length > 0 && formData) {
            setFormData({
                ...formData,
                settings: {
                    ...formData.settings,
                    logoUrl: files[0].url,
                },
            });
        }
    };

    if (!element || !formData) return null;

    const getTitle = () => {
        const titles: Record<string, string> = {
            'logo': 'Logo Settings',
            'menu': 'Menu Settings',
            'search': 'Search Bar Settings',
            'cart': 'Cart Icon Settings',
            'account': 'Account Settings',
            'wishlist': 'Wishlist Settings',
            'currency': 'Currency Settings',
            'custom': 'Custom HTML Settings',
        };
        return titles[formData.type] || 'Element Settings';
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{getTitle()}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    {/* Logo Configuration */}
                    {formData.type === 'logo' && (
                        <>
                            <Box>
                                <FileManagerButton
                                    onSelect={handleFileSelect}
                                    multiple={false}
                                    accept="image/*"
                                    label={formData.settings?.logoUrl ? 'Change Logo' : 'Upload Logo'}
                                    variant="outlined"
                                    fullWidth
                                />
                                {formData.settings?.logoUrl && (
                                    <Box sx={{ mt: 2, textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                        <img
                                            src={formData.settings.logoUrl}
                                            alt="Logo preview"
                                            style={{ maxWidth: '100%', maxHeight: 100 }}
                                        />
                                    </Box>
                                )}
                            </Box>
                            <TextField
                                label="Logo Height (px)"
                                type="number"
                                value={formData.settings?.logoHeight || 50}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            logoHeight: parseInt(e.target.value),
                                        },
                                    })
                                }
                                fullWidth
                            />
                            <TextField
                                label="Alt Text"
                                value={formData.settings?.logoAlt || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            logoAlt: e.target.value,
                                        },
                                    })
                                }
                                fullWidth
                                placeholder="Store Logo"
                            />
                        </>
                    )}

                    {/* Menu Configuration */}
                    {formData.type === 'menu' && (
                        <>
                            <MenuAutocomplete
                                value={formData.menuId || null}
                                onChange={(value) => setFormData({ ...formData, menuId: value })}
                                storeId={storeId}
                                label="Select Menu"
                                placeholder="Choose a menu to display"
                                location="header"
                            />
                            <Typography variant="caption" color="text.secondary">
                                Select a menu to display in the header. Create menus in the Menu Designer.
                            </Typography>
                        </>
                    )}

                    {/* Search Configuration */}
                    {formData.type === 'search' && (
                        <>
                            <TextField
                                label="Placeholder Text"
                                value={formData.settings?.searchPlaceholder || 'Search products...'}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            searchPlaceholder: e.target.value,
                                        },
                                    })
                                }
                                fullWidth
                            />
                            <TextField
                                label="Button Text"
                                value={formData.settings?.searchButtonText || 'Search'}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            searchButtonText: e.target.value,
                                        },
                                    })
                                }
                                fullWidth
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.settings?.expandedForDesktop ?? false}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                settings: {
                                                    ...formData.settings,
                                                    expandedForDesktop: e.target.checked,
                                                },
                                            })
                                        }
                                    />
                                }
                                label="Expanded for Desktop"
                            />
                            <Typography variant="caption" color="text.secondary">
                                If enabled, the search bar will be always visible on desktop instead of showing just an icon.
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.settings?.showMobileOnly ?? false}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                settings: {
                                                    ...formData.settings,
                                                    showMobileOnly: e.target.checked,
                                                },
                                            })
                                        }
                                    />
                                }
                                label="Show in Mobile & Tablet Only"
                            />
                            <Typography variant="caption" color="text.secondary">
                                If enabled, this search bar will only appear on mobile and tablet devices. Use this to add a mobile-specific search variant alongside an expanded desktop search.
                            </Typography>
                        </>
                    )}

                    {/* Cart Configuration */}
                    {formData.type === 'cart' && (
                        <>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.settings?.showCartCount ?? true}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                settings: {
                                                    ...formData.settings,
                                                    showCartCount: e.target.checked,
                                                },
                                            })
                                        }
                                    />
                                }
                                label="Show Cart Count Badge"
                            />
                            <FormControl fullWidth>
                                <InputLabel>Cart Icon Style</InputLabel>
                                <Select
                                    value={formData.settings?.cartIconStyle || 'default'}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            settings: {
                                                ...formData.settings,
                                                cartIconStyle: e.target.value as any,
                                            },
                                        })
                                    }
                                    label="Cart Icon Style"
                                >
                                    <MenuItem value="default">Shopping Cart</MenuItem>
                                    <MenuItem value="bag">Shopping Bag</MenuItem>
                                    <MenuItem value="basket">Basket</MenuItem>
                                </Select>
                            </FormControl>
                        </>
                    )}

                    {/* Account Configuration */}
                    {formData.type === 'account' && (
                        <>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.settings?.showLoginRegister ?? true}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                settings: {
                                                    ...formData.settings,
                                                    showLoginRegister: e.target.checked,
                                                },
                                            })
                                        }
                                    />
                                }
                                label="Show Login/Register Text"
                            />
                            <TextField
                                label="Login Text"
                                value={formData.settings?.loginText || 'Login'}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            loginText: e.target.value,
                                        },
                                    })
                                }
                                fullWidth
                            />
                            <TextField
                                label="Register Text"
                                value={formData.settings?.registerText || 'Register'}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            registerText: e.target.value,
                                        },
                                    })
                                }
                                fullWidth
                            />
                        </>
                    )}

                    {/* Wishlist Configuration */}
                    {formData.type === 'wishlist' && (
                        <FormControl fullWidth>
                            <InputLabel>Icon Style</InputLabel>
                            <Select
                                value={formData.settings?.wishlistIconStyle || 'heart'}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            wishlistIconStyle: e.target.value as any,
                                        },
                                    })
                                }
                                label="Icon Style"
                            >
                                <MenuItem value="default">Default</MenuItem>
                                <MenuItem value="heart">Heart</MenuItem>
                                <MenuItem value="star">Star</MenuItem>
                            </Select>
                        </FormControl>
                    )}

                    {/* Currency Configuration */}
                    {formData.type === 'currency' && (
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                This element displays a currency selector based on enabled currencies.
                            </Typography>
                        </Box>
                    )}

                    {/* Custom HTML Configuration */}
                    {formData.type === 'custom' && (
                        <>
                            <TextField
                                label="Custom HTML"
                                value={formData.settings?.customHtml || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        settings: {
                                            ...formData.settings,
                                            customHtml: e.target.value,
                                        },
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
