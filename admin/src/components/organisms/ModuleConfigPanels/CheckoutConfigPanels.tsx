// Checkout Content Configuration Panel for Admin Layout Builder
// Single unified panel with all checkout configuration in organized tabs

'use client';

import {
    Box,
    TextField,
    Switch,
    FormControlLabel,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Slider,
    Tabs,
    Tab,
    Divider,
    Alert,
} from '@mui/material';
import { useState } from 'react';

// Full checkout configuration type
export interface CheckoutContentConfig {
    mode: 'stepper' | 'one-page';
    progress: {
        style: 'numbered' | 'icons';
        showLabels: boolean;
        steps: string[];
    };
    address: {
        displayStyle: 'cards' | 'dropdown';
        showBillingToggle: boolean;
        showSaveAddress: boolean;
        maxSavedAddresses: number;
    };
    shipping: {
        showEstimatedDates: boolean;
        groupByCarrier: boolean;
        showShippingBreakdown: boolean;
    };
    payment: {
        showIcons: boolean;
        layout: 'grid' | 'list';
        showExtraCharges: boolean;
    };
    review: {
        showItemImages: boolean;
        showEditButtons: boolean;
        showCustomerNote: boolean;
    };
    summary: {
        sticky: boolean;
        showCoupon: boolean;
        collapsibleMobile: boolean;
        showCartItems: boolean;
        maxVisibleItems: number;
    };
    onePage: {
        expandedByDefault: 'address' | 'all' | 'none';
        showSectionNumbers: boolean;
        allowMultipleExpanded: boolean;
    };
}

interface CheckoutContentConfigPanelProps {
    config: CheckoutContentConfig;
    onChange: (config: CheckoutContentConfig) => void;
}

export const defaultCheckoutContentConfig: CheckoutContentConfig = {
    mode: 'stepper',
    progress: {
        style: 'numbered',
        showLabels: true,
        steps: ['Address', 'Shipping', 'Payment', 'Review'],
    },
    address: {
        displayStyle: 'cards',
        showBillingToggle: true,
        showSaveAddress: true,
        maxSavedAddresses: 5,
    },
    shipping: {
        showEstimatedDates: true,
        groupByCarrier: false,
        showShippingBreakdown: true,
    },
    payment: {
        showIcons: true,
        layout: 'list',
        showExtraCharges: true,
    },
    review: {
        showItemImages: true,
        showEditButtons: true,
        showCustomerNote: true,
    },
    summary: {
        sticky: true,
        showCoupon: true,
        collapsibleMobile: true,
        showCartItems: true,
        maxVisibleItems: 3,
    },
    onePage: {
        expandedByDefault: 'address',
        showSectionNumbers: true,
        allowMultipleExpanded: false,
    },
};

