'use client';

import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Box,
    Button,
    IconButton,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControlLabel,
    Switch,
    Collapse,
    Chip,
    Tooltip,
    Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LinkIcon from '@mui/icons-material/Link';
import CategoryIcon from '@mui/icons-material/Category';
import InventoryIcon from '@mui/icons-material/Inventory';
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleIcon from '@mui/icons-material/Article';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import RemoveIcon from '@mui/icons-material/Remove';
import { MenuItem as MenuItemType } from '@/types';
import CategoryAutocomplete from '@/components/molecules/CategoryAutocomplete';
import PageAutocomplete from '@/components/molecules/PageAutocomplete';
import BlogCategoryAutocomplete from '@/components/molecules/BlogCategoryAutocomplete';
import { v4 as uuidv4 } from 'uuid';
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

const menuItemTypes = [
    { value: 'link', label: 'Custom Link', icon: <LinkIcon fontSize="small" /> },
    { value: 'category', label: 'Product Category', icon: <CategoryIcon fontSize="small" /> },
    { value: 'product', label: 'Product', icon: <InventoryIcon fontSize="small" /> },
    { value: 'page', label: 'Static Page', icon: <DescriptionIcon fontSize="small" /> },
    { value: 'blog-category', label: 'Blog Category', icon: <ArticleIcon fontSize="small" /> },
    { value: 'mega-menu', label: 'Mega Menu', icon: <ViewModuleIcon fontSize="small" /> },
    { value: 'divider', label: 'Divider', icon: <RemoveIcon fontSize="small" /> },
];

const getTypeIcon = (type: string) => {
    const typeConfig = menuItemTypes.find(t => t.value === type);
    return typeConfig?.icon || <LinkIcon fontSize="small" />;
};

