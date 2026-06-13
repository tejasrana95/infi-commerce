'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    IconButton,
    Divider,
    Collapse,
    Menu,
    MenuItem as MuiMenuItem,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Switch,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Settings as SettingsIcon,
    Menu as MenuIcon,
    TextFields as TextIcon,
    Code as HtmlIcon,
    Email as NewsletterIcon,
    Share as SocialIcon,
    Phone as ContactIcon,
    Payment as PaymentIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Facebook as FacebookIcon,
    Twitter as TwitterIcon,
    Instagram as InstagramIcon,
    LinkedIn as LinkedInIcon,
    YouTube as YouTubeIcon,
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { DndContext, DragEndEvent, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ThemeConfig, FooterElement, FooterColumn, FooterRow, FooterRowSettings, Menu as MenuType } from '@/types';
import FooterElementConfig from './FooterElementConfig';
import PreviewContainer from '@/components/molecules/PreviewContainer';
import { SortableFooterElement, SortableFooterColumn } from './SortableComponents';
import { ColorPicker } from '@/components/atoms';
import api from '@/lib/api';
import { useConfirm } from '@/contexts/ConfirmContext';
import { COMMON_FONTS } from '@/utils/fonts';

interface FooterDesignerProps {
    config: ThemeConfig;
    onChange: (config: ThemeConfig) => void;
    storeId: string;
}

// Element info
const elementInfo: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
    'menu': { label: 'Menu', icon: <MenuIcon fontSize="small" />, description: 'Footer menu links' },
    'text': { label: 'Text', icon: <TextIcon fontSize="small" />, description: 'Text content' },
    'html': { label: 'HTML', icon: <HtmlIcon fontSize="small" />, description: 'Custom HTML' },
    'newsletter': { label: 'Newsletter', icon: <NewsletterIcon fontSize="small" />, description: 'Newsletter signup' },
    'social': { label: 'Social', icon: <SocialIcon fontSize="small" />, description: 'Social media links' },
    'contact': { label: 'Contact', icon: <ContactIcon fontSize="small" />, description: 'Contact information' },
    'payment-methods': { label: 'Payment', icon: <PaymentIcon fontSize="small" />, description: 'Payment method icons' },
};

const defaultRowSettings: Required<FooterRowSettings> = {
    position: 'left',
    headingFontFamily: '',
    headingFontSize: 16,
    headingAlign: 'left',
    headingColor: '',
    columnGap: 16,
    rowPadding: 24,
    showBorder: false,
    borderColor: '#e2e8f0',
    showPadding: true,
};

const getRowSettings = (row: FooterRow): Required<FooterRowSettings> => ({
    ...defaultRowSettings,
    ...(row.settings || {}),
});

// Utility function to get contrasting colors based on background
function getContrastColor(hexColor: string): { text: string; textLight: string; overlay: string; border: string } {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate relative luminance using WCAG formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // If background is light, use dark colors; if dark, use light colors
    if (luminance > 0.5) {
        // Light background
        return {
            text: '#000000',
            textLight: 'rgba(0, 0, 0, 0.6)',
            overlay: 'rgba(255, 255, 255, 0.8)',
            border: 'rgba(0, 0, 0, 0.2)',
        };
    } else {
        // Dark background
        return {
            text: '#ffffff',
            textLight: 'rgba(255, 255, 255, 0.7)',
            overlay: 'rgba(0, 0, 0, 0.6)',
            border: 'rgba(255, 255, 255, 0.2)',
        };
    }
}

