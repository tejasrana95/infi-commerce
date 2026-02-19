'use client';

import { useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    TextField,
    Collapse,
    Chip,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Switch,
    MenuItem as MuiMenuItem,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CategoryIcon from '@mui/icons-material/Category';
import StarIcon from '@mui/icons-material/Star';
import LinkIcon from '@mui/icons-material/Link';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import GridOnIcon from '@mui/icons-material/GridOn';
import {
    DndContext,
    closestCenter,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';
import CategoryAutocomplete from '@/components/molecules/CategoryAutocomplete';
import PageAutocomplete from '@/components/molecules/PageAutocomplete';
import ProductAutoComplete, { ProductOption } from '@/components/molecules/ProductAutoComplete';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import { FileItem } from '@/types/file';
import { useConfirm } from '@/contexts/ConfirmContext';

// ============ TYPES ============


export type SectionType = 'full-width' | 'container' | 'split-2' | 'split-3' | 'split-4' | 'custom';

export interface MegaMenuColumn {
    id: string;
    width: number; // Grid units (out of 12)
    items: MegaMenuItem[];
}

export interface MegaMenuItem {
    id: string;
    type: 'category' | 'product' | 'image' | 'custom-link' | 'page' | 'divider';
    label?: string;

    // Category config
    categoryId?: string;
    categoryName?: string;
    categorySlug?: string; // Store slug for proper URL generation
    productLimit?: number;
    autoAddProducts?: boolean;
    showProductImage?: boolean;
    showProductPrice?: boolean;
    showProductRating?: boolean;
    showViewAll?: boolean;
    categoryDisplayMode?: 'list' | 'grid' | 'compact'; // How to display products
    categoryColumns?: number; // Number of columns for grid/compact display
    productImageSize?: 'small' | 'medium' | 'large';
    imagePosition?: 'left' | 'top'; // Image position relative to product details

    // Product config
    products?: Array<{ _id: string; name: string; slug?: string }>; // Include slug for URLs

    // Image config
    imageUrl?: string;
    imageLink?: string;
    imageAlt?: string;

    // Custom link config
    linkLabel?: string;
    linkTitle?: string;
    linkUrl?: string;
    linkOpenInNewTab?: boolean;

    // Page config
    pageId?: string;
    pageName?: string;
    pageSlug?: string; // Store slug for proper URL generation
}

export interface MegaMenuSection {
    id: string;
    type: SectionType;
    columns: MegaMenuColumn[];
    settings: {
        backgroundColor?: string;
        padding?: number;
    };
}

export interface MegaMenuData {
    sections: MegaMenuSection[];
    maxHeight?: number; // Max height in px for the whole mega menu dropdown
}

interface MegaMenuBuilderProps {
    data: MegaMenuData;
    onChange: (data: MegaMenuData) => void;
    storeId: string;
}

// ============ PALETTE ITEMS ============

const paletteItems = [
    { type: 'category', label: 'Category', icon: <CategoryIcon fontSize="small" />, description: 'Auto-list products' },
    { type: 'product', label: 'Products', icon: <StarIcon fontSize="small" />, description: 'Manual product selector' },
    { type: 'image', label: 'Image', icon: <ImageIcon fontSize="small" />, description: 'Image with link' },
    { type: 'custom-link', label: 'Custom Link', icon: <LinkIcon fontSize="small" />, description: 'Custom link item' },
    { type: 'page', label: 'Page', icon: <DescriptionIcon fontSize="small" />, description: 'Link to page' },
    { type: 'divider', label: 'Divider', icon: <ViewColumnIcon fontSize="small" />, description: 'Visual separator' },
];

// ============ DRAGGABLE PALETTE ITEM ============

interface DraggablePaletteItemProps {
    type: string;
    label: string;
    icon: React.ReactNode;
    description: string;
}

function DraggablePaletteItem({ type, label, icon, description }: DraggablePaletteItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useSortable({
        id: `palette-${type}`,
        data: { type: 'palette-item', itemType: type },
    });

    return (
        <Paper
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            variant="outlined"
            sx={{
                p: 1.5,
                mb: 1,
                cursor: 'grab',
                opacity: isDragging ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
                '&:active': { cursor: 'grabbing' },
            }}
        >
            <Box sx={{ color: 'primary.main' }}>{icon}</Box>
            <Box>
                <Typography variant="body2" fontWeight={500}>{label}</Typography>
                <Typography variant="caption" color="text.secondary">{description}</Typography>
            </Box>
        </Paper>
    );
}

// ============ ITEM CONFIG DIALOG ============

interface ItemConfigDialogProps {
    open: boolean;
    item: MegaMenuItem | null;
    onClose: () => void;
    onSave: (item: MegaMenuItem) => void;
    onDelete: (itemId: string) => void;
    storeId: string;
}

const getInitialMegaItem = (item: MegaMenuItem | null): MegaMenuItem => {
    if (!item) {
        return {
            id: uuidv4(),
            type: 'custom-link',
        };
    }

    return {
        ...item,
        categoryDisplayMode: item.categoryDisplayMode || 'list',
        categoryColumns: item.categoryColumns || 2,
        showProductImage: item.showProductImage ?? true,
        showProductPrice: item.showProductPrice ?? true,
        showProductRating: item.showProductRating ?? false,
        productImageSize: item.productImageSize || 'small',
        imagePosition: item.imagePosition || 'left',
        autoAddProducts: item.autoAddProducts ?? true,
        showViewAll: item.showViewAll ?? false,
        productLimit: item.productLimit || 10,
    };
};

function ItemConfigDialog({ open, item, onClose, onSave, onDelete, storeId }: ItemConfigDialogProps) {
    const [formData, setFormData] = useState<MegaMenuItem>(() => getInitialMegaItem(item));
    const [selectedProducts, setSelectedProducts] = useState<ProductOption[]>([]);

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    const handleFileSelect = (files: FileItem[]) => {
        if (files.length > 0) {
            setFormData(prev => ({ ...prev, imageUrl: files[0].url }));
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                },
            }}
        >
            <DialogTitle sx={(theme) => ({ py: 1, px: 2.25, bgcolor: alpha(theme.palette.primary.main, 0.06) })}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={800}>
                            Configure {item?.type || 'Item'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Fine-tune content, layout and display behavior.
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose}>
                        <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ px: 2, py: 1.25 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 0.75 }}>
                    {/* Category Config */}
                    {formData.type === 'category' && (
                        <>
                            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                                    Configure Category
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                    <TextField
                                        size="small"
                                        label="Block Label"
                                        value={formData.label || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                                        fullWidth
                                        placeholder="Optional"
                                        sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}
                                    />
                                    <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
                                        <CategoryAutocomplete
                                            value={formData.categoryId || null}
                                            onChange={(value, category) => {
                                                const cat = Array.isArray(category) ? category[0] : category;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    categoryId: value || undefined,
                                                    categoryName: cat?.title || undefined,
                                                    categorySlug: cat?.slug || undefined
                                                }));
                                            }}
                                            storeId={storeId}
                                            label="Select Category"
                                        />
                                    </Box>
                                    <FormControl fullWidth>
                                        <InputLabel>Display Mode</InputLabel>
                                        <Select
                                            size="small"
                                            value={formData.categoryDisplayMode || 'list'}
                                            onChange={(e) => setFormData(prev => ({ ...prev, categoryDisplayMode: e.target.value as MegaMenuItem['categoryDisplayMode'] }))}
                                            label="Display Mode"
                                        >
                                            <MuiMenuItem value="list">List</MuiMenuItem>
                                            <MuiMenuItem value="grid">Grid</MuiMenuItem>
                                            <MuiMenuItem value="compact">Compact</MuiMenuItem>
                                        </Select>
                                    </FormControl>

                                    {(formData.categoryDisplayMode === 'grid' || formData.categoryDisplayMode === 'compact') ? (
                                        <TextField
                                            size="small"
                                            label="Grid Columns"
                                            type="number"
                                            value={formData.categoryColumns || 2}
                                            onChange={(e) => setFormData(prev => ({ ...prev, categoryColumns: Number(e.target.value) }))}
                                            inputProps={{ min: 1, max: 6 }}
                                            fullWidth
                                        />
                                    ) : (
                                        <TextField
                                            size="small"
                                            label="Grid Columns"
                                            disabled
                                            value="-"
                                            fullWidth
                                        />
                                    )}
                                    <TextField
                                        size="small"
                                        label="Products to Show"
                                        type="number"
                                        value={formData.productLimit || 10}
                                        onChange={(e) => setFormData(prev => ({ ...prev, productLimit: Number(e.target.value) }))}
                                        inputProps={{ min: 1, max: 50 }}
                                        fullWidth
                                    />
                                    <FormControlLabel
                                        sx={{ m: 0 }}
                                        control={
                                            <Switch
                                                size="small"
                                                checked={formData.autoAddProducts ?? true}
                                                onChange={(e) => setFormData(prev => ({ ...prev, autoAddProducts: e.target.checked }))}
                                            />
                                        }
                                        label="Auto populate"
                                    />

                                    <FormControlLabel
                                        sx={{ m: 0 }}
                                        control={
                                            <Switch
                                                size="small"
                                                checked={formData.showProductImage ?? true}
                                                onChange={(e) => setFormData(prev => ({ ...prev, showProductImage: e.target.checked }))}
                                            />
                                        }
                                        label="Show product images"
                                    />
                                    <FormControlLabel
                                        sx={{ m: 0 }}
                                        control={
                                            <Switch
                                                size="small"
                                                checked={formData.showProductPrice ?? true}
                                                onChange={(e) => setFormData(prev => ({ ...prev, showProductPrice: e.target.checked }))}
                                            />
                                        }
                                        label="Show prices"
                                    />
                                    <FormControlLabel
                                        sx={{ m: 0 }}
                                        control={
                                            <Switch
                                                size="small"
                                                checked={formData.showProductRating ?? false}
                                                onChange={(e) => setFormData(prev => ({ ...prev, showProductRating: e.target.checked }))}
                                            />
                                        }
                                        label="Show ratings"
                                    />
                                    <FormControlLabel
                                        sx={{ m: 0 }}
                                        control={
                                            <Switch
                                                size="small"
                                                checked={formData.showViewAll ?? false}
                                                onChange={(e) => setFormData(prev => ({ ...prev, showViewAll: e.target.checked }))}
                                            />
                                        }
                                        label="Show View All action"
                                    />
                                    {formData.showProductImage && (
                                        <>
                                            <FormControl fullWidth>
                                                <InputLabel>Image Size</InputLabel>
                                                <Select
                                                    size="small"
                                                    value={formData.productImageSize || 'small'}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, productImageSize: e.target.value as MegaMenuItem['productImageSize'] }))}
                                                    label="Image Size"
                                                >
                                                    <MuiMenuItem value="small">Small (60px)</MuiMenuItem>
                                                    <MuiMenuItem value="medium">Medium (100px)</MuiMenuItem>
                                                    <MuiMenuItem value="large">Large (150px)</MuiMenuItem>
                                                </Select>
                                            </FormControl>
                                            <FormControl fullWidth>
                                                <InputLabel>Image Position</InputLabel>
                                                <Select
                                                    size="small"
                                                    value={formData.imagePosition || 'left'}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, imagePosition: e.target.value as MegaMenuItem['imagePosition'] }))}
                                                    label="Image Position"
                                                >
                                                    <MuiMenuItem value="left">Left (Horizontal)</MuiMenuItem>
                                                    <MuiMenuItem value="top">Top (Vertical)</MuiMenuItem>
                                                </Select>
                                            </FormControl>
                                        </>
                                    )}
                                </Box>
                            </Paper>
                        </>
                    )}

                    {/* Product Config */}
                    {formData.type === 'product' && (
                        <>
                            <TextField
                                label="Label"
                                value={formData.label || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                                fullWidth
                            />
                            <ProductAutoComplete
                                storeId={storeId}
                                value={selectedProducts}
                                onChange={(products) => {
                                    const productsArray = Array.isArray(products) ? products : products ? [products] : [];
                                    setSelectedProducts(productsArray);
                                    setFormData(prev => ({
                                        ...prev,
                                        products: productsArray.map(p => ({
                                            _id: p._id,
                                            name: p.name,
                                            slug: p.slug
                                        }))
                                    }));
                                }}
                                label="Select Products"
                                multiple
                            />
                        </>
                    )}

                    {/* Image Config */}
                    {formData.type === 'image' && (
                        <>
                            <Box>
                                <FileManagerButton
                                    onSelect={handleFileSelect}
                                    multiple={false}
                                    accept="image/*"
                                    label={formData.imageUrl ? 'Change Image' : 'Select Image'}
                                    variant="outlined"
                                    fullWidth
                                />
                                {formData.imageUrl && (
                                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }}
                                        />
                                    </Box>
                                )}
                            </Box>
                            <TextField
                                label="Image Alt Text"
                                value={formData.imageAlt || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, imageAlt: e.target.value }))}
                                fullWidth
                            />
                            <TextField
                                label="Link URL"
                                value={formData.imageLink || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, imageLink: e.target.value }))}
                                fullWidth
                                placeholder="https://example.com or /path"
                            />
                        </>
                    )}

                    {/* Custom Link Config */}
                    {formData.type === 'custom-link' && (
                        <>
                            <TextField
                                label="Label"
                                value={formData.linkLabel || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, linkLabel: e.target.value }))}
                                fullWidth
                                required
                            />
                            <TextField
                                label="Title (optional)"
                                value={formData.linkTitle || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, linkTitle: e.target.value }))}
                                fullWidth
                            />
                            <TextField
                                label="URL"
                                value={formData.linkUrl || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                                fullWidth
                                required
                                placeholder="https://example.com or /path"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.linkOpenInNewTab || false}
                                        onChange={(e) => setFormData(prev => ({ ...prev, linkOpenInNewTab: e.target.checked }))}
                                    />
                                }
                                label="Open in new tab"
                            />
                        </>
                    )}

                    {/* Page Config */}
                    {formData.type === 'page' && (
                        <>
                            <TextField
                                label="Label"
                                value={formData.label || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                                fullWidth
                            />
                            <PageAutocomplete
                                value={formData.pageId || null}
                                onChange={(value, page) => setFormData(prev => ({
                                    ...prev,
                                    pageId: value || undefined,
                                    pageName: page?.title || undefined,
                                    pageSlug: page?.slug || undefined
                                }))}
                                storeId={storeId}
                                label="Select Page"
                            />
                        </>
                    )}

                    {/* Divider - No config needed */}
                    {formData.type === 'divider' && (
                        <Typography variant="body2" color="text.secondary">
                            Dividers do not require configuration.
                        </Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions
                sx={{
                    justifyContent: 'space-between',
                    px: 2.25,
                    py: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                }}
            >
                <Box>
                    <Button
                        color="error"
                        onClick={() => {
                            if (item) onDelete(item.id);
                            onClose();
                        }}
                    >
                        Delete
                    </Button>
                </Box>
                <Box>
                    <Button onClick={onClose} sx={{ mr: 1 }}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained">
                        Save
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}

// ============ SORTABLE MEGA MENU ITEM ============

interface SortableMegaMenuItemProps {
    item: MegaMenuItem;
    sectionId: string;
    columnId: string;
    onEdit: (item: MegaMenuItem) => void;
    onDelete: (itemId: string) => void;
}

function SortableMegaMenuItem({ item, sectionId, columnId, onEdit, onDelete }: SortableMegaMenuItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: item.id,
        data: { type: 'mega-item', sectionId, columnId, itemId: item.id },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getItemIcon = () => {
        switch (item.type) {
            case 'category': return <CategoryIcon fontSize="small" />;
            case 'product': return <StarIcon fontSize="small" />;
            case 'image': return <ImageIcon fontSize="small" />;
            case 'custom-link': return <LinkIcon fontSize="small" />;
            case 'page': return <DescriptionIcon fontSize="small" />;
            case 'divider': return <ViewColumnIcon fontSize="small" />;
            default: return null;
        }
    };

    const getItemLabel = () => {
        if (item.label) return item.label;
        if (item.linkLabel) return item.linkLabel;
        switch (item.type) {
            case 'category': return 'Category Block';
            case 'product': return 'Products';
            case 'image': return 'Image';
            case 'custom-link': return 'Custom Link';
            case 'page': return 'Page Link';
            case 'divider': return 'Divider';
            default: return 'Unknown';
        }
    };

    const getItemDetails = () => {
        switch (item.type) {
            case 'category':
                if (item.categoryName) return `Category: ${item.categoryName}`;
                return item.categoryId ? `Category: ${item.categoryId}` : 'No category selected';
            case 'product':
                const productCount = item.products?.length || 0;
                if (productCount > 0) {
                    const names = item.products!.map(p => p.name).slice(0, 2).join(', ');
                    return `${productCount} product${productCount !== 1 ? 's' : ''}: ${names}${productCount > 2 ? '...' : ''}`;
                }
                return `${productCount} product${productCount !== 1 ? 's' : ''}`;
            case 'image':
                return item.imageUrl ? 'Image configured' : 'No image';
            case 'custom-link':
                return item.linkUrl || 'No URL';
            case 'page':
                if (item.pageName) return `Page: ${item.pageName}`;
                return item.pageId ? `Page: ${item.pageId}` : 'No page selected';
            default:
                return '';
        }
    };

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            variant="outlined"
            sx={{
                p: 1,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'background.paper',
            }}
        >
            <Box {...attributes} {...listeners} sx={{ cursor: 'grab', display: 'flex' }}>
                <DragIndicatorIcon fontSize="small" color="action" />
            </Box>
            <Box sx={{ color: 'primary.main' }}>{getItemIcon()}</Box>
            <Box flex={1}>
                <Typography variant="body2" fontWeight={500}>{getItemLabel()}</Typography>
                <Typography variant="caption" color="text.secondary">
                    {getItemDetails()}
                </Typography>
            </Box>
            <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(item)}>
                    <SettingsIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => onDelete(item.id)}>
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </Paper>
    );
}