const getTypeLabel = (type: string) => {
    const typeConfig = menuItemTypes.find(t => t.value === type);
    return typeConfig?.label || type;
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

function EditItemDialog({ open, item, onClose, onSave, onDelete, storeId, isNew = false }: EditItemDialogProps) {
    const [formData, setFormData] = useState<Partial<MenuItemType>>({
        label: '',
        type: 'link',
        url: '',
        openInNewTab: false,
        icon: '',
    });

    const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);

    // Reset form data whenever dialog opens or item changes
    useEffect(() => {
        if (open) {
            if (item) {
                // Editing existing item - populate form with item data
                setFormData({
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
                });

                // If it's a product type, we should set selectedProduct
                // Note: We don't have the full product data here, just the ID
                // The ProductAutocomplete should handle loading by ID if needed
                if (item.type === 'product' && item.productId) {
                    // The autocomplete will need to fetch the product by ID
                    // For now, set to null and let the autocomplete handle it via value prop
                    setSelectedProduct(null);
                }
            } else {
                // Creating new item - reset to defaults
                setFormData({
                    label: '',
                    type: 'link',
                    url: '',
                    openInNewTab: false,
                    icon: '',
                });
                setSelectedProduct(null);
            }
        }
    }, [open, item]);

    const handleTypeChange = (newType: string) => {
        setFormData(prev => ({
            ...prev,
            type: newType as MenuItemType['type'],
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
        const newItem: MenuItemType = {
            id: item?.id || uuidv4(),
            label: formData.label || 'Menu Item',
            type: formData.type || 'link',
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
            megaMenu: item?.megaMenu, // Preserve mega menu data
        };
        onSave(newItem);
        onClose();
    };

    const handleDelete = () => {
        if (item) {
            onDelete(item.id);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{isNew ? 'Add Menu' : 'Edit Menu'}</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        select
                        label="Item Type"
                        value={formData.type || 'link'}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        fullWidth
                    >
                        {menuItemTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                                <Box display="flex" alignItems="center" gap={1}>
                                    {type.icon}
                                    {type.label}
                                </Box>
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Label"
                        value={formData.label || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                        fullWidth
                        required
                        placeholder="e.g., About Us, Shop, Contact"
                    />

                    {formData.type === 'link' && (
                        <TextField
                            label="URL"
                            value={formData.url || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                            fullWidth
                            placeholder="https://example.com or /relative/path"
                        />
                    )}

                    {formData.type === 'category' && (
                        <CategoryAutocomplete
                            value={formData.categoryId || null}
                            onChange={(value, category) => {
                                const cat = Array.isArray(category) ? category[0] : category;
                                setFormData(prev => ({
                                    ...prev,
                                    categoryId: value || undefined,
                                    categorySlug: cat?.slug || undefined
                                }));
                            }}
                            storeId={storeId}
                            label="Select Category"
                        />
                    )}

                    {formData.type === 'product' && (
                        <ProductAutoComplete
                            storeId={storeId}
                            value={selectedProduct}
                            onChange={(product) => {
                                setSelectedProduct(product);
                                setFormData(prev => ({
                                    ...prev,
                                    productId: product?._id,
                                    productSlug: product?.slug
                                }));
                            }}
                            label="Select Product"
                        />
                    )}

                    {formData.type === 'page' && (
                        <PageAutocomplete
                            value={formData.pageId || null}
                            onChange={(value, page) => setFormData(prev => ({
                                ...prev,
                                pageId: value || undefined,
                                pageSlug: page?.slug || undefined
                            }))}
                            storeId={storeId}
                            label="Select Page"
                        />
                    )}

                    {formData.type === 'blog-category' && (
                        <BlogCategoryAutocomplete
                            value={formData.blogCategoryId || null}
                            onChange={(value, category) => {
                                const cat = Array.isArray(category) ? category[0] : category;
                                setFormData(prev => ({
                                    ...prev,
                                    blogCategoryId: (value as string | null) || undefined,
                                    blogCategorySlug: cat?.slug || undefined
                                }));
                            }}
                            storeId={storeId}
                            label="Select Blog Category"
                        />
                    )}

                    {formData.type !== 'divider' && (
                        <>
                            <TextField
                                label="Icon (optional)"
                                value={formData.icon || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                                fullWidth
                                placeholder="Icon name or URL"
                                helperText="Enter an icon name or URL"
                            />

                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.openInNewTab || false}
                                        onChange={(e) => setFormData(prev => ({ ...prev, openInNewTab: e.target.checked }))}
                                    />
                                }
                                label="Open in new tab"
                            />
                        </>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
                <Box>
                    {!isNew && (
                        <Button color="error" onClick={handleDelete}>
                            Delete
                        </Button>
                    )}
                </Box>
                <Box>
                    <Button onClick={onClose} sx={{ mr: 1 }}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={!formData.label}>
                        {isNew ? 'Add Menu' : 'Save Changes'}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}

interface SortableMenuItemRowProps {
    item: MenuItemType;
    depth: number;
    maxDepth: number;
    storeId: string;
    onEdit: (item: MenuItemType) => void;
    onDelete: (itemId: string) => void;
    onAddChild: (parentId: string) => void;
    onReorderChildren: (parentId: string, oldIndex: number, newIndex: number) => void;
    onUpdateItem: (item: MenuItemType) => void;
}

function SortableMenuItemRow({
    item,
    depth,
    maxDepth,
    storeId,
    onEdit,
    onDelete,
    onAddChild,
    onReorderChildren,
    onUpdateItem,
}: SortableMenuItemRowProps) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = item.children && item.children.length > 0;
    const canAddChildren = depth < maxDepth - 1;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleChildDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = item.children.findIndex(c => c.id === active.id);
            const newIndex = item.children.findIndex(c => c.id === over.id);
            onReorderChildren(item.id, oldIndex, newIndex);
        }
    };

    return (
        <Box ref={setNodeRef} style={style}>
            <ListItem
                sx={{
                    pl: depth * 3 + 1,
                    borderLeft: depth > 0 ? '2px solid' : 'none',
                    borderColor: 'divider',
                    ml: depth > 0 ? 2 : 0,
                    bgcolor: isDragging ? 'action.selected' : (depth % 2 === 0 ? 'background.paper' : 'action.hover'),
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': {
                        bgcolor: 'action.hover',
                    },
                }}
            >
                <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box
                        {...attributes}
                        {...listeners}
                        sx={{
                            cursor: 'grab',
                            display: 'flex',
                            alignItems: 'center',
                            '&:active': { cursor: 'grabbing' }
                        }}
                    >
                        <DragIndicatorIcon fontSize="small" color="action" />
                    </Box>
                </ListItemIcon>
                <ListItemIcon sx={{ minWidth: 36 }}>
                    {getTypeIcon(item.type)}
                </ListItemIcon>
                <ListItemText
                    primary={
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" fontWeight={500}>
                                {item.label}
                            </Typography>
                            <Chip label={getTypeLabel(item.type)} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                            {item.openInNewTab && (
                                <Chip label="New Tab" size="small" color="info" sx={{ height: 20, fontSize: '0.65rem' }} />
                            )}
                        </Box>
                    }
                    secondary={
                        item.type === 'link' ? item.url :
                            item.type === 'divider' ? '---' :
                                `ID: ${item.categoryId || item.productId || item.pageId || item.blogCategoryId || '-'}`
                    }
                />
                <ListItemSecondaryAction>
                    {hasChildren && (
                        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                    )}
                    {canAddChildren && item.type !== 'divider' && item.type !== 'mega-menu' && (
                        <Tooltip title="Add child item">
                            <IconButton size="small" onClick={() => onAddChild(item.id)} color="primary">
                                <AddIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(item)}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => onDelete(item.id)} color="error">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </ListItemSecondaryAction>
            </ListItem>

            {/* For mega-menu type, show MegaMenuBuilder instead of children */}
            {item.type === 'mega-menu' && (
                <Collapse in={expanded}>
                    <Box sx={{ pl: depth * 3 + 5, pr: 2, py: 2 }}>
                        <MegaMenuBuilder
                            data={{
                                sections: item.megaMenu?.sections || [],
                            }}
                            onChange={(megaData: MegaMenuData) => {
                                onUpdateItem({
                                    ...item,
                                    megaMenu: {
                                        sections: megaData.sections,
                                    },
                                });
                            }}
                            storeId={storeId}
                        />
                    </Box>
                </Collapse>
            )}

            {hasChildren && item.type !== 'mega-menu' && (
                <Collapse in={expanded}>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleChildDragEnd}
                    >
                        <SortableContext
                            items={item.children.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <List disablePadding>
                                {item.children.map((child) => (
                                    <SortableMenuItemRow
                                        key={child.id}
                                        item={child}
                                        depth={depth + 1}
                                        maxDepth={maxDepth}
                                        storeId={storeId}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onAddChild={onAddChild}
                                        onReorderChildren={onReorderChildren}
                                        onUpdateItem={onUpdateItem}
                                    />
                                ))}
                            </List>
                        </SortableContext>
                    </DndContext>
                </Collapse>
            )}
        </Box>
    );
}

export default function MenuItemBuilder({ items, onChange, storeId, maxDepth = 3 }: MenuItemBuilderProps) {
    const [editDialog, setEditDialog] = useState<{ open: boolean; item: MenuItemType | null; isNew: boolean; parentId?: string }>({
        open: false,
        item: null,
        isNew: false,
    });
    const { confirm } = useConfirm();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);
            onChange(arrayMove(items, oldIndex, newIndex));
        }
    };

    const handleReorderChildren = (parentId: string, oldIndex: number, newIndex: number) => {
        const reorder = (items: MenuItemType[]): MenuItemType[] => {
            return items.map(i => {
                if (i.id === parentId) {
                    return { ...i, children: arrayMove(i.children, oldIndex, newIndex) };
                }
                if (i.children && i.children.length > 0) {
                    return { ...i, children: reorder(i.children) };
                }
                return i;
            });
        };
        onChange(reorder(items));
    };

    const handleAddItem = () => {
        setEditDialog({ open: true, item: null, isNew: true });
    };

    const handleAddChild = (parentId: string) => {
        setEditDialog({ open: true, item: null, isNew: true, parentId });
    };

    const handleEditItem = (item: MenuItemType) => {
        setEditDialog({ open: true, item, isNew: false });
    };

    const handleSaveItem = (item: MenuItemType) => {
        if (editDialog.isNew) {
            if (editDialog.parentId) {
                const addToParent = (items: MenuItemType[]): MenuItemType[] => {
                    return items.map(i => {
                        if (i.id === editDialog.parentId) {
                            return { ...i, children: [...(i.children || []), item] };
                        }
                        if (i.children && i.children.length > 0) {
                            return { ...i, children: addToParent(i.children) };
                        }
                        return i;
                    });
                };
                onChange(addToParent(items));
            } else {
                onChange([...items, item]);
            }
        } else {
            const updateItem = (items: MenuItemType[]): MenuItemType[] => {
                return items.map(i => {
                    if (i.id === item.id) {
                        return { ...item, children: i.children };
                    }
                    if (i.children && i.children.length > 0) {
                        return { ...i, children: updateItem(i.children) };
                    }
                    return i;
                });
            };
            onChange(updateItem(items));
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!await confirm({ title: 'Delete Menu Item', message: 'Delete this menu item?', severity: 'error' })) return;

        const removeItem = (items: MenuItemType[]): MenuItemType[] => {
            return items
                .filter(i => i.id !== itemId)
                .map(i => ({
                    ...i,
                    children: i.children ? removeItem(i.children) : [],
                }));
        };
        onChange(removeItem(items));
    };

    // Update a specific item (for mega menu builder)
    const handleUpdateItem = (updatedItem: MenuItemType) => {
        const updateItem = (items: MenuItemType[]): MenuItemType[] => {
            return items.map(i => {
                if (i.id === updatedItem.id) {
                    return updatedItem;
                }
                if (i.children && i.children.length > 0) {
                    return { ...i, children: updateItem(i.children) };
                }
                return i;
            });
        };
        onChange(updateItem(items));
    };

    if (!storeId) {
        return (
            <Alert severity="warning" sx={{ mt: 2 }}>
                Please select a store first to manage menu items.
            </Alert>
        );
    }

    return (
        <Paper sx={{ p: 2, mt: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                        Menu Items ({items.length})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Drag items to reorder
                    </Typography>
                </Box>
                <Button
                    startIcon={<AddIcon />}
                    variant="outlined"
                    size="small"
                    onClick={handleAddItem}
                >
                    Add Menu
                </Button>
            </Box>

            {items.length === 0 ? (
                <Box textAlign="center" py={4}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        No menu items yet
                    </Typography>
                    <Button startIcon={<AddIcon />} variant="contained" onClick={handleAddItem}>
                        Add First Menu
                    </Button>
                </Box>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={items.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <List disablePadding>
                            {items.map((item) => (
                                <SortableMenuItemRow
                                    key={item.id}
                                    item={item}
                                    depth={0}
                                    maxDepth={maxDepth}
                                    storeId={storeId}
                                    onEdit={handleEditItem}
                                    onDelete={handleDeleteItem}
                                    onAddChild={handleAddChild}
                                    onReorderChildren={handleReorderChildren}
                                    onUpdateItem={handleUpdateItem}
                                />
                            ))}
                        </List>
                    </SortableContext>
                </DndContext>
            )}

            <EditItemDialog
                open={editDialog.open}
                item={editDialog.item}
                onClose={() => setEditDialog({ open: false, item: null, isNew: false })}
                onSave={handleSaveItem}
                onDelete={handleDeleteItem}
                storeId={storeId}
                isNew={editDialog.isNew}
            />
        </Paper>
    );
}