// Element Preview
function ElementPreview({ element, onClick, onDelete, menus }: { element: FooterElement; onClick: () => void; onDelete: () => void; menus: MenuType[] }) {
    const renderElement = () => {
        switch (element.type) {
            case 'menu':
                const selectedMenu = Array.isArray(menus) ? menus.find(m => m._id === element.menuId) : null;
                const menuItems = selectedMenu?.items || [];
                const hasMenu = !!selectedMenu;
                return (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            {selectedMenu?.name || 'Select a menu'}
                        </Typography>
                        {hasMenu && menuItems.length > 0 ? (
                            menuItems.slice(0, 5).map((item: any, i) => (
                                <Typography key={i} variant="body2" sx={{ py: 0.25, opacity: 0.8 }}>
                                    {item.label}
                                </Typography>
                            ))
                        ) : (
                            <Typography variant="caption" sx={{ opacity: 0.5, fontStyle: 'italic' }}>
                                {hasMenu ? 'Menu has no items' : 'No menu selected'}
                            </Typography>
                        )}
                    </Box>
                );
            case 'text':
                return (
                    <Typography variant="body2" sx={{ opacity: 0.8 }} dangerouslySetInnerHTML={{ __html: element.content || 'Your text content here...' }} />
                );
            case 'html':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.7 }}>
                        <HtmlIcon fontSize="small" />
                        <Typography variant="caption">Custom HTML</Typography>
                    </Box>
                );
            case 'newsletter':
                return (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            {element.settings?.newsletterTitle || 'Subscribe'}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.7 }}>
                            {element.settings?.newsletterDescription || 'Get updates'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Box sx={{ flex: 1, p: 0.5, border: '1px solid', borderColor: 'rgba(255,255,255,0.3)', borderRadius: 0.5, fontSize: 12, opacity: 0.6 }}>
                                {element.settings?.newsletterPlaceholder || 'Email'}
                            </Box>
                            <Box sx={{ px: 1, py: 0.5, bgcolor: 'primary.main', borderRadius: 0.5, fontSize: 12 }}>
                                {element.settings?.newsletterButtonText || 'Subscribe'}
                            </Box>
                        </Box>
                    </Box>
                );
            case 'social':
                const socialIcons: Record<string, React.ReactNode> = {
                    facebook: <FacebookIcon fontSize="small" />,
                    twitter: <TwitterIcon fontSize="small" />,
                    instagram: <InstagramIcon fontSize="small" />,
                    linkedin: <LinkedInIcon fontSize="small" />,
                    youtube: <YouTubeIcon fontSize="small" />,
                };
                const links = element.settings?.socialLinks || [];
                return (
                    <Box>
                        {element.settings?.socialTitle && <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{element.settings?.socialTitle}</Typography>}
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {links.length > 0 ? (
                                links.map((link) => (
                                    <Box key={link.id} sx={{ opacity: 0.8 }}>{socialIcons[link.platform] || <SocialIcon fontSize="small" />}</Box>
                                ))
                            ) : (
                                <>
                                    <Box sx={{ opacity: 0.8 }}><FacebookIcon fontSize="small" /></Box>
                                    <Box sx={{ opacity: 0.8 }}><TwitterIcon fontSize="small" /></Box>
                                    <Box sx={{ opacity: 0.8 }}><InstagramIcon fontSize="small" /></Box>
                                </>
                            )}
                        </Box>
                    </Box>
                );
            case 'contact':
                const contactInfo = element.settings?.contactInfo;
                return (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Contact Us</Typography>
                        {contactInfo?.address && (
                            <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.25 }}>
                                {contactInfo.address}
                            </Typography>
                        )}
                        {contactInfo?.phone && (
                            <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.25 }}>
                                {contactInfo.phone}
                            </Typography>
                        )}
                        {contactInfo?.email && (
                            <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.25 }}>
                                {contactInfo.email}
                            </Typography>
                        )}
                        {contactInfo?.workingHours && (
                            <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5, fontSize: 11 }}>
                                {contactInfo.workingHours}
                            </Typography>
                        )}
                        {!contactInfo?.address && !contactInfo?.phone && !contactInfo?.email && (
                            <Typography variant="caption" sx={{ opacity: 0.5, fontStyle: 'italic' }}>
                                No contact info configured
                            </Typography>
                        )}
                    </Box>
                );
            case 'payment-methods':
                const paymentMethods = element.settings?.paymentMethods || [];
                const defaultMethods = ['Visa', 'MC', 'Amex'];
                const methodsToShow = paymentMethods.length > 0
                    ? paymentMethods.map(m => m.name).filter(Boolean)
                    : defaultMethods;
                const paymentTitle = element.settings?.paymentMethodsTitle;
                return (
                    <Box>
                        {paymentTitle ? (
                            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{paymentTitle}</Typography>
                        ) : null}
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {methodsToShow.length > 0 ? (
                                methodsToShow.map((m, i) => (
                                    <Box key={i} sx={{ px: 0.5, py: 0.25, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 0.5, fontSize: 10 }}>
                                        {m}
                                    </Box>
                                ))
                            ) : (
                                <Typography variant="caption" sx={{ opacity: 0.5, fontStyle: 'italic' }}>
                                    No payment methods configured
                                </Typography>
                            )}
                        </Box>
                    </Box>
                );
            default:
                return <Typography variant="body2">{element.type}</Typography>;
        }
    };

    return (
        <Box
            sx={{
                position: 'relative',
                cursor: 'pointer',
                p: 1,
                borderRadius: 1,
                border: '1px solid transparent',
                '&:hover': {
                    border: '1px dashed rgba(255,255,255,0.5)',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '& .element-actions': { opacity: 1 },
                },
            }}
            onClick={onClick}
        >
            {renderElement()}
            <Box
                className="element-actions"
                sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    gap: 0.25,
                }}
            >
                <IconButton size="small" sx={{ bgcolor: 'primary.main', color: 'white', width: 24, height: 24, '&:hover': { bgcolor: 'primary.dark' } }} onClick={(e) => { e.stopPropagation(); onClick(); }}>
                    <SettingsIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton size="small" sx={{ bgcolor: 'error.main', color: 'white', width: 24, height: 24, '&:hover': { bgcolor: 'error.dark' } }} onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                    <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
            </Box>
        </Box>
    );
}