// ============ COLUMN DROP ZONE ============

interface ColumnDropZoneProps {
    sectionId: string;
    columnId: string;
    children: React.ReactNode;
}

function ColumnDropZone({ sectionId, columnId, children }: ColumnDropZoneProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `drop-${columnId}`,
        data: { type: 'column-drop', sectionId, columnId },
    });

    return (
        <Box
            ref={setNodeRef}
            sx={{
                minHeight: 100,
                p: 1,
                border: isOver ? '2px dashed' : '1px dashed',
                borderColor: isOver ? 'primary.main' : 'grey.300',
                borderRadius: 1,
                bgcolor: isOver ? 'action.hover' : 'transparent',
                transition: 'all 0.2s',
            }}
        >
            {children}
        </Box>
    );
}

// ============ MEGA MENU COLUMN ============

interface MegaMenuColumnComponentProps {
    column: MegaMenuColumn;
    columnIndex: number;
    sectionId: string;
    onUpdate: (sectionId: string, column: MegaMenuColumn) => void;
    onDelete: (sectionId: string, columnId: string) => void;
    onEditItem: (sectionId: string, columnId: string, item: MegaMenuItem) => void;
    onDeleteItem: (sectionId: string, columnId: string, itemId: string) => void;
}

function MegaMenuColumnComponent({
    column,
    columnIndex,
    sectionId,
    onUpdate,
    onDelete,
    onEditItem,
    onDeleteItem,
}: MegaMenuColumnComponentProps) {
    const [expanded, setExpanded] = useState(true);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: column.id, data: { type: 'column' } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const flexBasis = `${(column.width / 12) * 100}%`;

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            variant="outlined"
            sx={{
                flexBasis,
                minWidth: 150,
            }}
        >
            {/* Column Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1,
                    bgcolor: 'grey.100',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Box {...attributes} {...listeners} sx={{ cursor: 'grab', mr: 1 }}>
                    <DragIndicatorIcon fontSize="small" color="action" />
                </Box>
                <Typography variant="caption" fontWeight={600} sx={{ mr: 1 }}>
                    Col {columnIndex + 1}: {column.width}/12
                </Typography>
                <Box flex={1} />
                <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                    {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
                <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(sectionId, column.id);
                    }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Width Input */}
            <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
                    Width:
                </Typography>
                <TextField
                    type="number"
                    value={column.width}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1 && val <= 12) {
                            onUpdate(sectionId, { ...column, width: val });
                        }
                    }}
                    size="small"
                    inputProps={{ min: 1, max: 12, step: 1 }}
                    sx={{ width: 80 }}
                />
                <Typography variant="caption" color="text.secondary">
                    / 12
                </Typography>
            </Box>

            {/* Column Content */}
            <Collapse in={expanded}>
                <Box sx={{ p: 1 }}>
                    <SortableContext
                        items={column.items.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <ColumnDropZone sectionId={sectionId} columnId={column.id}>
                            {column.items.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                                    Empty
                                </Typography>
                            ) : (
                                column.items.map((item) => (
                                    <SortableMegaMenuItem
                                        key={item.id}
                                        item={item}
                                        sectionId={sectionId}
                                        columnId={column.id}
                                        onEdit={(item) => onEditItem(sectionId, column.id, item)}
                                        onDelete={(itemId) => onDeleteItem(sectionId, column.id, itemId)}
                                    />
                                ))
                            )}
                        </ColumnDropZone>
                    </SortableContext>
                </Box>
            </Collapse>
        </Paper>
    );
}

