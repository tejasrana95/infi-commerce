'use client';

import { ReactNode, useMemo, useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCorners,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import LinkRoundedIcon from '@mui/icons-material/LinkRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded';
import SplitscreenOutlinedIcon from '@mui/icons-material/SplitscreenOutlined';
import UnfoldMoreRoundedIcon from '@mui/icons-material/UnfoldMoreRounded';
import ViewModuleOutlinedIcon from '@mui/icons-material/ViewModuleOutlined';
import { v4 as uuidv4 } from 'uuid';
import { MenuItem as MenuItemType } from '@/types';
import CategoryAutocomplete from '@/components/molecules/CategoryAutocomplete';
import PageAutocomplete from '@/components/molecules/PageAutocomplete';
import BlogCategoryAutocomplete from '@/components/molecules/BlogCategoryAutocomplete';
import { ProductAutoComplete } from '../molecules';
import { ProductOption } from '../molecules/ProductAutoComplete';
import { MegaMenuBuilder, MegaMenuData } from './MegaMenuBuilder';
import { useConfirm } from '@/contexts/ConfirmContext';

interface MenuItemBuilderProps {
    items: MenuItemType[];
    onChange: (items: MenuItemType[]) => void;
    storeId: string;
    maxDepth?: number;
}

const ROOT_CONTAINER = '__root__';

const menuItemTypes = [
    { value: 'link', label: 'Custom Link', icon: <LinkRoundedIcon fontSize="small" /> },
    { value: 'category', label: 'Product Category', icon: <CategoryOutlinedIcon fontSize="small" /> },
    { value: 'product', label: 'Product', icon: <Inventory2OutlinedIcon fontSize="small" /> },
    { value: 'page', label: 'Static Page', icon: <DescriptionOutlinedIcon fontSize="small" /> },
    { value: 'blog-category', label: 'Blog Category', icon: <ArticleOutlinedIcon fontSize="small" /> },
    { value: 'mega-menu', label: 'Mega Menu', icon: <ViewModuleOutlinedIcon fontSize="small" /> },
    { value: 'dropdown', label: 'Dropdown Group', icon: <SplitscreenOutlinedIcon fontSize="small" /> },
    { value: 'divider', label: 'Divider', icon: <RemoveRoundedIcon fontSize="small" /> },
] as const;

type MenuItemTypeValue = MenuItemType['type'];

const getTypeMeta = (type: string) => {
    return menuItemTypes.find((item) => item.value === type) || menuItemTypes[0];
};

const findItemById = (items: MenuItemType[], itemId: string): MenuItemType | null => {
    for (const item of items) {
        if (item.id === itemId) return item;
        const found = findItemById(item.children || [], itemId);
        if (found) return found;
    }
    return null;
};

const getChildrenForContainer = (items: MenuItemType[], containerId: string): MenuItemType[] => {
    if (containerId === ROOT_CONTAINER) return items;
    return findItemById(items, containerId)?.children || [];
};

const updateChildrenForContainer = (
    items: MenuItemType[],
    containerId: string,
    updater: (children: MenuItemType[]) => MenuItemType[]
): MenuItemType[] => {
    if (containerId === ROOT_CONTAINER) {
        return updater(items);
    }

    return items.map((item) => {
        if (item.id === containerId) {
            return { ...item, children: updater(item.children || []) };
        }

        if (!item.children?.length) return item;
        return { ...item, children: updateChildrenForContainer(item.children, containerId, updater) };
    });
};

const removeItemFromTree = (
    items: MenuItemType[],
    itemId: string
): { nextItems: MenuItemType[]; removed: MenuItemType | null } => {
    let removed: MenuItemType | null = null;

    const walk = (nodes: MenuItemType[]): MenuItemType[] => {
        const next: MenuItemType[] = [];

        for (const node of nodes) {
            if (node.id === itemId) {
                removed = node;
                continue;
            }

            if (node.children?.length) {
                next.push({ ...node, children: walk(node.children) });
            } else {
                next.push(node);
            }
        }

        return next;
    };

    return { nextItems: walk(items), removed };
};

const isDescendantContainer = (draggedItem: MenuItemType, containerId: string): boolean => {
    if (containerId === ROOT_CONTAINER) return false;
    if (draggedItem.id === containerId) return true;

    return (draggedItem.children || []).some((child) => isDescendantContainer(child, containerId));
};

const getItemDepth = (items: MenuItemType[], itemId: string, depth = 0): number | null => {
    for (const item of items) {
        if (item.id === itemId) return depth;
        const d = getItemDepth(item.children || [], itemId, depth + 1);
        if (d !== null) return d;
    }
    return null;
};

const getSubtreeDepth = (item: MenuItemType): number => {
    if (!item.children?.length) return 0;
    return 1 + Math.max(...item.children.map(getSubtreeDepth));
};

interface EditItemDialogProps {
    open: boolean;
    item: MenuItemType | null;
    onClose: () => void;
    onSave: (item: MenuItemType) => void;
    onDelete: (itemId: string) => void;
    storeId: string;
    isNew?: boolean;
}

const getInitialFormData = (item: MenuItemType | null): Partial<MenuItemType> => {
    if (!item) {
        return {
            label: '',
            type: 'link',
            url: '',
            openInNewTab: false,
            icon: '',
        };
    }

    return {
        label: item.label || '',
        type: item.type || 'link',
        url: item.url || '',
        categoryId: item.categoryId,
        categorySlug: item.categorySlug,
        productId: item.productId,
        productSlug: item.productSlug,
        pageId: item.pageId,
        pageSlug: item.pageSlug,
        blogCategoryId: item.blogCategoryId,
        blogCategorySlug: item.blogCategorySlug,
        openInNewTab: item.openInNewTab || false,
        icon: item.icon || '',
        badge: item.badge,
        autoAddProducts: item.autoAddProducts ?? true,
        showProductImage: item.showProductImage ?? true,
        showProductPrice: item.showProductPrice ?? true,
        showViewAll: item.showViewAll ?? false,
        imagePosition: item.imagePosition || 'left',
        productLimit: item.productLimit || 10,
    };
};

const getInitialSelectedProduct = (item: MenuItemType | null): ProductOption | null => {
    if (!item || item.type !== 'product' || !item.productId) return null;

    return {
        _id: item.productId,
        name: item.label || '',
        slug: item.productSlug || '',
        sku: '',
        price: 0,
    };
};

function EditItemDialog({ open, item, onClose, onSave, onDelete, storeId, isNew = false }: EditItemDialogProps) {
    const [formData, setFormData] = useState<Partial<MenuItemType>>(() => getInitialFormData(item));
    const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(() => getInitialSelectedProduct(item));

    const handleTypeChange = (newType: string) => {
        setFormData((prev) => ({
            ...prev,
            type: newType as MenuItemTypeValue,
            url: '',
            categoryId: undefined,
            categorySlug: undefined,
            productId: undefined,
            productSlug: undefined,
            pageId: undefined,
            pageSlug: undefined,
            blogCategoryId: undefined,
            blogCategorySlug: undefined,
        }));
        setSelectedProduct(null);
    };

    const handleSave = () => {
        const savedItem: MenuItemType = {
            id: item?.id || uuidv4(),
            label: formData.label || 'Menu Item',
            type: (formData.type as MenuItemTypeValue) || 'link',
            url: formData.url,
            categoryId: formData.categoryId,
            categorySlug: formData.categorySlug,
            productId: formData.productId,
            productSlug: formData.productSlug,
            pageId: formData.pageId,
            pageSlug: formData.pageSlug,
            blogCategoryId: formData.blogCategoryId,
            blogCategorySlug: formData.blogCategorySlug,
            openInNewTab: formData.openInNewTab || false,
            icon: formData.icon,
            badge: formData.badge,
            children: item?.children || [],
            order: item?.order || 0,
            megaMenu: item?.megaMenu,
            autoAddProducts: formData.autoAddProducts,
            showProductImage: formData.showProductImage,
            showProductPrice: formData.showProductPrice,
            imagePosition: formData.imagePosition,
            showViewAll: formData.showViewAll,
            productLimit: formData.productLimit,
        };
        onSave(savedItem);
        onClose();
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
            <DialogTitle sx={(theme) => ({ py: 1.5, px: 2.25, bgcolor: alpha(theme.palette.primary.main, 0.06) })}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={800}>
                            {isNew ? 'Add Menu Item' : 'Edit Menu Item'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Configure item type, behavior, and destination.
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={onClose}>
                        <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                </Stack>
            </DialogTitle>
            <DialogContent sx={{ px: 2, py: 1.25 }}>
                <Stack spacing={2} sx={{ mt: 2 }}>
                    <TextField
                        select
                        label="Item Type"
                        value={formData.type || 'link'}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        size="small"
                        fullWidth
                    >
                        {menuItemTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    {type.icon}
                                    <span>{type.label}</span>
                                </Stack>
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Label"
                        value={formData.label || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                        size="small"
                        fullWidth
                        required
                    />

                    {formData.type === 'link' && (
                        <TextField
                            label="URL"
                            value={formData.url || ''}
                            onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                            size="small"
                            fullWidth
                            placeholder="https://example.com or /path"
                        />
                    )}

                    {formData.type === 'category' && (
                        <>
                            <CategoryAutocomplete
                                value={formData.categoryId || null}
                                onChange={(value, category) => {
                                    const cat = Array.isArray(category) ? category[0] : category;
                                    setFormData((prev) => ({
                                        ...prev,
                                        categoryId: value || undefined,
                                        categorySlug: cat?.slug || undefined,
                                    }));
                                }}
                                storeId={storeId}
                                label="Select Category"
                            />

                            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                                    Category Product Display
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                size="small"
                                                checked={formData.autoAddProducts ?? true}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({ ...prev, autoAddProducts: e.target.checked }))
                                                }
                                            />
                                        }
                                        label="Auto populate"
                                    />
                                    {(formData.autoAddProducts ?? true) && (
                                        <>
                                            <TextField
                                                label="Max Product Limit"
                                                type="number"
                                                value={formData.productLimit || 10}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        productLimit: Number(e.target.value),
                                                    }))
                                                }
                                                size="small"
                                                inputProps={{ min: 1, max: 50 }}
                                                fullWidth
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        size="small"
                                                        checked={formData.showProductImage ?? true}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                showProductImage: e.target.checked,
                                                            }))
                                                        }
                                                    />
                                                }
                                                label="Show image"
                                            />
                                            {(formData.showProductImage ?? true) && (
                                                <FormControl fullWidth>
                                                    <InputLabel>Image Position</InputLabel>
                                                    <Select
                                                        size="small"
                                                        label="Image Position"
                                                        value={formData.imagePosition || 'left'}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                imagePosition: e.target.value as 'left' | 'top',
                                                            }))
                                                        }
                                                    >
                                                        <MenuItem value="left">Left</MenuItem>
                                                        <MenuItem value="top">Top</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            )}
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        size="small"
                                                        checked={formData.showProductPrice ?? true}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                showProductPrice: e.target.checked,
                                                            }))
                                                        }
                                                    />
                                                }
                                                label="Show price"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        size="small"
                                                        checked={formData.showViewAll ?? false}
                                                        onChange={(e) =>
                                                            setFormData((prev) => ({ ...prev, showViewAll: e.target.checked }))
                                                        }
                                                    />
                                                }
                                                label="Show View All"
                                            />
                                        </>
                                    )}
                                </Box>
                            </Paper>
                        </>
                    )}

                    {formData.type === 'product' && (
                        <>
                            <ProductAutoComplete
                                storeId={storeId}
                                value={selectedProduct}
                                onChange={(product: ProductOption | null) => {
                                    setSelectedProduct(product);
                                    setFormData((prev) => ({
                                        ...prev,
                                        productId: product?._id,
                                        productSlug: product?.slug,
                                    }));
                                }}
                                label="Select Product"
                            />
                            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1.5 }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.75 }}>
                                    Product Display
                                </Typography>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>

                                    <FormControlLabel
                                        control={
                                            <Switch
                                                size="small"
                                                checked={formData.showProductImage ?? true}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        showProductImage: e.target.checked,
                                                    }))
                                                }
                                            />
                                        }
                                        label="Show image"
                                    />
                                    {(formData.showProductImage ?? true) && (
                                        <FormControl fullWidth>
                                            <InputLabel>Image Position</InputLabel>
                                            <Select
                                                size="small"
                                                label="Image Position"
                                                value={formData.imagePosition || 'left'}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        imagePosition: e.target.value as 'left' | 'top',
                                                    }))
                                                }
                                            >
                                                <MenuItem value="left">Left</MenuItem>
                                                <MenuItem value="top">Top</MenuItem>
                                            </Select>
                                        </FormControl>
                                    )}
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                size="small"
                                                checked={formData.showProductPrice ?? true}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        showProductPrice: e.target.checked,
                                                    }))
                                                }
                                            />
                                        }
                                        label="Show price"
                                    />
                                </Box>
                            </Paper>
                        </>
                    )}

                    {formData.type === 'page' && (
                        <PageAutocomplete
                            value={formData.pageId || null}
                            onChange={(value, page) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    pageId: value || undefined,
                                    pageSlug: page?.slug || undefined,
                                }))
                            }
                            storeId={storeId}
                            label="Select Page"
                        />
                    )}

                    {formData.type === 'blog-category' && (
                        <BlogCategoryAutocomplete
                            value={formData.blogCategoryId || null}
                            onChange={(value, category) => {
                                const selected = Array.isArray(category) ? category[0] : category;
                                setFormData((prev) => ({
                                    ...prev,
                                    blogCategoryId: (value as string | null) || undefined,
                                    blogCategorySlug: selected?.slug || undefined,
                                }));
                            }}
                            storeId={storeId}
                            label="Select Blog Category"
                        />
                    )}

                    {formData.type !== 'divider' && (
                        <>
                            <FormControlLabel
                                control={
                                    <Switch
                                        size="small"
                                        checked={formData.openInNewTab || false}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, openInNewTab: e.target.checked }))
                                        }
                                    />
                                }
                                label="Open in new tab"
                            />
                        </>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions
                sx={{
                    px: 2.25,
                    py: 1,
                    justifyContent: 'space-between',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                }}
            >
                <Box>
                    {!isNew && item && (
                        <Button color="error" onClick={() => onDelete(item.id)}>
                            Delete
                        </Button>
                    )}
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={!formData.label}>
                        {isNew ? 'Add Item' : 'Save'}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
}