export default function CheckoutContentConfigPanel({ config, onChange }: CheckoutContentConfigPanelProps) {
    const [activeTab, setActiveTab] = useState(0);

    const updateMode = (mode: 'stepper' | 'one-page') => {
        onChange({ ...config, mode });
    };

    const updateSection = <K extends keyof CheckoutContentConfig>(
        section: K,
        value: CheckoutContentConfig[K]
    ) => {
        onChange({ ...config, [section]: value });
    };

    const updateNestedValue = <K extends keyof CheckoutContentConfig>(
        section: K,
        key: string,
        value: any
    ) => {
        onChange({
            ...config,
            [section]: { ...(config[section] as any), [key]: value },
        });
    };

    const tabs = [
        { label: 'Mode', icon: '⚙️' },
        { label: 'Progress', icon: '📊' },
        { label: 'Address', icon: '📍' },
        { label: 'Payment', icon: '💳' },
        { label: 'Review', icon: '✅' },
        { label: 'Summary', icon: '📋' },
    ];

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
                This is the <strong>required</strong> checkout module. Configure all checkout settings below.
            </Alert>

            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
                {tabs.map((tab, i) => (
                    <Tab
                        key={i}
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </Box>
                        }
                        sx={{ minHeight: 48, textTransform: 'none' }}
                    />
                ))}
            </Tabs>

            {/* Mode Tab */}
            {activeTab === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        Checkout Mode
                    </Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel>Mode</InputLabel>
                        <Select
                            value={config.mode}
                            label="Mode"
                            onChange={(e) => updateMode(e.target.value as any)}
                        >
                            <MenuItem value="stepper">Multi-Step (Stepper)</MenuItem>
                            <MenuItem value="one-page">Single Page (Accordion)</MenuItem>
                        </Select>
                    </FormControl>
                    <Typography variant="caption" color="text.secondary">
                        {config.mode === 'stepper'
                            ? 'Users progress through steps one at a time with a progress bar.'
                            : 'All sections shown on one page with expandable accordions.'}
                    </Typography>

                    {config.mode === 'one-page' && (
                        <Box sx={{ mt: 2 }}>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                One-Page Options
                            </Typography>
                            <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                                <InputLabel>Expanded By Default</InputLabel>
                                <Select
                                    value={config.onePage.expandedByDefault}
                                    label="Expanded By Default"
                                    onChange={(e) => updateNestedValue('onePage', 'expandedByDefault', e.target.value)}
                                >
                                    <MenuItem value="address">First Section (Address)</MenuItem>
                                    <MenuItem value="all">All Sections</MenuItem>
                                    <MenuItem value="none">None (All Collapsed)</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.onePage.showSectionNumbers}
                                        onChange={(e) => updateNestedValue('onePage', 'showSectionNumbers', e.target.checked)}
                                    />
                                }
                                label="Show Section Numbers"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config.onePage.allowMultipleExpanded}
                                        onChange={(e) => updateNestedValue('onePage', 'allowMultipleExpanded', e.target.checked)}
                                    />
                                }
                                label="Allow Multiple Sections Expanded"
                            />
                        </Box>
                    )}
                </Box>
            )}

            {/* Progress Tab */}
            {activeTab === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        Progress Bar Settings
                    </Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel>Display Style</InputLabel>
                        <Select
                            value={config.progress.style}
                            label="Display Style"
                            onChange={(e) => updateNestedValue('progress', 'style', e.target.value)}
                        >
                            <MenuItem value="numbered">Numbered Steps</MenuItem>
                            <MenuItem value="icons">Icon Steps</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.progress.showLabels}
                                onChange={(e) => updateNestedValue('progress', 'showLabels', e.target.checked)}
                            />
                        }
                        label="Show Step Labels"
                    />
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Steps: {config.progress.steps.join(' → ')}
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Address Tab */}
            {activeTab === 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        Address Section
                    </Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel>Address Display</InputLabel>
                        <Select
                            value={config.address.displayStyle}
                            label="Address Display"
                            onChange={(e) => updateNestedValue('address', 'displayStyle', e.target.value)}
                        >
                            <MenuItem value="cards">Cards (Grid)</MenuItem>
                            <MenuItem value="dropdown">Dropdown List</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.address.showBillingToggle}
                                onChange={(e) => updateNestedValue('address', 'showBillingToggle', e.target.checked)}
                            />
                        }
                        label="Show 'Same as Shipping' Toggle"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.address.showSaveAddress}
                                onChange={(e) => updateNestedValue('address', 'showSaveAddress', e.target.checked)}
                            />
                        }
                        label="Allow Saving New Addresses"
                    />
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Max Saved Addresses: {config.address.maxSavedAddresses}
                        </Typography>
                        <Slider
                            value={config.address.maxSavedAddresses}
                            onChange={(_, val) => updateNestedValue('address', 'maxSavedAddresses', val)}
                            min={1}
                            max={10}
                            step={1}
                            valueLabelDisplay="auto"
                        />
                    </Box>
                </Box>
            )}

            {/* Payment Tab */}
            {activeTab === 3 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        Payment Section
                    </Typography>
                    <FormControl fullWidth size="small">
                        <InputLabel>Layout</InputLabel>
                        <Select
                            value={config.payment.layout}
                            label="Layout"
                            onChange={(e) => updateNestedValue('payment', 'layout', e.target.value)}
                        >
                            <MenuItem value="list">List View</MenuItem>
                            <MenuItem value="grid">Grid View</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.payment.showIcons}
                                onChange={(e) => updateNestedValue('payment', 'showIcons', e.target.checked)}
                            />
                        }
                        label="Show Payment Method Icons"
                    />
                </Box>
            )}

            {/* Review Tab */}
            {activeTab === 4 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        Review Section
                    </Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.review.showEditButtons}
                                onChange={(e) => updateNestedValue('review', 'showEditButtons', e.target.checked)}
                            />
                        }
                        label="Show Edit Buttons"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.review.showCustomerNote}
                                onChange={(e) => updateNestedValue('review', 'showCustomerNote', e.target.checked)}
                            />
                        }
                        label="Show Customer Note Input"
                    />
                </Box>
            )}

            {/* Summary Tab */}
            {activeTab === 5 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                        Order Summary (Sidebar)
                    </Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.summary.collapsibleMobile}
                                onChange={(e) => updateNestedValue('summary', 'collapsibleMobile', e.target.checked)}
                            />
                        }
                        label="Collapsible on Mobile"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.summary.showCoupon}
                                onChange={(e) => updateNestedValue('summary', 'showCoupon', e.target.checked)}
                            />
                        }
                        label="Show Coupon Input"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={config.summary.showCartItems}
                                onChange={(e) => updateNestedValue('summary', 'showCartItems', e.target.checked)}
                            />
                        }
                        label="Show Cart Items Preview"
                    />
                    {config.summary.showCartItems && (
                        <Box>
                            <Typography variant="caption" color="text.secondary">
                                Max Visible Items: {config.summary.maxVisibleItems}
                            </Typography>
                            <Slider
                                value={config.summary.maxVisibleItems}
                                onChange={(_, val) => updateNestedValue('summary', 'maxVisibleItems', val)}
                                min={1}
                                max={10}
                                step={1}
                                valueLabelDisplay="auto"
                            />
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}