// ============ MEGA MENU SECTION ============

interface MegaMenuSectionComponentProps {
    section: MegaMenuSection;
    onUpdate: (section: MegaMenuSection) => void;
    onDelete: (sectionId: string) => void;
    onUpdateColumn: (sectionId: string, column: MegaMenuColumn) => void;
    onDeleteColumn: (sectionId: string, columnId: string) => void;
    onEditItem: (sectionId: string, columnId: string, item: MegaMenuItem) => void;
    onDeleteItem: (sectionId: string, columnId: string, itemId: string) => void;
}

function MegaMenuSectionComponent({
    section,
    onUpdate,
    onDelete,
    onUpdateColumn,
    onDeleteColumn,
    onEditItem,
    onDeleteItem,
}: MegaMenuSectionComponentProps) {
    const [expanded, setExpanded] = useState(true);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id, data: { type: 'section' } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleAddColumn = () => {
        const newColumn: MegaMenuColumn = {
            id: uuidv4(),
            width: 3,
            items: [],
        };
        onUpdate({ ...section, columns: [...section.columns, newColumn] });
    };

    const getSectionLabel = () => {
        switch (section.type) {
            case 'full-width': return 'Full Width';
            case 'container': return 'Container';
            case 'split-2': return '2 Columns';
            case 'split-3': return '3 Columns';
            case 'split-4': return '4 Columns';
            case 'custom': return 'Custom';
            default: return section.type;
        }
    };

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            variant="outlined"
            sx={{ mb: 2, overflow: 'hidden' }}
        >
            {/* Section Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 1.5,
                    bgcolor: 'primary.50',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Box {...attributes} {...listeners} sx={{ cursor: 'grab', mr: 1 }}>
                    <DragIndicatorIcon color="action" />
                </Box>
                <GridOnIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle2" fontWeight={600}>
                    {getSectionLabel()} ({section.columns.length} columns)
                </Typography>
                <Box flex={1} />
                <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddColumn}
                    sx={{ mr: 1 }}
                >
                    Add Column
                </Button>
                <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                    {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(section.id);
                    }}
                >
                    <DeleteIcon />
                </IconButton>
            </Box>

            {/* Section Content */}
            <Collapse in={expanded}>
                <Box sx={{ p: 2 }}>
                    {section.columns.length === 0 ? (
                        <Box textAlign="center" py={4}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                No columns in this section
                            </Typography>
                            <Button
                                startIcon={<AddIcon />}
                                variant="contained"
                                size="small"
                                onClick={handleAddColumn}
                            >
                                Add First Column
                            </Button>
                        </Box>
                    ) : (
                        <SortableContext
                            items={section.columns.map(c => c.id)}
                            strategy={horizontalListSortingStrategy}
                        >
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {section.columns.map((column, index) => (
                                    <MegaMenuColumnComponent
                                        key={column.id}
                                        column={column}
                                        columnIndex={index}
                                        sectionId={section.id}
                                        onUpdate={onUpdateColumn}
                                        onDelete={onDeleteColumn}
                                        onEditItem={onEditItem}
                                        onDeleteItem={onDeleteItem}
                                    />
                                ))}
                            </Box>
                        </SortableContext>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
}

// ============ MAIN MEGA MENU BUILDER ============

export default function MegaMenuBuilder({ data, onChange, storeId }: MegaMenuBuilderProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeDragData, setActiveDragData] = useState<{ type?: string; itemType?: string } | null>(null);
    const [editingItem, setEditingItem] = useState<{ sectionId: string; columnId: string; item: MegaMenuItem } | null>(null);
    const [sectionTypeDialog, setSectionTypeDialog] = useState(false);
    const { confirm } = useConfirm();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    // Add new section
    const handleAddSection = (type: SectionType) => {
        const columnCount = type === 'split-2' ? 2 : type === 'split-3' ? 3 : type === 'split-4' ? 4 : 1;
        const columnWidth = type === 'full-width' || type === 'container' ? 12 : Math.floor(12 / columnCount);

        const newSection: MegaMenuSection = {
            id: uuidv4(),
            type,
            columns: Array.from({ length: columnCount }, () => ({
                id: uuidv4(),
                width: columnWidth > 12 ? 12 : columnWidth, // Ensure max 12
                items: [],
            })),
            settings: {},
        };

        onChange({ ...data, sections: [...data.sections, newSection] });
        setSectionTypeDialog(false);
    };

    // Update section
    const handleUpdateSection = useCallback((updatedSection: MegaMenuSection) => {
        onChange({
            ...data,
            sections: data.sections.map(s => s.id === updatedSection.id ? updatedSection : s),
        });
    }, [data, onChange]);

    // Delete section
    const handleDeleteSection = async (sectionId: string) => {
        if (!await confirm({ title: 'Delete Section', message: 'Delete this section and all its contents?', severity: 'error' })) return;
        onChange({
            ...data,
            sections: data.sections.filter(s => s.id !== sectionId),
        });
    };

    // Update column
    const handleUpdateColumn = useCallback((sectionId: string, updatedColumn: MegaMenuColumn) => {
        onChange({
            ...data,
            sections: data.sections.map(s =>
                s.id === sectionId
                    ? { ...s, columns: s.columns.map(c => c.id === updatedColumn.id ? updatedColumn : c) }
                    : s
            ),
        });
    }, [data, onChange]);

    // Delete column
    const handleDeleteColumn = async (sectionId: string, columnId: string) => {
        if (!await confirm({ title: 'Delete Column', message: 'Delete this column and all its contents?', severity: 'error' })) return;
        onChange({
            ...data,
            sections: data.sections.map(s =>
                s.id === sectionId
                    ? { ...s, columns: s.columns.filter(c => c.id !== columnId) }
                    : s
            ),
        });
    };

    // Delete item from column
    const handleDeleteItem = (sectionId: string, columnId: string, itemId: string) => {
        onChange({
            ...data,
            sections: data.sections.map(s =>
                s.id === sectionId
                    ? {
                        ...s,
                        columns: s.columns.map(c =>
                            c.id === columnId
                                ? { ...c, items: c.items.filter(i => i.id !== itemId) }
                                : c
                        ),
                    }
                    : s
            ),
        });
    };

    // Handle drag start
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        const currentData = event.active.data.current;
        setActiveDragData(
            currentData
                ? { type: currentData.type as string | undefined, itemType: currentData.itemType as string | undefined }
                : null
        );
    };

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveDragData(null);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // Move/reorder items inside and across columns
        if (activeData?.type === 'mega-item') {
            const sourceSectionId = activeData.sectionId as string;
            const sourceColumnId = activeData.columnId as string;
            const sourceItemId = activeData.itemId as string;

            let targetSectionId: string | undefined;
            let targetColumnId: string | undefined;
            let targetItemId: string | undefined;

            if (overData?.type === 'mega-item') {
                targetSectionId = overData.sectionId as string;
                targetColumnId = overData.columnId as string;
                targetItemId = overData.itemId as string;
            } else if (overData?.type === 'column-drop') {
                targetSectionId = overData.sectionId as string;
                targetColumnId = overData.columnId as string;
            }

            if (!targetSectionId || !targetColumnId) return;

            const sourceSection = data.sections.find((s) => s.id === sourceSectionId);
            const sourceColumn = sourceSection?.columns.find((c) => c.id === sourceColumnId);
            const movingItem = sourceColumn?.items.find((i) => i.id === sourceItemId);
            if (!movingItem) return;

            const updatedSections = data.sections.map((section) => {
                if (section.id !== sourceSectionId && section.id !== targetSectionId) return section;

                return {
                    ...section,
                    columns: section.columns.map((column) => {
                        const isSource = section.id === sourceSectionId && column.id === sourceColumnId;
                        const isTarget = section.id === targetSectionId && column.id === targetColumnId;
                        if (!isSource && !isTarget) return column;

                        // Same column reorder
                        if (isSource && isTarget) {
                            const oldIndex = column.items.findIndex((i) => i.id === sourceItemId);
                            if (oldIndex < 0) return column;
                            const newIndex = targetItemId
                                ? column.items.findIndex((i) => i.id === targetItemId)
                                : column.items.length - 1;
                            if (newIndex < 0 || newIndex === oldIndex) return column;
                            return { ...column, items: arrayMove(column.items, oldIndex, newIndex) };
                        }

                        // Remove from source column
                        if (isSource) {
                            return { ...column, items: column.items.filter((i) => i.id !== sourceItemId) };
                        }

                        // Insert into target column
                        if (isTarget) {
                            if (targetItemId) {
                                const targetIndex = column.items.findIndex((i) => i.id === targetItemId);
                                if (targetIndex < 0) {
                                    return { ...column, items: [...column.items, movingItem] };
                                }
                                const nextItems = [...column.items];
                                nextItems.splice(targetIndex, 0, movingItem);
                                return { ...column, items: nextItems };
                            }
                            return { ...column, items: [...column.items, movingItem] };
                        }

                        return column;
                    }),
                };
            });

            onChange({ ...data, sections: updatedSections });
            return;
        }

        // Dropping from palette to column
        if (activeData?.type === 'palette-item' && overData?.type === 'column-drop') {
            const newItem: MegaMenuItem = {
                id: uuidv4(),
                type: activeData.itemType,
            };

            // Find the section and column
            const updatedSections = data.sections.map(section => ({
                ...section,
                columns: section.columns.map(col =>
                    col.id === overData.columnId
                        ? { ...col, items: [...col.items, newItem] }
                        : col
                ),
            }));

            onChange({ ...data, sections: updatedSections });

            // Open config dialog immediately
            const section = data.sections.find(s => s.columns.some(c => c.id === overData.columnId));
            if (section) {
                setEditingItem({ sectionId: section.id, columnId: overData.columnId, item: newItem });
            }
        }

        // Reordering sections
        if (activeData?.type === 'section' && overData?.type === 'section') {
            const oldIndex = data.sections.findIndex(s => s.id === active.id);
            const newIndex = data.sections.findIndex(s => s.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                onChange({
                    ...data,
                    sections: arrayMove(data.sections, oldIndex, newIndex),
                });
            }
        }
    };

    // Handle edit item
    const handleEditItem = (sectionId: string, columnId: string, item: MegaMenuItem) => {
        setEditingItem({ sectionId, columnId, item });
    };

    // Save edited item
    const handleSaveItem = (updatedItem: MegaMenuItem) => {
        if (!editingItem) return;

        onChange({
            ...data,
            sections: data.sections.map(s =>
                s.id === editingItem.sectionId
                    ? {
                        ...s,
                        columns: s.columns.map(c =>
                            c.id === editingItem.columnId
                                ? { ...c, items: c.items.map(i => i.id === updatedItem.id ? updatedItem : i) }
                                : c
                        ),
                    }
                    : s
            ),
        });

        setEditingItem(null);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <Box sx={{ display: 'flex', gap: 2, minHeight: '500px' }}>
                {/* Left Palette */}
                <Paper sx={{ width: 220, p: 2, overflow: 'auto', flexShrink: 0 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Add Elements
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                        Drag to add to columns
                    </Typography>
                    <SortableContext items={paletteItems.map(p => `palette-${p.type}`)}>
                        {paletteItems.map((item) => (
                            <DraggablePaletteItem key={item.type} {...item} />
                        ))}
                    </SortableContext>
                </Paper>

                {/* Main Canvas */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 2, gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Mega Menu Sections ({data.sections.length})
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: { xs: 1 } }}>
                            <TextField
                                size="small"
                                type="number"
                                label="Max Panel Height (px)"
                                value={data.maxHeight || ''}
                                onChange={(e) => {
                                    const val = e.target.value ? Number(e.target.value) : undefined;
                                    onChange({ ...data, maxHeight: val });
                                }}
                                placeholder="Auto"
                                sx={{ minWidth: 210 }}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ min: 100, step: 50 }}
                            />
                            <Button
                                startIcon={<AddIcon />}
                                variant="outlined"
                                size="small"
                                onClick={() => setSectionTypeDialog(true)}
                            >
                                Add Section
                            </Button>
                        </Box>
                    </Box>

                    {data.sections.length === 0 ? (
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 4,
                                textAlign: 'center',
                                border: '2px dashed',
                                borderColor: 'grey.300',
                            }}
                        >
                            <Typography color="text.secondary" gutterBottom>
                                No sections yet
                            </Typography>
                            <Button
                                startIcon={<AddIcon />}
                                variant="contained"
                                onClick={() => setSectionTypeDialog(true)}
                            >
                                Add First Section
                            </Button>
                        </Paper>
                    ) : (
                        <SortableContext
                            items={data.sections.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {data.sections.map((section) => (
                                <MegaMenuSectionComponent
                                    key={section.id}
                                    section={section}
                                    onUpdate={handleUpdateSection}
                                    onDelete={handleDeleteSection}
                                    onUpdateColumn={handleUpdateColumn}
                                    onDeleteColumn={handleDeleteColumn}
                                    onEditItem={handleEditItem}
                                    onDeleteItem={handleDeleteItem}
                                />
                            ))}
                        </SortableContext>
                    )}
                </Box>
            </Box>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeId && activeDragData?.type === 'palette-item' && (
                    <Paper
                        sx={{
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            bgcolor: 'primary.50',
                            border: '2px solid',
                            borderColor: 'primary.main',
                            boxShadow: 4,
                        }}
                    >
                        <DragIndicatorIcon fontSize="small" color="primary" />
                        <Typography variant="body2" fontWeight={600}>
                            {paletteItems.find(p => p.type === activeDragData.itemType)?.label}
                        </Typography>
                    </Paper>
                )}
            </DragOverlay>

            {/* Section Type Dialog */}
            <Dialog
                open={sectionTypeDialog}
                onClose={() => setSectionTypeDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                    },
                }}
            >
                <DialogTitle sx={(theme) => ({ py: 1.5, px: 2.25, bgcolor: alpha(theme.palette.primary.main, 0.06) })}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={800}>
                                Add Section Type
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Pick a layout preset to start building this mega-menu block.
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setSectionTypeDialog(false)}>
                            <CloseRoundedIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 2.25, py: 2 }}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            gap: 1.25,
                            mt: 1,
                        }}
                    >
                        {[
                            { type: 'full-width' as SectionType, title: 'Full Width', desc: 'Single full-width column', chips: ['1 col', '12/12'] },
                            { type: 'container' as SectionType, title: 'Container', desc: 'Centered container section', chips: ['1 col', '12/12'] },
                            { type: 'split-2' as SectionType, title: '2 Columns', desc: 'Two balanced columns', chips: ['2 cols', '6/6'] },
                            { type: 'split-3' as SectionType, title: '3 Columns', desc: 'Three equal columns', chips: ['3 cols', '4/4/4'] },
                            { type: 'split-4' as SectionType, title: '4 Columns', desc: 'Four equal columns', chips: ['4 cols', '3/3/3/3'] },
                            { type: 'custom' as SectionType, title: 'Custom', desc: 'Start with one and add columns', chips: ['Flexible'] },
                        ].map((option) => (
                            <Paper
                                key={option.type}
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    cursor: 'pointer',
                                    borderRadius: 2,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        borderColor: 'primary.main',
                                        bgcolor: 'primary.50',
                                        transform: 'translateY(-1px)',
                                    },
                                }}
                                onClick={() => handleAddSection(option.type)}
                            >
                                <Typography variant="subtitle2" color="primary" fontWeight={700} gutterBottom>
                                    {option.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {option.desc}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                    {option.chips.map((chip) => (
                                        <Chip key={chip} size="small" label={chip} variant="outlined" />
                                    ))}
                                </Box>
                            </Paper>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions
                    sx={{
                        px: 2.25,
                        py: 1.5,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                    }}
                >
                    <Button onClick={() => setSectionTypeDialog(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Item Config Dialog */}
            <ItemConfigDialog
                key={editingItem ? `${editingItem.sectionId}-${editingItem.columnId}-${editingItem.item.id}` : 'new-item-dialog'}
                open={!!editingItem}
                item={editingItem?.item || null}
                onClose={() => setEditingItem(null)}
                onSave={handleSaveItem}
                onDelete={(itemId) => {
                    if (editingItem) {
                        handleDeleteItem(editingItem.sectionId, editingItem.columnId, itemId);
                    }
                }}
                storeId={storeId}
            />
        </DndContext>
    );
}