interface DragData {
    type: 'menu-item' | 'container';
    itemId?: string;
    containerId: string;
}

interface SortableMenuCardProps {
    item: MenuItemType;
    depth: number;
    maxDepth: number;
    containerId: string;
    expanded: boolean;
    storeId: string;
    onToggleExpand: (id: string) => void;
    onEdit: (item: MenuItemType) => void;
    onDelete: (itemId: string) => void;
    onAddChild: (parentId: string) => void;
    onUpdateItem: (item: MenuItemType) => void;
    renderChildren: (containerId: string, depth: number) => ReactNode;
}

function SortableMenuCard({
    item,
    depth,
    maxDepth,
    containerId,
    expanded,
    storeId,
    onToggleExpand,
    onEdit,
    onDelete,
    onAddChild,
    onUpdateItem,
    renderChildren,
}: SortableMenuCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: item.id,
        data: {
            type: 'menu-item',
            itemId: item.id,
            containerId,
        } satisfies DragData,
    });

    const meta = getTypeMeta(item.type);
    const hasChildren = item.children?.length > 0;
    const showChildren = item.type !== 'mega-menu' && depth < maxDepth - 1;
    const canAddChild = item.type !== 'divider' && item.type !== 'mega-menu' && depth < maxDepth - 1;

    return (
        <Card
            ref={setNodeRef}
            variant="outlined"
            sx={{
                mb: 1.2,
                borderRadius: 2,
                borderColor: isDragging ? 'primary.main' : 'divider',
                boxShadow: isDragging ? (theme) => `0 10px 28px ${alpha(theme.palette.primary.main, 0.2)}` : 'none',
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.72 : 1,
                ml: depth > 0 ? 1 : 0,
            }}
        >
            <CardContent sx={{ px: 1.5, py: 1.25, '&:last-child': { pb: 1.25 } }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                        {...attributes}
                        {...listeners}
                        sx={{
                            display: 'grid',
                            placeItems: 'center',
                            width: 30,
                            height: 30,
                            borderRadius: 1,
                            cursor: 'grab',
                            color: 'text.secondary',
                            '&:hover': { bgcolor: 'action.hover' },
                            '&:active': { cursor: 'grabbing' },
                        }}
                    >
                        <DragIndicatorRoundedIcon fontSize="small" />
                    </Box>

                    <Box sx={{ color: 'text.secondary', display: 'grid', placeItems: 'center' }}>{meta.icon}</Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography variant="body2" fontWeight={700} noWrap>
                                {item.label || 'Untitled Item'}
                            </Typography>
                            <Chip label={meta.label} size="small" variant="outlined" sx={{ height: 20 }} />
                            {item.openInNewTab && <Chip label="New Tab" size="small" color="info" sx={{ height: 20 }} />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {item.type === 'link'
                                ? item.url || 'No URL'
                                : item.type === 'divider'
                                    ? 'Divider'
                                    : `ID: ${item.categoryId || item.productId || item.pageId || item.blogCategoryId || '-'}`}
                        </Typography>
                    </Box>

                    {(hasChildren || item.type === 'mega-menu') && (
                        <IconButton size="small" onClick={() => onToggleExpand(item.id)}>
                            {expanded ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
                        </IconButton>
                    )}

                    {canAddChild && (
                        <Tooltip title="Add nested item">
                            <IconButton size="small" color="primary" onClick={() => onAddChild(item.id)}>
                                <AddRoundedIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}

                    <Tooltip title="Edit item">
                        <IconButton size="small" onClick={() => onEdit(item)}>
                            <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete item">
                        <IconButton size="small" color="error" onClick={() => onDelete(item.id)}>
                            <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>

                {item.type === 'mega-menu' && (
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Box sx={{ mt: 1.5, pl: 1.5, borderLeft: '2px solid', borderColor: 'divider' }}>
                            <MegaMenuBuilder
                                data={{
                                    sections: item.megaMenu?.sections || [],
                                    maxHeight: item.megaMenu?.maxHeight,
                                }}
                                onChange={(megaData: MegaMenuData) => {
                                    onUpdateItem({
                                        ...item,
                                        megaMenu: {
                                            sections: megaData.sections,
                                            maxHeight: megaData.maxHeight,
                                        },
                                    });
                                }}
                                storeId={storeId}
                            />
                        </Box>
                    </Collapse>
                )}

                {showChildren && (
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Box sx={{ pt: 1.25 }}>
                            {renderChildren(item.id, depth + 1)}
                        </Box>
                    </Collapse>
                )}
            </CardContent>
        </Card>
    );
}

interface ContainerDropZoneProps {
    containerId: string;
    label: string;
    depth: number;
    itemCount: number;
    children: React.ReactNode;
}

function ContainerDropZone({ containerId, label, depth, itemCount, children }: ContainerDropZoneProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `container-${containerId}`,
        data: {
            type: 'container',
            containerId,
        } satisfies DragData,
    });

    return (
        <Box
            ref={setNodeRef}
            sx={(theme) => ({
                border: '1px dashed',
                borderColor: isOver ? theme.palette.primary.main : theme.palette.divider,
                bgcolor: isOver ? alpha(theme.palette.primary.main, 0.06) : alpha(theme.palette.background.default, 0.22),
                borderRadius: 2,
                p: 1,
            })}
        >
            <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: itemCount > 0 ? 1 : 0, color: 'text.secondary' }}
            >
                <KeyboardArrowRightRoundedIcon fontSize="small" />
                <Typography variant="caption" fontWeight={700}>
                    {label}
                </Typography>
                <Chip size="small" label={`${itemCount}`} variant="outlined" sx={{ height: 18 }} />
                {depth > 0 && (
                    <Chip size="small" label={`Depth ${depth}`} sx={{ height: 18 }} />
                )}
            </Stack>

            {itemCount === 0 ? (
                <Box
                    sx={{
                        py: 2,
                        textAlign: 'center',
                        color: 'text.secondary',
                        borderRadius: 1.5,
                    }}
                >
                    <UnfoldMoreRoundedIcon fontSize="small" />
                    <Typography variant="caption" display="block">
                        Drop items here
                    </Typography>
                </Box>
            ) : (
                children
            )}
        </Box>
    );
}