export default function FooterDesigner({ config, onChange, storeId }: FooterDesignerProps) {
    const [editingElement, setEditingElement] = useState<{ rowId: string; columnId: string; element: FooterElement } | null>(null);
    const [editingRowSettings, setEditingRowSettings] = useState<{ rowId: string; settings: Required<FooterRowSettings> } | null>(null);
    const [editingColumnSettings, setEditingColumnSettings] = useState<{
        rowId: string;
        columnId: string;
        settings: {
            desktop: 'left' | 'center' | 'right';
            tablet: 'left' | 'center' | 'right';
            mobile: 'left' | 'center' | 'right';
        };
    } | null>(null);
    const [settingsExpanded, setSettingsExpanded] = useState(true);
    const [addMenuAnchor, setAddMenuAnchor] = useState<{ anchor: HTMLElement; rowId: string; columnId: string } | null>(null);
    const { confirm } = useConfirm();
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find which column contains the active item
        let sourceRowId = '';
        let sourceColId = '';
        let activeItemIndex = -1;

        // Check if we are dragging a column or an item
        // For simplicity, let's assume we are mostly dragging items for now, or distinguish by ID format
        // But better to search for ID in the structure.

        // Search for item
        for (const row of rows) {
            for (const col of row.columns) {
                const index = col.items.findIndex(i => i.id === activeId);
                if (index !== -1) {
                    sourceRowId = row.id;
                    sourceColId = col.id;
                    activeItemIndex = index;
                    break;
                }
            }
            if (activeItemIndex !== -1) break;
        }

        // If item found
        if (activeItemIndex !== -1) {
            // Find target column
            let targetRowId = '';
            let targetColId = '';
            let overItemIndex = -1;

            for (const row of rows) {
                for (const col of row.columns) {
                    const index = col.items.findIndex(i => i.id === overId);
                    if (index !== -1) {
                        targetRowId = row.id;
                        targetColId = col.id;
                        overItemIndex = index;
                        break;
                    }
                    if (col.id === overId) {
                        // Dropped directly on a column
                        targetRowId = row.id;
                        targetColId = col.id;
                        overItemIndex = col.items.length; // Append
                        break;
                    }
                }
                if (targetRowId) break;
            }

            if (sourceRowId && targetRowId) {
                // Same column reorder
                if (sourceColId === targetColId) {
                    if (activeId !== overId) {
                        const updatedRows = rows.map(r => r.id === sourceRowId
                            ? {
                                ...r,
                                columns: r.columns.map(c => c.id === sourceColId
                                    ? { ...c, items: arrayMove(c.items, activeItemIndex, overItemIndex) }
                                    : c
                                )
                            }
                            : r
                        );
                        updateFooter({ rows: updatedRows });
                    }
                } else {
                    // Move between columns
                    const sourceRow = rows.find(r => r.id === sourceRowId)!;
                    const sourceCol = sourceRow.columns.find(c => c.id === sourceColId)!;
                    const targetRow = rows.find(r => r.id === targetRowId)!;
                    const targetCol = targetRow.columns.find(c => c.id === targetColId)!;

                    const itemToMove = sourceCol.items[activeItemIndex];

                    const updatedRows = rows.map(r => {
                        if (r.id === sourceRowId) {
                            return {
                                ...r,
                                columns: r.columns.map(c => {
                                    if (c.id === sourceColId) {
                                        return { ...c, items: c.items.filter(i => i.id !== activeId) };
                                    }
                                    return c;
                                })
                            };
                        }
                        return r;
                    });

                    // Now add to target
                    const finalRows = updatedRows.map(r => {
                        if (r.id === targetRowId) {
                            return {
                                ...r,
                                columns: r.columns.map(c => {
                                    if (c.id === targetColId) {
                                        const newItems = [...c.items];
                                        // If overItemIndex is valid (dropped on item), insert there. 
                                        // If dropped on column (overItemIndex = length), append.
                                        // Note: arrayMove logic is only for same array.
                                        // Here we insert manually.
                                        if (overItemIndex >= 0) {
                                            newItems.splice(overItemIndex, 0, itemToMove);
                                        } else {
                                            newItems.push(itemToMove);
                                        }
                                        return { ...c, items: newItems };
                                    }
                                    return c;
                                })
                            };
                        }
                        return r;
                    });

                    updateFooter({ rows: finalRows });
                }
            }
        }
    };
    const [menus, setMenus] = useState<MenuType[]>([]);

    // Fetch menus
    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const response = await api.get(`/menus?store=${storeId}`);
                setMenus(response.data.menus || response.data || []);
            } catch (error) {
                console.error('Failed to fetch menus:', error);
            }
        };
        fetchMenus();
    }, [storeId]);

    const footerConfig = config.footer || { sections: [] };

    // Get rows from config or create default
    const getRows = (): FooterRow[] => {
        const columnsSection = footerConfig.sections.find(s => s.type === 'columns');
        if (columnsSection?.rows) {
            return columnsSection.rows as FooterRow[];
        }
        // Legacy: convert old columns to single row
        if (columnsSection?.columns) {
            return [{ id: 'row-1', columns: columnsSection.columns }];
        }
        return [];
    };

    const rows = getRows();

    const handleUpdateRowSettings = (rowId: string, updates: Partial<FooterRowSettings>) => {
        updateFooter({
            rows: rows.map((row) => (
                row.id === rowId
                    ? { ...row, settings: { ...getRowSettings(row), ...updates } }
                    : row
            )),
        });
    };

    const bottomBarSection = footerConfig.sections.find(s => s.type === 'bottom-bar') || {
        id: 'bottom-bar',
        type: 'bottom-bar' as const,
        backgroundColor: '#000000',
        textColor: '#888888',
        bottomBarContent: '© 2024 Your Store. All rights reserved.',
    };

    const columnsSection = footerConfig.sections.find(s => s.type === 'columns') || {
        id: 'columns',
        type: 'columns' as const,
        backgroundColor: config.colors?.secondary || '#2a2a2a',
        textColor: config.colors?.background || '#ffffff',
    };

    // Update footer
    const updateFooter = (updates: { rows?: FooterRow[]; columnsSection?: any; bottomBar?: any }) => {
        let updatedSections = [...footerConfig.sections];

        if (updates.rows !== undefined) {
            const idx = updatedSections.findIndex(s => s.type === 'columns');
            const newColumnsSection = {
                ...columnsSection,
                rows: updates.rows,
                columns: undefined, // Remove legacy columns
            };
            if (idx >= 0) {
                updatedSections[idx] = newColumnsSection;
            } else {
                updatedSections.push(newColumnsSection);
            }
        }

        if (updates.columnsSection) {
            const idx = updatedSections.findIndex(s => s.type === 'columns');
            if (idx >= 0) {
                updatedSections[idx] = { ...updatedSections[idx], ...updates.columnsSection };
            }
        }

        if (updates.bottomBar) {
            const idx = updatedSections.findIndex(s => s.type === 'bottom-bar');
            if (idx >= 0) {
                updatedSections[idx] = { ...updatedSections[idx], ...updates.bottomBar };
            } else {
                updatedSections.push({ ...bottomBarSection, ...updates.bottomBar });
            }
        }

        onChange({
            ...config,
            footer: { ...footerConfig, sections: updatedSections },
        });
    };

    // Add row
    const handleAddRow = () => {
        const newRow: FooterRow = {
            id: uuidv4(),
            columns: [{ id: uuidv4(), title: 'New Column', width: 12, items: [] }],
            settings: { ...defaultRowSettings },
        };
        updateFooter({ rows: [...rows, newRow] });
    };

    // Delete row
    const handleDeleteRow = async (rowId: string) => {
        if (!await confirm({ title: 'Delete Row', message: 'Delete this row?', severity: 'error' })) return;
        updateFooter({ rows: rows.filter(r => r.id !== rowId) });
    };

    // Add column to row
    const handleAddColumn = (rowId: string) => {
        const newColumn: FooterColumn = {
            id: uuidv4(),
            title: 'New Column',
            width: 3,
            items: [],
        };
        updateFooter({
            rows: rows.map(r => r.id === rowId ? { ...r, columns: [...r.columns, newColumn] } : r),
        });
    };

    // Delete column
    const handleDeleteColumn = (rowId: string, columnId: string) => {
        updateFooter({
            rows: rows.map(r => r.id === rowId
                ? { ...r, columns: r.columns.filter(c => c.id !== columnId) }
                : r
            ),
        });
    };

    // Update column
    const handleUpdateColumn = (rowId: string, columnId: string, updates: Partial<FooterColumn>) => {
        updateFooter({
            rows: rows.map(r => r.id === rowId
                ? { ...r, columns: r.columns.map(c => c.id === columnId ? { ...c, ...updates } : c) }
                : r
            ),
        });
    };

    const getColumnAlignSettings = (column: FooterColumn) => ({
        desktop: column.settings?.contentAlign?.desktop || 'left',
        tablet: column.settings?.contentAlign?.tablet || column.settings?.contentAlign?.desktop || 'left',
        mobile: column.settings?.contentAlign?.mobile || column.settings?.contentAlign?.tablet || column.settings?.contentAlign?.desktop || 'left',
    });

    // Add element
    const handleAddElement = (rowId: string, columnId: string, elementType: string) => {
        const newElement: FooterElement = { id: uuidv4(), type: elementType as any };
        updateFooter({
            rows: rows.map(r => r.id === rowId
                ? { ...r, columns: r.columns.map(c => c.id === columnId ? { ...c, items: [...c.items, newElement] } : c) }
                : r
            ),
        });
        setAddMenuAnchor(null);
        setEditingElement({ rowId, columnId, element: newElement });
    };

    // Delete element
    const handleDeleteElement = (rowId: string, columnId: string, elementId: string) => {
        updateFooter({
            rows: rows.map(r => r.id === rowId
                ? { ...r, columns: r.columns.map(c => c.id === columnId ? { ...c, items: c.items.filter(i => i.id !== elementId) } : c) }
                : r
            ),
        });
    };

    // Save element
    const handleSaveElement = (updatedElement: FooterElement) => {
        if (!editingElement) return;
        updateFooter({
            rows: rows.map(r => r.id === editingElement.rowId
                ? {
                    ...r,
                    columns: r.columns.map(c => c.id === editingElement.columnId
                        ? { ...c, items: c.items.map(i => i.id === updatedElement.id ? updatedElement : i) }
                        : c
                    ),
                }
                : r
            ),
        });
        setEditingElement(null);
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Box>
                {/* Live Preview */}
                <PreviewContainer
                    title="Footer Preview"
                    subtitle="Click elements to configure • Hover for actions"
                    actions={
                        <Button startIcon={<AddIcon />} onClick={handleAddRow} variant="outlined" size="small">
                            Add Row
                        </Button>
                    }
                >
                    <Box sx={{ width: '100%' }}>
                        {/* Footer Rows */}
                        <Box sx={{ bgcolor: columnsSection.backgroundColor || config.colors?.secondary || '#2a2a2a', color: columnsSection.textColor || config.colors?.background || '#ffffff' }}>
                            {rows.length === 0 ? (
                                <Box sx={{ p: 4, textAlign: 'center', border: '2px dashed rgba(255,255,255,0.2)', m: 2, borderRadius: 1 }}>
                                    <Typography sx={{ opacity: 0.5 }}>Click "Add Row" to get started</Typography>
                                </Box>
                            ) : (
                                rows.map((row, rowIndex) => (
                                    <Box key={row.id} sx={{ position: 'relative', borderBottom: rowIndex < rows.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                                        {/* Row Label */}
                                        {(() => {
                                            const contrast = getContrastColor(columnsSection.backgroundColor || '#2a2a2a');
                                            return (
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    left: 8,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    bgcolor: contrast.overlay,
                                                    backdropFilter: 'blur(8px)',
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: 1,
                                                    border: `1px solid ${contrast.border}`,
                                                }}>
                                                    <Typography variant="caption" sx={{ color: contrast.text, fontWeight: 500 }}>Row {rowIndex + 1}</Typography>
                                                    <Tooltip title="Add column">
                                                        <IconButton size="small" onClick={() => handleAddColumn(row.id)} sx={{ color: contrast.text, opacity: 0.8, width: 20, height: 20, '&:hover': { opacity: 1 } }}>
                                                            <AddIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Row settings">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setEditingRowSettings({ rowId: row.id, settings: getRowSettings(row) })}
                                                            sx={{ color: contrast.text, opacity: 0.8, width: 20, height: 20, '&:hover': { opacity: 1 } }}
                                                        >
                                                            <SettingsIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete row">
                                                        <IconButton size="small" onClick={() => handleDeleteRow(row.id)} sx={{ color: contrast.text, opacity: 0.7, width: 20, height: 20, '&:hover': { color: 'error.main', opacity: 1 } }}>
                                                            <DeleteIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            );
                                        })()}

                                        {/* Columns */}
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                p: 3,
                                                pt: 5,
                                                gap: 2,
                                                justifyContent: getRowSettings(row).position === 'center'
                                                    ? 'center'
                                                    : getRowSettings(row).position === 'right'
                                                        ? 'flex-end'
                                                        : 'flex-start',
                                            }}
                                        >
                                            {row.columns.map((column) => (
                                                <Box
                                                    key={column.id}
                                                    sx={{
                                                        width: `${(column.width / 12) * 100}%`,
                                                        minWidth: 120,
                                                        position: 'relative',
                                                        p: 1,
                                                        textAlign: getColumnAlignSettings(column).desktop,
                                                        borderRadius: 1,
                                                        border: '1px solid transparent',
                                                        '&:hover': {
                                                            border: '1px dashed rgba(255,255,255,0.3)',
                                                            '& .col-actions': { opacity: 1 },
                                                        },
                                                        'img': {
                                                            maxWidth: '100%',
                                                        }
                                                    }}
                                                >
                                                    {/* Column Header */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        <Tooltip title="Column position settings">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => setEditingColumnSettings({
                                                                    rowId: row.id,
                                                                    columnId: column.id,
                                                                    settings: getColumnAlignSettings(column),
                                                                })}
                                                                sx={{
                                                                    color: columnsSection.textColor || '#ffffff',
                                                                    opacity: 0.8,
                                                                    width: 22,
                                                                    height: 22,
                                                                    '&:hover': { opacity: 1 },
                                                                }}
                                                            >
                                                                <SettingsIcon sx={{ fontSize: 14 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <TextField
                                                            value={column.title || ''}
                                                            onChange={(e) => handleUpdateColumn(row.id, column.id, { title: e.target.value })}
                                                            placeholder="Title"
                                                            variant="standard"
                                                            size="small"
                                                            sx={{
                                                                flex: 1,
                                                                '& .MuiInputBase-input': {
                                                                    color: columnsSection.textColor || '#ffffff',
                                                                    fontWeight: 600,
                                                                    fontSize: getRowSettings(row).headingFontSize || 16,
                                                                    fontFamily: getRowSettings(row).headingFontFamily || 'inherit',
                                                                    textAlign: getColumnAlignSettings(column).desktop,
                                                                    // Ensure placeholder is visible too if needed, though usually automatic with opacity
                                                                },
                                                                '& .MuiInput-underline:before': { borderBottomColor: columnsSection.textColor || '#ffffff !important' },
                                                                '& .MuiInput-underline:after': { borderBottomColor: columnsSection.textColor || '#ffffff' },
                                                                '& .MuiInput-underline:hover:before': { borderBottomColor: columnsSection.textColor || '#ffffff !important' },
                                                            }}
                                                        />
                                                        <TextField
                                                            type="number"
                                                            value={column.width}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value);
                                                                if (val >= 1 && val <= 12) handleUpdateColumn(row.id, column.id, { width: val });
                                                            }}
                                                            size="small"
                                                            inputProps={{ min: 1, max: 12, style: { width: 30, padding: 4, textAlign: 'center', color: 'inherit' } }}
                                                            sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } } }}
                                                        />
                                                        <Typography variant="caption" sx={{ opacity: 0.5 }}>/12</Typography>
                                                    </Box>

                                                    {/* Column Elements */}
                                                    <SortableContext items={column.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                                        {column.items.map((item) => (
                                                            <SortableFooterElement key={item.id} id={item.id}>
                                                                <ElementPreview
                                                                    element={item}
                                                                    menus={menus}
                                                                    onClick={() => setEditingElement({ rowId: row.id, columnId: column.id, element: item })}
                                                                    onDelete={() => handleDeleteElement(row.id, column.id, item.id)}
                                                                />
                                                            </SortableFooterElement>
                                                        ))}
                                                    </SortableContext>

                                                    {/* Add Element Button */}
                                                    {(() => {
                                                        const contrast = getContrastColor(columnsSection.backgroundColor || '#2a2a2a');
                                                        return (
                                                            <Button
                                                                size="small"
                                                                startIcon={<AddIcon />}
                                                                onClick={(e) => setAddMenuAnchor({ anchor: e.currentTarget, rowId: row.id, columnId: column.id })}
                                                                sx={{
                                                                    mt: 1,
                                                                    width: '100%',
                                                                    color: contrast.text,
                                                                    bgcolor: contrast.overlay,
                                                                    border: `1px dashed ${contrast.border}`,
                                                                    backdropFilter: 'blur(4px)',
                                                                    '&:hover': {
                                                                        opacity: 0.8,
                                                                    }
                                                                }}
                                                            >
                                                                Add
                                                            </Button>
                                                        );
                                                    })()}

                                                    {/* Column Delete */}
                                                    <Box className="col-actions" sx={{
                                                        position: 'absolute',
                                                        top: -8,
                                                        right: -8,
                                                        opacity: 0,
                                                        transition: 'opacity 0.2s',
                                                        backdropFilter: 'blur(4px)',
                                                        borderRadius: '50%',
                                                        padding: '2px',
                                                    }}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteColumn(row.id, column.id)}
                                                            sx={{
                                                                bgcolor: 'error.main',
                                                                color: 'white',
                                                                width: 20,
                                                                height: 20,
                                                                '&:hover': { bgcolor: 'error.dark' }
                                                            }}
                                                        >
                                                            <DeleteIcon sx={{ fontSize: 12 }} />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                ))
                            )}
                        </Box>

                        {/* Bottom Bar */}
                        <Box sx={{ bgcolor: bottomBarSection.backgroundColor || '#000000', color: bottomBarSection.textColor || '#888888', p: 2, textAlign: 'center' }}>
                            <Typography variant="body2">{bottomBarSection.bottomBarContent || '© 2024 Your Store'}</Typography>
                        </Box>
                    </Box>
                </PreviewContainer>

                {/* Add Element Menu */}
                <Menu
                    anchorEl={addMenuAnchor?.anchor}
                    open={!!addMenuAnchor}
                    onClose={() => setAddMenuAnchor(null)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                >
                    {Object.entries(elementInfo).map(([type, info]) => (
                        <MuiMenuItem key={type} onClick={() => addMenuAnchor && handleAddElement(addMenuAnchor.rowId, addMenuAnchor.columnId, type)}>
                            <ListItemIcon>{info.icon}</ListItemIcon>
                            <ListItemText>{info.label}</ListItemText>
                        </MuiMenuItem>
                    ))}
                </Menu>

                {/* Settings Panel */}
                <Paper sx={{ mb: 3 }}>
                    <Box
                        sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', bgcolor: 'grey.50' }}
                        onClick={() => setSettingsExpanded(!settingsExpanded)}
                    >
                        <Typography variant="subtitle2">Footer Settings</Typography>
                        {settingsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                    <Collapse in={settingsExpanded}>
                        <Box sx={{ p: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>Main Footer</Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                                <Box sx={{ width: 250 }}>
                                    <ColorPicker
                                        label="Background"
                                        value={columnsSection.backgroundColor || config.colors?.secondary || '#2a2a2a'}
                                        onChange={(color) => updateFooter({ columnsSection: { backgroundColor: color } })}
                                        size="small"
                                    />
                                </Box>
                                <Box sx={{ width: 250 }}>
                                    <ColorPicker
                                        label="Text"
                                        value={columnsSection.textColor || config.colors?.background || '#ffffff'}
                                        onChange={(color) => updateFooter({ columnsSection: { textColor: color } })}
                                        size="small"
                                    />
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle2" gutterBottom>Bottom Bar</Typography>
                            <TextField
                                label="Copyright Text"
                                value={bottomBarSection.bottomBarContent || ''}
                                onChange={(e) => updateFooter({ bottomBar: { bottomBarContent: e.target.value } })}
                                fullWidth
                                size="small"
                                sx={{ mb: 2 }}
                            />
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Box sx={{ width: 250 }}>
                                    <ColorPicker
                                        label="Background"
                                        value={bottomBarSection.backgroundColor || '#000000'}
                                        onChange={(color) => updateFooter({ bottomBar: { backgroundColor: color } })}
                                        size="small"
                                    />
                                </Box>
                                <Box sx={{ width: 250 }}>
                                    <ColorPicker
                                        label="Text"
                                        value={bottomBarSection.textColor || '#888888'}
                                        onChange={(color) => updateFooter({ bottomBar: { textColor: color } })}
                                        size="small"
                                    />
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={bottomBarSection.showTopBorder ?? false}
                                            onChange={(e) => updateFooter({ bottomBar: { showTopBorder: e.target.checked } })}
                                        />
                                    }
                                    label="Show Top Border"
                                />

                                {(bottomBarSection.showTopBorder ?? false) && (
                                    <>
                                        <Box sx={{ width: 250 }}>
                                            <ColorPicker
                                                label="Border Color"
                                                value={bottomBarSection.borderColor || '#e2e8f0'}
                                                onChange={(color) => updateFooter({ bottomBar: { borderColor: color } })}
                                                size="small"
                                            />
                                        </Box>
                                        <TextField
                                            type="number"
                                            label="Border Padding (px)"
                                            value={bottomBarSection.borderPadding ?? 20}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10);
                                                updateFooter({ bottomBar: { borderPadding: Number.isNaN(val) ? 20 : Math.max(0, Math.min(150, val)) } });
                                            }}
                                            size="small"
                                            inputProps={{ min: 0, max: 150 }}
                                            sx={{ width: 180 }}
                                        />
                                    </>
                                )}
                            </Box>
                        </Box>
                    </Collapse>
                </Paper>

                {/* Row Settings Dialog */}
                <Dialog
                    open={!!editingRowSettings}
                    onClose={() => setEditingRowSettings(null)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Row Settings</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <TextField
                                select
                                fullWidth
                                label="Row Position"
                                value={editingRowSettings?.settings.position || 'left'}
                                onChange={(e) => setEditingRowSettings((prev) => prev ? {
                                    ...prev,
                                    settings: { ...prev.settings, position: e.target.value as 'left' | 'center' | 'right' }
                                } : null)}
                                helperText="Uses flex alignment for row content distribution."
                            >
                                <MuiMenuItem value="left">Left</MuiMenuItem>
                                <MuiMenuItem value="center">Center</MuiMenuItem>
                                <MuiMenuItem value="right">Right</MuiMenuItem>
                            </TextField>

                            <Typography variant="subtitle2" sx={{ mt: 1 }}>Heading Typography</Typography>

                            <TextField
                                select
                                fullWidth
                                label="Font Family"
                                value={editingRowSettings?.settings.headingFontFamily || ''}
                                onChange={(e) => setEditingRowSettings((prev) => prev ? {
                                    ...prev,
                                    settings: { ...prev.settings, headingFontFamily: e.target.value }
                                } : null)}
                            >
                                {COMMON_FONTS.map(font => (
                                    <MuiMenuItem key={font.value} value={font.value} style={{ fontFamily: font.value || 'inherit' }}>
                                        {font.label}
                                    </MuiMenuItem>
                                ))}
                            </TextField>

                            <TextField
                                type="number"
                                fullWidth
                                label="Heading Font Size (px)"
                                value={editingRowSettings?.settings.headingFontSize || 16}
                                onChange={(e) => {
                                    const nextValue = parseInt(e.target.value, 10);
                                    setEditingRowSettings((prev) => prev ? {
                                        ...prev,
                                        settings: {
                                            ...prev.settings,
                                            headingFontSize: Number.isNaN(nextValue) ? 16 : Math.max(10, Math.min(48, nextValue)),
                                        }
                                    } : null);
                                }}
                                inputProps={{ min: 10, max: 48 }}
                            />

                            <TextField
                                select
                                fullWidth
                                label="Heading Align"
                                value={editingRowSettings?.settings.headingAlign || 'left'}
                                onChange={(e) => setEditingRowSettings((prev) => prev ? {
                                    ...prev,
                                    settings: { ...prev.settings, headingAlign: e.target.value as 'left' | 'center' | 'right' }
                                } : null)}
                            >
                                <MuiMenuItem value="left">Left</MuiMenuItem>
                                <MuiMenuItem value="center">Center</MuiMenuItem>
                                <MuiMenuItem value="right">Right</MuiMenuItem>
                            </TextField>

                            <Box sx={{ mt: 1 }}>
                                <ColorPicker
                                    label="Heading Color"
                                    value={editingRowSettings?.settings.headingColor || ''}
                                    onChange={(color) => setEditingRowSettings((prev) => prev ? {
                                        ...prev,
                                        settings: { ...prev.settings, headingColor: color }
                                    } : null)}
                                    size="small"
                                />
                            </Box>

                            <Typography variant="subtitle2" sx={{ mt: 2 }}>Column Settings</Typography>

                            <TextField
                                type="number"
                                fullWidth
                                label="Column Gap (px)"
                                value={editingRowSettings?.settings.columnGap ?? 16}
                                onChange={(e) => {
                                    const nextValue = parseInt(e.target.value, 10);
                                    setEditingRowSettings((prev) => prev ? {
                                        ...prev,
                                        settings: {
                                            ...prev.settings,
                                            columnGap: Number.isNaN(nextValue) ? 16 : Math.max(0, Math.min(100, nextValue)),
                                        }
                                    } : null);
                                }}
                                inputProps={{ min: 0, max: 100 }}
                                helperText="Space between columns in pixels"
                            />

                            <Typography variant="subtitle2" sx={{ mt: 2 }}>Row Layout & Styling</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'row', gap: 2 }}>
                                <TextField
                                    type="number"
                                    
                                    label="Vertical Padding Top (px)"
                                    value={editingRowSettings?.settings.rowPaddingTop ?? 24}
                                    onChange={(e) => {
                                        const nextValue = parseInt(e.target.value, 10);
                                        setEditingRowSettings((prev) => prev ? {
                                            ...prev,
                                            settings: {
                                                ...prev.settings,
                                                rowPaddingTop: Number.isNaN(nextValue) ? 24 : Math.max(0, Math.min(150, nextValue)),
                                            }
                                        } : null);
                                    }}
                                    inputProps={{ min: 0, max: 150 }}
                                    helperText="Vertical padding top inside the row"
                                />

                                <TextField
                                    type="number"
                                    
                                    label="Vertical Padding Bottom (px)"
                                    value={editingRowSettings?.settings.rowPaddingBottom ?? 24}
                                    onChange={(e) => {
                                        const nextValue = parseInt(e.target.value, 10);
                                        setEditingRowSettings((prev) => prev ? {
                                            ...prev,
                                            settings: {
                                                ...prev.settings,
                                                rowPaddingBottom: Number.isNaN(nextValue) ? 24 : Math.max(0, Math.min(150, nextValue)),
                                            }
                                        } : null);
                                    }}
                                    inputProps={{ min: 0, max: 150 }}
                                    helperText="Vertical padding bottom inside the row"
                                />
                            </Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={editingRowSettings?.settings.showPadding ?? true}
                                        onChange={(e) => setEditingRowSettings((prev) => prev ? {
                                            ...prev,
                                            settings: { ...prev.settings, showPadding: e.target.checked }
                                        } : null)}
                                    />
                                }
                                label="Enable Row Padding"
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={editingRowSettings?.settings.showBorder ?? false}
                                        onChange={(e) => setEditingRowSettings((prev) => prev ? {
                                            ...prev,
                                            settings: { ...prev.settings, showBorder: e.target.checked }
                                        } : null)}
                                    />
                                }
                                label="Show Row Border"
                            />

                            {(editingRowSettings?.settings.showBorder ?? false) && (
                                <Box sx={{ mt: 1 }}>
                                    <ColorPicker
                                        label="Border Color"
                                        value={editingRowSettings?.settings.borderColor || '#e2e8f0'}
                                        onChange={(color) => setEditingRowSettings((prev) => prev ? {
                                            ...prev,
                                            settings: { ...prev.settings, borderColor: color }
                                        } : null)}
                                        size="small"
                                    />
                                </Box>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditingRowSettings(null)}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                if (!editingRowSettings) return;
                                handleUpdateRowSettings(editingRowSettings.rowId, editingRowSettings.settings);
                                setEditingRowSettings(null);
                            }}
                        >
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Column Settings Dialog */}
                <Dialog
                    open={!!editingColumnSettings}
                    onClose={() => setEditingColumnSettings(null)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Column Position Settings</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Configure content position per breakpoint for this column.
                            </Typography>

                            <TextField
                                select
                                fullWidth
                                label="Desktop Position"
                                value={editingColumnSettings?.settings.desktop || 'left'}
                                onChange={(e) => setEditingColumnSettings((prev) => prev ? {
                                    ...prev,
                                    settings: { ...prev.settings, desktop: e.target.value as 'left' | 'center' | 'right' }
                                } : null)}
                            >
                                <MuiMenuItem value="left">Left</MuiMenuItem>
                                <MuiMenuItem value="center">Center</MuiMenuItem>
                                <MuiMenuItem value="right">Right</MuiMenuItem>
                            </TextField>

                            <TextField
                                select
                                fullWidth
                                label="Tablet Position"
                                value={editingColumnSettings?.settings.tablet || 'left'}
                                onChange={(e) => setEditingColumnSettings((prev) => prev ? {
                                    ...prev,
                                    settings: { ...prev.settings, tablet: e.target.value as 'left' | 'center' | 'right' }
                                } : null)}
                            >
                                <MuiMenuItem value="left">Left</MuiMenuItem>
                                <MuiMenuItem value="center">Center</MuiMenuItem>
                                <MuiMenuItem value="right">Right</MuiMenuItem>
                            </TextField>

                            <TextField
                                select
                                fullWidth
                                label="Mobile Position"
                                value={editingColumnSettings?.settings.mobile || 'left'}
                                onChange={(e) => setEditingColumnSettings((prev) => prev ? {
                                    ...prev,
                                    settings: { ...prev.settings, mobile: e.target.value as 'left' | 'center' | 'right' }
                                } : null)}
                            >
                                <MuiMenuItem value="left">Left</MuiMenuItem>
                                <MuiMenuItem value="center">Center</MuiMenuItem>
                                <MuiMenuItem value="right">Right</MuiMenuItem>
                            </TextField>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditingColumnSettings(null)}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                if (!editingColumnSettings) return;
                                const { rowId, columnId, settings } = editingColumnSettings;
                                const row = rows.find((r) => r.id === rowId);
                                const currentColumn = row?.columns.find((c) => c.id === columnId);
                                if (!currentColumn) return;
                                handleUpdateColumn(rowId, columnId, {
                                    settings: {
                                        ...currentColumn.settings,
                                        contentAlign: {
                                            desktop: settings.desktop,
                                            tablet: settings.tablet,
                                            mobile: settings.mobile,
                                        },
                                    },
                                });
                                setEditingColumnSettings(null);
                            }}
                        >
                            Save
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Element Config Dialog */}
                <FooterElementConfig
                    open={!!editingElement}
                    element={editingElement?.element || null}
                    onClose={() => setEditingElement(null)}
                    onSave={handleSaveElement}
                    storeId={storeId}
                    menus={menus}
                />
            </Box>
        </DndContext>
    );
}
