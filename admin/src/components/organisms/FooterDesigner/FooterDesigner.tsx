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
import { ThemeConfig, FooterElement, FooterColumn, Menu as MenuType } from '@/types';
import FooterElementConfig from './FooterElementConfig';
import PreviewContainer from '@/components/molecules/PreviewContainer';
import { SortableFooterElement, SortableFooterColumn } from './SortableComponents';
import api from '@/lib/api';

interface FooterDesignerProps {
    config: ThemeConfig;
    onChange: (config: ThemeConfig) => void;
    storeId: string;
}

// Footer Row interface
interface FooterRow {
    id: string;
    columns: FooterColumn[];
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
                console.log('menus', menus);;
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
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {element.content || 'Your text content here...'}
                    </Typography>
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
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Follow Us</Typography>
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
                return (
                    <Box>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>We Accept</Typography>
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
    const [settingsExpanded, setSettingsExpanded] = useState(true);
    const [addMenuAnchor, setAddMenuAnchor] = useState<{ anchor: HTMLElement; rowId: string; columnId: string } | null>(null);
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
        };
        updateFooter({ rows: [...rows, newRow] });
    };

    // Delete row
    const handleDeleteRow = (rowId: string) => {
        if (!confirm('Delete this row?')) return;
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
                                                    <Tooltip title="Delete row">
                                                        <IconButton size="small" onClick={() => handleDeleteRow(row.id)} sx={{ color: contrast.text, opacity: 0.7, width: 20, height: 20, '&:hover': { color: 'error.main', opacity: 1 } }}>
                                                            <DeleteIcon sx={{ fontSize: 14 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            );
                                        })()}

                                        {/* Columns */}
                                        <Box sx={{ display: 'flex', p: 3, pt: 5, gap: 2 }}>
                                            {row.columns.map((column) => (
                                                <Box
                                                    key={column.id}
                                                    sx={{
                                                        width: `${(column.width / 12) * 100}%`,
                                                        minWidth: 120,
                                                        position: 'relative',
                                                        p: 1,
                                                        borderRadius: 1,
                                                        border: '1px solid transparent',
                                                        '&:hover': {
                                                            border: '1px dashed rgba(255,255,255,0.3)',
                                                            '& .col-actions': { opacity: 1 },
                                                        },
                                                    }}
                                                >
                                                    {/* Column Header */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        <TextField
                                                            value={column.title || ''}
                                                            onChange={(e) => handleUpdateColumn(row.id, column.id, { title: e.target.value })}
                                                            placeholder="Title"
                                                            variant="standard"
                                                            size="small"
                                                            sx={{
                                                                flex: 1,
                                                                '& input': { color: 'inherit', fontWeight: 600, fontSize: 14 },
                                                                '& .MuiInput-underline:before': { borderColor: 'rgba(255,255,255,0.2)' },
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
                                <TextField
                                    label="Background"
                                    type="color"
                                    value={columnsSection.backgroundColor || config.colors?.secondary || '#2a2a2a'}
                                    onChange={(e) => updateFooter({ columnsSection: { backgroundColor: e.target.value } })}
                                    size="small"
                                    sx={{ width: 110 }}
                                />
                                <TextField
                                    label="Text"
                                    type="color"
                                    value={columnsSection.textColor || config.colors?.background || '#ffffff'}
                                    onChange={(e) => updateFooter({ columnsSection: { textColor: e.target.value } })}
                                    size="small"
                                    sx={{ width: 110 }}
                                />
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
                                <TextField
                                    label="Background"
                                    type="color"
                                    value={bottomBarSection.backgroundColor || '#000000'}
                                    onChange={(e) => updateFooter({ bottomBar: { backgroundColor: e.target.value } })}
                                    size="small"
                                    sx={{ width: 110 }}
                                />
                                <TextField
                                    label="Text"
                                    type="color"
                                    value={bottomBarSection.textColor || '#888888'}
                                    onChange={(e) => updateFooter({ bottomBar: { textColor: e.target.value } })}
                                    size="small"
                                    sx={{ width: 110 }}
                                />
                            </Box>
                        </Box>
                    </Collapse>
                </Paper>

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