export default function MenuItemBuilder({ items, onChange, storeId, maxDepth = 3 }: MenuItemBuilderProps) {
    const [editDialog, setEditDialog] = useState<{ open: boolean; item: MenuItemType | null; isNew: boolean; parentId?: string }>(
        {
            open: false,
            item: null,
            isNew: false,
        }
    );
    const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});
    const { confirm } = useConfirm();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const itemCount = useMemo(() => {
        const count = (nodes: MenuItemType[]): number => nodes.reduce((acc, n) => acc + 1 + count(n.children || []), 0);
        return count(items);
    }, [items]);

    const toggleExpanded = (id: string) => {
        setExpandedState((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
    };

    const handleAddItem = () => {
        setEditDialog({ open: true, item: null, isNew: true });
    };

    const handleAddChild = (parentId: string) => {
        setEditDialog({ open: true, item: null, isNew: true, parentId });
        setExpandedState((prev) => ({ ...prev, [parentId]: true }));
    };

    const handleEditItem = (item: MenuItemType) => {
        setEditDialog({ open: true, item, isNew: false });
    };

    const handleSaveItem = (savedItem: MenuItemType) => {
        if (editDialog.isNew) {
            const containerId = editDialog.parentId || ROOT_CONTAINER;
            const nextItems = updateChildrenForContainer(items, containerId, (children) => [...children, savedItem]);
            onChange(nextItems);
            return;
        }

        const updateItem = (nodes: MenuItemType[]): MenuItemType[] =>
            nodes.map((node) => {
                if (node.id === savedItem.id) {
                    return { ...savedItem, children: node.children };
                }
                if (!node.children?.length) return node;
                return { ...node, children: updateItem(node.children) };
            });

        onChange(updateItem(items));
    };

    const handleDeleteItem = async (itemId: string) => {
        const allowed = await confirm({
            title: 'Delete Menu Item',
            message: 'Delete this menu item and all nested children?',
            severity: 'error',
        });
        if (!allowed) return;

        const removeFromNodes = (nodes: MenuItemType[]): MenuItemType[] =>
            nodes
                .filter((node) => node.id !== itemId)
                .map((node) => ({ ...node, children: removeFromNodes(node.children || []) }));

        onChange(removeFromNodes(items));
    };

    const handleUpdateItem = (updatedItem: MenuItemType) => {
        const updateItem = (nodes: MenuItemType[]): MenuItemType[] =>
            nodes.map((node) => {
                if (node.id === updatedItem.id) return updatedItem;
                if (!node.children?.length) return node;
                return { ...node, children: updateItem(node.children) };
            });

        onChange(updateItem(items));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const activeData = event.active.data.current as DragData | undefined;
        const overData = event.over?.data.current as DragData | undefined;
        if (!event.over || !activeData || !overData || activeData.type !== 'menu-item' || !activeData.itemId) {
            return;
        }

        const sourceContainerId = activeData.containerId;
        const sourceChildren = getChildrenForContainer(items, sourceContainerId);
        const sourceIndex = sourceChildren.findIndex((child) => child.id === activeData.itemId);
        if (sourceIndex < 0) return;

        if (overData.type === 'menu-item' && overData.itemId) {
            const destinationContainerId = overData.containerId;
            const destinationChildren = getChildrenForContainer(items, destinationContainerId);
            const destinationIndex = destinationChildren.findIndex((child) => child.id === overData.itemId);
            if (destinationIndex < 0) return;

            if (sourceContainerId === destinationContainerId) {
                const reordered = updateChildrenForContainer(items, sourceContainerId, (children) =>
                    arrayMove(children, sourceIndex, destinationIndex)
                );
                onChange(reordered);
                return;
            }

            const draggedItem = findItemById(items, activeData.itemId);
            if (!draggedItem || isDescendantContainer(draggedItem, destinationContainerId)) return;

            const destinationDepth =
                destinationContainerId === ROOT_CONTAINER
                    ? 0
                    : (getItemDepth(items, destinationContainerId) ?? 0) + 1;

            if (destinationDepth + getSubtreeDepth(draggedItem) > maxDepth - 1) return;

            const removed = removeItemFromTree(items, activeData.itemId);
            if (!removed.removed) return;

            const inserted = updateChildrenForContainer(
                removed.nextItems,
                destinationContainerId,
                (children) => [
                    ...children.slice(0, destinationIndex),
                    removed.removed as MenuItemType,
                    ...children.slice(destinationIndex),
                ]
            );
            onChange(inserted);
            setExpandedState((prev) => ({ ...prev, [destinationContainerId]: true }));
            return;
        }

        if (overData.type === 'container') {
            const destinationContainerId = overData.containerId;

            if (sourceContainerId === destinationContainerId) {
                const reordered = updateChildrenForContainer(items, sourceContainerId, (children) => {
                    if (sourceIndex === children.length - 1) return children;
                    return arrayMove(children, sourceIndex, children.length - 1);
                });
                onChange(reordered);
                return;
            }

            const draggedItem = findItemById(items, activeData.itemId);
            if (!draggedItem || isDescendantContainer(draggedItem, destinationContainerId)) return;

            const destinationDepth =
                destinationContainerId === ROOT_CONTAINER
                    ? 0
                    : (getItemDepth(items, destinationContainerId) ?? 0) + 1;

            if (destinationDepth + getSubtreeDepth(draggedItem) > maxDepth - 1) return;

            const removed = removeItemFromTree(items, activeData.itemId);
            if (!removed.removed) return;

            const inserted = updateChildrenForContainer(
                removed.nextItems,
                destinationContainerId,
                (children) => [...children, removed.removed as MenuItemType]
            );
            onChange(inserted);
            setExpandedState((prev) => ({ ...prev, [destinationContainerId]: true }));
        }
    };

    const renderContainer = (containerId: string, depth: number): ReactNode => {
        const children = getChildrenForContainer(items, containerId);

        return (
            <ContainerDropZone
                containerId={containerId}
                depth={depth}
                label={containerId === ROOT_CONTAINER ? 'Root Menu Structure' : 'Nested Items'}
                itemCount={children.length}
            >
                <SortableContext items={children.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <Box>
                        {children.map((child) => (
                            <SortableMenuCard
                                key={child.id}
                                item={child}
                                depth={depth}
                                maxDepth={maxDepth}
                                containerId={containerId}
                                expanded={expandedState[child.id] ?? true}
                                storeId={storeId}
                                onToggleExpand={toggleExpanded}
                                onEdit={handleEditItem}
                                onDelete={handleDeleteItem}
                                onAddChild={handleAddChild}
                                onUpdateItem={handleUpdateItem}
                                renderChildren={renderContainer}
                            />
                        ))}
                    </Box>
                </SortableContext>
            </ContainerDropZone>
        );
    };

    if (!storeId) {
        return (
            <Alert severity="warning" sx={{ mt: 2 }}>
                Please select a store first to manage menu items.
            </Alert>
        );
    }

    return (
        <Paper
            sx={(theme) => ({
                mt: 2,
                p: { xs: 1.5, md: 2 },
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${theme.palette.background.paper} 42%)`,
            })}
        >
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                sx={{ mb: 2 }}
            >
                <Box>
                    <Typography variant="h6" fontWeight={800}>
                        Menu Structure Designer
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                        <Typography variant="body2" color="text.secondary">
                            Drag and drop between root and nested sections.
                        </Typography>
                        <Chip size="small" label={`${itemCount} total items`} variant="outlined" />
                        <Chip size="small" label={`Max depth ${maxDepth}`} />
                    </Stack>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={handleAddItem}>
                        Add Item
                    </Button>
                </Stack>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {items.length === 0 ? (
                <Box
                    sx={{
                        py: 6,
                        borderRadius: 3,
                        border: '1px dashed',
                        borderColor: 'divider',
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="subtitle1" fontWeight={700}>
                        No menu items yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Create your first item and build nested menu sections with drag and drop.
                    </Typography>
                    <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={handleAddItem}>
                        Add First Item
                    </Button>
                </Box>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                    {renderContainer(ROOT_CONTAINER, 0)}
                </DndContext>
            )}

            <EditItemDialog
                key={`${editDialog.open ? 'open' : 'closed'}-${editDialog.item?.id || 'new'}-${editDialog.parentId || 'root'}`}
                open={editDialog.open}
                item={editDialog.item}
                isNew={editDialog.isNew}
                storeId={storeId}
                onSave={handleSaveItem}
                onDelete={handleDeleteItem}
                onClose={() => setEditDialog({ open: false, item: null, isNew: false })}
            />
        </Paper>
    );
}
