'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Switch,
    FormControlLabel,
    TextField,
    Button,
    IconButton,
    Divider,
    Tooltip,
    Collapse,
    Menu,
    MenuItem as MuiMenuItem,
    ListItemIcon,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { ColorPicker } from '@/components/atoms';
import IconPicker from '@/components/atoms/IconPicker';
import DynamicIcon from '@/components/atoms/DynamicIcon';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Settings as SettingsIcon,
    Image as LogoIcon,
    Menu as MenuIcon,
    Search as SearchIcon,
    ShoppingCart as CartIcon,
    AccountCircle as AccountIcon,
    Favorite as WishlistIcon,
    Code as CodeIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    ShoppingBag as ShoppingBagIcon,
    LocalMall as LocalMallIcon,
    DragIndicator as DragIndicatorIcon,
    Edit as EditIcon,
    AttachMoney as CurrencyIcon,
} from '@mui/icons-material';
import { DndContext, DragEndEvent, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import { ThemeConfig, HeaderElement, HeaderTopBarItem, Menu as MenuType, HeaderRow } from '@/types';
import HeaderElementConfig from './HeaderElementConfig';
import PreviewContainer from '@/components/molecules/PreviewContainer';
import api from '@/lib/api';

interface HeaderDesignerProps {
    config: ThemeConfig;
    onChange: (config: ThemeConfig) => void;
    storeId: string;
}

const ALL_VIEWPORTS: Array<'desktop' | 'tablet' | 'mobile'> = ['desktop', 'tablet', 'mobile'];
const MAX_TOP_BAR_ITEMS = 5;

// Element info
const elementInfo: Record<string, { label: string; icon: React.ReactNode; description: string }> = {
    'logo': { label: 'Logo', icon: <LogoIcon />, description: 'Store logo' },
    'menu': { label: 'Menu', icon: <MenuIcon />, description: 'Navigation menu' },
    'search': { label: 'Search', icon: <SearchIcon />, description: 'Search bar' },
    'cart': { label: 'Cart', icon: <CartIcon />, description: 'Shopping cart' },
    'account': { label: 'Account', icon: <AccountIcon />, description: 'User account' },
    'wishlist': { label: 'Wishlist', icon: <WishlistIcon />, description: 'Wishlist' },
    'currency': { label: 'Currency', icon: <CurrencyIcon />, description: 'Currency selector' },
    'custom': { label: 'Custom', icon: <CodeIcon />, description: 'Custom HTML' },
};

// Sortable Element
function SortableElement({ element, onClick, onDelete, menus }: {
    element: HeaderElement;
    onClick: () => void;
    onDelete: () => void;
    menus: MenuType[];
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: element.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const info = elementInfo[element.type];

    const renderElement = () => {
        switch (element.type) {
            case 'logo':
                return element.settings?.logoUrl ? (
                    <Box
                        component="img"
                        src={element.settings.logoUrl}
                        alt={element.settings?.logoAlt || 'Logo'}
                        sx={{ height: element.settings?.logoHeight || 40, maxWidth: 150, objectFit: 'contain' }}
                    />
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <LogoIcon />
                        <Typography variant="body2">Logo</Typography>
                    </Box>
                );
            case 'menu':
                const selectedMenu = Array.isArray(menus) ? menus.find(m => m._id === element.menuId) : null;
                return (
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {selectedMenu ? (
                            selectedMenu.items?.slice(0, 4).map((item, i) => (
                                <Typography key={i} variant="body2" sx={{ cursor: 'default' }}>
                                    {item.label}
                                </Typography>
                            ))
                        ) : (
                            ['Home', 'Shop', 'About', 'Contact'].map((item) => (
                                <Typography key={item} variant="body2" sx={{ cursor: 'default', color: 'text.secondary' }}>
                                    {item}
                                </Typography>
                            ))
                        )}
                    </Box>
                );
            case 'search':
                return (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            px: 1.5,
                            py: 0.5,
                            minWidth: 180,
                            bgcolor: 'background.paper',
                        }}
                    >
                        <SearchIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            {element.settings?.searchPlaceholder || 'Search...'}
                        </Typography>
                    </Box>
                );
            case 'cart':
                const CartIconComponent = element.settings?.cartIconStyle === 'bag' ? ShoppingBagIcon :
                    element.settings?.cartIconStyle === 'basket' ? LocalMallIcon : CartIcon;
                return (
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <CartIconComponent />
                        {element.settings?.showCartCount !== false && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    bgcolor: 'primary.main',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: 18,
                                    height: 18,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 10,
                                }}
                            >
                                3
                            </Box>
                        )}
                    </Box>
                );
            case 'account':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountIcon />
                        {element.settings?.showLoginRegister !== false && (
                            <Typography variant="body2">
                                {element.settings?.loginText || 'Login'}
                            </Typography>
                        )}
                    </Box>
                );
            case 'wishlist':
                return <WishlistIcon />;
            case 'custom':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <CodeIcon fontSize="small" />
                        <Typography variant="caption">Custom</Typography>
                    </Box>
                );
            case 'currency':
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <CurrencyIcon fontSize="small" />
                        <Typography variant="body2">USD</Typography>
                    </Box>
                );
            default:
                return <Typography variant="body2">{info?.label}</Typography>;
        }
    };

    return (
        <Tooltip title={`Drag to reorder • Click to configure`}>
            <Box
                ref={setNodeRef}
                style={style}
                sx={{
                    position: 'relative',
                    cursor: 'grab',
                    p: 1,
                    borderRadius: 1,
                    border: '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    transition: 'all 0.2s',
                    '&:hover': {
                        border: '2px dashed',
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                        '& .element-actions': {
                            opacity: 1,
                        },
                    },
                }}
            >
                <Box {...attributes} {...listeners} sx={{ cursor: 'grab', display: 'flex' }}>
                    <DragIndicatorIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </Box>
                <Box onClick={onClick}>{renderElement()}</Box>
                <Box
                    className="element-actions"
                    sx={{
                        position: 'absolute',
                        top: -12,
                        right: -12,
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        display: 'flex',
                        gap: 0.5,
                    }}
                >
                    <IconButton
                        size="small"
                        sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                    >
                        <SettingsIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                        size="small"
                        sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>
        </Tooltip>
    );
}

export default function HeaderDesigner({ config, onChange, storeId }: HeaderDesignerProps) {
    const [editingElement, setEditingElement] = useState<{ sectionId: string; element: HeaderElement; rowId: string } | null>(null);
    const [settingsExpanded, setSettingsExpanded] = useState(true);
    const [topBarExpanded, setTopBarExpanded] = useState(false);
    const [addMenuAnchor, setAddMenuAnchor] = useState<{ anchor: HTMLElement; section: 'left' | 'center' | 'right'; rowId: string } | null>(null);
    const [settingsRowId, setSettingsRowId] = useState<string | null>(null);
    const [menus, setMenus] = useState<MenuType[]>([]);

    // Fetch menus
    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const response = await api.get(`/menus?store=${storeId}`);
                const data = response.data.menus || response.data;
                setMenus(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to fetch menus:', error);
            }
        };
        fetchMenus();
    }, [storeId]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const rawHeaderConfig = config.header || {
        main: {
            layout: 'default',
            rows: [
                {
                    id: uuidv4(),
                    order: 0,
                    sections: [
                        { id: 'left', position: 'left', items: [] },
                        { id: 'center', position: 'center', items: [] },
                        { id: 'right', position: 'right', items: [] },
                    ],
                },
            ],
        },
    };
    const headerConfig = {
        ...rawHeaderConfig,
        main: {
            ...rawHeaderConfig.main,
            rows: rawHeaderConfig.main.rows || [
                {
                    id: uuidv4(),
                    order: 0,
                    sections: rawHeaderConfig.main.sections || [
                        { id: 'left', position: 'left' as const, items: [] },
                        { id: 'center', position: 'center' as const, items: [] },
                        { id: 'right', position: 'right' as const, items: [] },
                    ],
                },
            ],
        },
    };

    const topBar = headerConfig.topBar || {
        enabled: false,
        backgroundColor: config.colors?.secondary || '#1a1a1a',
        textColor: config.colors?.background || '#ffffff',
        height: 40,
        items: [],
    };
    const defaultTopBarItem: HeaderTopBarItem = {
        id: 'topbar-text',
        type: 'block',
        content: 'Free shipping on orders over $50',
        icon: '',
        position: 'center',
        order: 0,
        visibleOn: [...ALL_VIEWPORTS],
    };
    const topBarItems: HeaderTopBarItem[] = (topBar.items?.length ? topBar.items : [defaultTopBarItem])
        .slice(0, MAX_TOP_BAR_ITEMS)
        .map((item, index) => ({
            ...item,
            type: item.type === 'text' ? 'block' : item.type,
            content: item.content || item.label || '',
            position: item.position || 'center',
            order: item.order ?? index,
            visibleOn: item.visibleOn && item.visibleOn.length > 0 ? item.visibleOn : [...ALL_VIEWPORTS],
        }));

    const mobileMenu = headerConfig.mobileMenu || {
        enabled: false,
        menuId: '',
    };

    // Toggle top bar
    const handleToggleTopBar = (enabled: boolean) => {
        onChange({
            ...config,
            header: {
                ...headerConfig,
                topBar: { ...topBar, enabled, items: topBarItems },
            },
        });
    };

    // Update top bar settings
    const handleUpdateTopBar = (updates: Partial<typeof topBar>) => {
        onChange({
            ...config,
            header: {
                ...headerConfig,
                topBar: { ...topBar, ...updates },
            },
        });
    };

    const handleUpdateTopBarItems = (items: HeaderTopBarItem[]) => {
        handleUpdateTopBar({
            items: items
                .slice(0, MAX_TOP_BAR_ITEMS)
                .map((item, index) => ({ ...item, order: index })),
        });
    };

    const handleAddTopBarItem = () => {
        if (topBarItems.length >= MAX_TOP_BAR_ITEMS) return;

        handleUpdateTopBarItems([
            ...topBarItems,
            {
                id: uuidv4(),
                type: 'block',
                content: '',
                icon: '',
                position: 'center',
                order: topBarItems.length,
                visibleOn: [...ALL_VIEWPORTS],
            },
        ]);
        setTopBarExpanded(true);
    };

    const handleUpdateTopBarItem = (itemId: string, updates: Partial<HeaderTopBarItem>) => {
        handleUpdateTopBarItems(
            topBarItems.map(item => item.id === itemId ? { ...item, ...updates } : item)
        );
    };

    const handleRemoveTopBarItem = (itemId: string) => {
        const nextItems = topBarItems.filter(item => item.id !== itemId);
        handleUpdateTopBarItems(nextItems.length > 0 ? nextItems : [defaultTopBarItem]);
    };

    const handleToggleTopBarItemViewport = (itemId: string, viewport: 'desktop' | 'tablet' | 'mobile') => {
        const item = topBarItems.find(topBarItem => topBarItem.id === itemId);
        if (!item) return;

        const visibleOn = item.visibleOn && item.visibleOn.length > 0 ? item.visibleOn : ALL_VIEWPORTS;
        const nextVisibleOn = visibleOn.includes(viewport)
            ? visibleOn.filter(value => value !== viewport)
            : [...visibleOn, viewport];

        if (nextVisibleOn.length === 0) return;
        handleUpdateTopBarItem(itemId, { visibleOn: nextVisibleOn });
    };

    // Update main header settings
    const handleUpdateMainHeader = (updates: Partial<typeof headerConfig.main>) => {
        const normalizedUpdates = { ...updates };
        if (normalizedUpdates.rows) {
            normalizedUpdates.rows = normalizedUpdates.rows.map(row => ({
                ...row,
                visibleOn: row.visibleOn && row.visibleOn.length > 0 ? row.visibleOn : [...ALL_VIEWPORTS],
            }));
        }

        onChange({
            ...config,
            header: {
                ...headerConfig,
                main: { ...headerConfig.main, ...normalizedUpdates },
            },
        });
    };

    // Update mobile menu settings
    const handleUpdateMobileMenu = (updates: Partial<typeof mobileMenu>) => {
        onChange({
            ...config,
            header: {
                ...headerConfig,
                mobileMenu: { ...mobileMenu, ...updates },
            },
        });
    };

    // Update a single row in main header
    const handleUpdateRow = (rowId: string, updates: Partial<HeaderRow>) => {
        const updatedRows = headerConfig.main.rows.map(row =>
            row.id === rowId ? { ...row, ...updates } : row
        );
        handleUpdateMainHeader({ rows: updatedRows });
    };

    // Toggle row visibility for a specific viewport
    const handleToggleRowViewport = (rowId: string, viewport: 'desktop' | 'tablet' | 'mobile') => {
        const row = headerConfig.main.rows.find(r => r.id === rowId);
        if (!row) return;

        const currentVisibleOn = row.visibleOn && row.visibleOn.length > 0 ? row.visibleOn : ALL_VIEWPORTS;
        const isEnabled = currentVisibleOn.includes(viewport);

        const nextVisibleOn = isEnabled
            ? currentVisibleOn.filter(v => v !== viewport)
            : [...currentVisibleOn, viewport];

        // Keep at least one viewport enabled
        if (nextVisibleOn.length === 0) return;

        handleUpdateRow(rowId, { visibleOn: nextVisibleOn });
    };

    // Add element to section in a row
    const handleAddElement = (rowId: string, sectionPosition: 'left' | 'center' | 'right', elementType: HeaderElement['type']) => {
        const newElement: HeaderElement = {
            id: uuidv4(),
            type: elementType,
            order: 0,
        };

        const updatedRows = headerConfig.main.rows.map(row => {
            if (row.id === rowId) {
                return {
                    ...row,
                    sections: row.sections.map(section =>
                        section.position === sectionPosition
                            ? { ...section, items: [...section.items, newElement] }
                            : section
                    ),
                };
            }
            return row;
        });

        handleUpdateMainHeader({ rows: updatedRows });
        setAddMenuAnchor(null);
        setEditingElement({ sectionId: sectionPosition, rowId, element: newElement });
    };

    // Delete element from a row section
    const handleDeleteElement = (rowId: string, sectionPosition: string, elementId: string) => {
        const updatedRows = headerConfig.main.rows.map(row => {
            if (row.id === rowId) {
                return {
                    ...row,
                    sections: row.sections.map(section =>
                        section.position === sectionPosition
                            ? { ...section, items: section.items.filter(item => item.id !== elementId) }
                            : section
                    ),
                };
            }
            return row;
        });
        handleUpdateMainHeader({ rows: updatedRows });
    };

    // Save edited element
    const handleSaveElement = (updatedElement: HeaderElement) => {
        if (!editingElement) return;

        const updatedRows = headerConfig.main.rows.map(row => {
            if (row.id === editingElement.rowId) {
                return {
                    ...row,
                    sections: row.sections.map(section =>
                        section.position === editingElement.sectionId
                            ? {
                                ...section,
                                items: section.items.map(item =>
                                    item.id === updatedElement.id ? updatedElement : item
                                ),
                            }
                            : section
                    ),
                };
            }
            return row;
        });
        handleUpdateMainHeader({ rows: updatedRows });
        setEditingElement(null);
    };

    // Add new row
    const handleAddRow = () => {
        const newRow = {
            id: uuidv4(),
            order: headerConfig.main.rows.length,
            visibleOn: [...ALL_VIEWPORTS],
            sections: [
                { id: 'left', position: 'left' as const, items: [] },
                { id: 'center', position: 'center' as const, items: [] },
                { id: 'right', position: 'right' as const, items: [] },
            ],
        };
        handleUpdateMainHeader({ rows: [...headerConfig.main.rows, newRow] });
    };

    // Remove row
    const handleRemoveRow = (rowId: string) => {
        if (headerConfig.main.rows.length <= 1) {
            alert('Cannot remove the last row. At least one row must exist.');
            return;
        }
        const updatedRows = headerConfig.main.rows
            .filter(row => row.id !== rowId)
            .map((row, index) => ({ ...row, order: index }));
        handleUpdateMainHeader({ rows: updatedRows });
    };

    // Handle drag end for reordering
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        let activeSectionId = '';
        let overSectionId = '';
        let activeItemIndex = -1;
        let overItemIndex = -1;

        // Find active and over sections across all rows
        headerConfig.main.rows.forEach(row => {
            row.sections.forEach(section => {
                const aIndex = section.items?.findIndex(item => item && item.id === active.id) ?? -1;
                if (aIndex !== -1) {
                    activeSectionId = section.id;
                    activeItemIndex = aIndex;
                }
                const oIndex = section.items?.findIndex(item => item && item.id === over.id) ?? -1;
                if (oIndex !== -1) {
                    overSectionId = section.id;
                    overItemIndex = oIndex;
                }
            });
        });

        if (activeSectionId && overSectionId) {
            if (activeSectionId === overSectionId) {
                // Same section reorder
                const updatedRows = headerConfig.main.rows.map(row => ({
                    ...row,
                    sections: row.sections.map(s =>
                        s.id === activeSectionId
                            ? { ...s, items: arrayMove(s.items || [], activeItemIndex, overItemIndex) }
                            : s
                    ),
                }));
                handleUpdateMainHeader({ rows: updatedRows });
            } else {
                // Cross section move
                let activeItem: HeaderElement | null = null;

                const updatedRows = headerConfig.main.rows.map(row => ({
                    ...row,
                    sections: row.sections.map(s => {
                        if (s.id === activeSectionId) {
                            const item = s.items?.find(item => item && item.id === active.id);
                            if (item) activeItem = item;
                            return { ...s, items: (s.items || []).filter(item => item && item.id !== active.id) };
                        }
                        if (s.id === overSectionId) {
                            const newItems = [...(s.items || [])];
                            if (activeItem) {
                                newItems.splice(overItemIndex, 0, activeItem);
                            }
                            return { ...s, items: newItems };
                        }
                        return s;
                    }),
                }));
                handleUpdateMainHeader({ rows: updatedRows });
            }
        }
    };

    const renderSection = (rowId: string, position: 'left' | 'center' | 'right', justify: string) => {
        const row = headerConfig.main.rows.find(r => r.id === rowId);
        if (!row) return null;
        const section = row.sections.find(s => s.position === position);
        const items = section?.items?.filter(item => item && item.id) || [];

        return (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: justify, gap: 1 }}>
                <SortableContext items={items.map(i => i.id)} strategy={horizontalListSortingStrategy}>
                    {items.map((item) => (
                        <SortableElement
                            key={item.id}
                            element={item}
                            menus={menus}
                            onClick={() => setEditingElement({ sectionId: position, element: item, rowId })}
                            onDelete={() => handleDeleteElement(rowId, position, item.id)}
                        />
                    ))}
                </SortableContext>
                <Tooltip title="Add element">
                    <IconButton
                        size="small"
                        onClick={(e) => setAddMenuAnchor({ anchor: e.currentTarget, section: position, rowId })}
                        sx={{ border: '1px dashed', borderColor: 'divider' }}
                    >
                        <AddIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        );
    };

    const activeSettingsRow = settingsRowId
        ? headerConfig.main.rows.find(row => row.id === settingsRowId) || null
        : null;

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Box>
                {/* Live Preview Section */}
                <PreviewContainer
                    title="Header Preview"
                    subtitle="Drag elements to reorder • Click to configure • Hover for actions"
                >
                    <Box sx={{ width: '100%' }}>
                        {/* Top Bar Preview */}
                        {topBar.enabled && (
                            <Box
                                sx={{
                                    bgcolor: topBar.backgroundColor,
                                    color: topBar.textColor,
                                    height: topBar.height,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 3,
                                    px: 3,
                                    position: 'relative',
                                    '&:hover .topbar-edit': { opacity: 1 },
                                }}
                            >
                                {topBarItems.map((item) => (
                                    <Box
                                        key={item.id}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 0.75,
                                            whiteSpace: 'nowrap',
                                            opacity: item.visibleOn?.length ? 1 : 0.5,
                                        }}
                                    >
                                        {item.icon && <DynamicIcon name={item.icon} size={14} color={topBar.textColor} />}
                                        <Typography variant="caption">{item.content || 'Top bar block'}</Typography>
                                    </Box>
                                ))}
                                <IconButton
                                    className="topbar-edit"
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        right: 8,
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        color: topBar.textColor,
                                    }}
                                    onClick={() => setTopBarExpanded(!topBarExpanded)}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        )}

                        {/* Top Bar Editor */}
                        <Collapse in={topBarExpanded && topBar.enabled}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="subtitle2">Top Bar Blocks</Typography>
                                    <Button
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={handleAddTopBarItem}
                                        disabled={topBarItems.length >= MAX_TOP_BAR_ITEMS}
                                    >
                                        Add Block
                                    </Button>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {topBarItems.map((item, index) => {
                                        const visibleOn = item.visibleOn && item.visibleOn.length > 0 ? item.visibleOn : ALL_VIEWPORTS;
                                        return (
                                            <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
                                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                    <TextField
                                                        label={`Block ${index + 1} Text`}
                                                        value={item.content || ''}
                                                        onChange={(e) => handleUpdateTopBarItem(item.id, { content: e.target.value })}
                                                        size="small"
                                                        sx={{ minWidth: 260, flex: 1 }}
                                                    />
                                                    <Box sx={{ minWidth: 220, flex: 1 }}>
                                                        <IconPicker
                                                            label="Icon"
                                                            value={item.icon || ''}
                                                            onChange={(icon) => handleUpdateTopBarItem(item.id, { icon })}
                                                            fullWidth
                                                        />
                                                    </Box>
                                                    <Tooltip title="Delete block">
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleRemoveTopBarItem(item.id)}
                                                                disabled={topBarItems.length <= 1}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                                                    {ALL_VIEWPORTS.map((viewport) => (
                                                        <Button
                                                            key={viewport}
                                                            size="small"
                                                            variant={visibleOn.includes(viewport) ? 'contained' : 'outlined'}
                                                            onClick={() => handleToggleTopBarItemViewport(item.id, viewport)}
                                                        >
                                                            {viewport.charAt(0).toUpperCase() + viewport.slice(1)}
                                                        </Button>
                                                    ))}
                                                </Box>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            </Box>
                        </Collapse>

                        {/* Main Header Preview - Multiple Rows */}
                        {headerConfig.main.rows.map((row) => (
                            <Box
                                key={row.id}
                                sx={{
                                    bgcolor: row.backgroundColor || headerConfig.main.backgroundColor || config.colors?.background || '#ffffff',
                                    minHeight: row.height || headerConfig.main.height || 80,
                                    display: 'flex',
                                    alignItems: 'center',
                                    px: 3,
                                    py: row.padding ? row.padding / 2 : 0,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    position: 'relative',
                                    '&:hover .row-actions': {
                                        opacity: 1,
                                    },
                                }}
                            >
                                {renderSection(row.id, 'left', 'flex-start')}
                                {renderSection(row.id, 'center', 'center')}
                                {renderSection(row.id, 'right', 'flex-end')}

                                {/* Row Actions */}
                                <Box
                                    className="row-actions"
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        display: 'flex',
                                        gap: 1,
                                    }}
                                >
                                    <Tooltip title="Row settings">
                                        <IconButton
                                            size="small"
                                            onClick={() => setSettingsRowId(row.id)}
                                            sx={{ color: 'primary.main' }}
                                        >
                                            <SettingsIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    {headerConfig.main.rows.length > 1 && (
                                        <Tooltip title="Delete row">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveRow(row.id)}
                                                sx={{ color: 'error.main' }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>
                            </Box>
                        ))}

                        {/* Add Row Button */}
                        <Box sx={{ p: 2, textAlign: 'center', borderTop: '2px dashed', borderColor: 'divider' }}>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={handleAddRow}
                            >
                                Add Header Row
                            </Button>
                        </Box>
                    </Box>
                </PreviewContainer>

                {/* Add Element Menu */}
                <Menu
                    anchorEl={addMenuAnchor?.anchor}
                    open={!!addMenuAnchor}
                    onClose={() => setAddMenuAnchor(null)}
                >
                    {Object.entries(elementInfo).map(([type, info]) => (
                        <MuiMenuItem
                            key={type}
                            onClick={() => addMenuAnchor && handleAddElement(addMenuAnchor.rowId, addMenuAnchor.section, type as HeaderElement['type'])}
                        >
                            <ListItemIcon>{info.icon}</ListItemIcon>
                            <ListItemText>{info.label}</ListItemText>
                        </MuiMenuItem>
                    ))}
                </Menu>

                {/* Settings Panel */}
                <Paper sx={{ mb: 3 }}>
                    <Box
                        sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            bgcolor: 'grey.50',
                        }}
                        onClick={() => setSettingsExpanded(!settingsExpanded)}
                    >
                        <Typography variant="subtitle2">Header Settings</Typography>
                        {settingsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                    <Collapse in={settingsExpanded}>
                        <Box sx={{ p: 3 }}>
                            {/* Top Bar Settings */}
                            <Box sx={{ mb: 3 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={topBar.enabled}
                                            onChange={(e) => handleToggleTopBar(e.target.checked)}
                                        />
                                    }
                                    label="Enable Top Bar"
                                />
                                {topBar.enabled && (
                                    <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                                        <ColorPicker
                                            label="Background"
                                            value={topBar.backgroundColor}
                                            onChange={(color) => handleUpdateTopBar({ backgroundColor: color })}
                                            fullWidth={false}
                                        // sx={{ width: 150 }}
                                        />
                                        <ColorPicker
                                            label="Text"
                                            value={topBar.textColor}
                                            onChange={(color) => handleUpdateTopBar({ textColor: color })}
                                            fullWidth={false}
                                        // sx={{ width: 150 }}
                                        />
                                        <TextField
                                            label="Height"
                                            type="number"
                                            value={topBar.height}
                                            onChange={(e) => handleUpdateTopBar({ height: parseInt(e.target.value) })}
                                            size="small"
                                            sx={{ width: 80 }}
                                        />
                                    </Box>
                                )}
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Main Header Settings */}
                            <Typography variant="subtitle2" gutterBottom>Main Header</Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <ColorPicker
                                    label="Background"
                                    value={headerConfig.main.backgroundColor || config.colors?.background || '#ffffff'}
                                    onChange={(color) => handleUpdateMainHeader({ backgroundColor: color })}
                                    fullWidth={false}
                                // sx={{ width: 150 }}
                                />
                                <TextField
                                    label="Height"
                                    type="number"
                                    value={headerConfig.main.height || 80}
                                    onChange={(e) => handleUpdateMainHeader({ height: parseInt(e.target.value) })}
                                    size="small"
                                    sx={{ width: 80 }}
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={headerConfig.main.sticky || false}
                                            onChange={(e) => handleUpdateMainHeader({ sticky: e.target.checked })}
                                            size="small"
                                        />
                                    }
                                    label="Sticky"
                                />
                            </Box>
                            {headerConfig.main.sticky && (
                                <Box sx={{ mt: 2 }}>
                                    <TextField
                                        select
                                        label="Sticky Behavior"
                                        value={headerConfig.main.stickyRow || 'all'}
                                        onChange={(e) => handleUpdateMainHeader({ stickyRow: e.target.value as typeof headerConfig.main.stickyRow })}
                                        size="small"
                                        fullWidth
                                        helperText="Choose which part of the header should stick when scrolling"
                                    >
                                        <MuiMenuItem value="all">Whole Header (All Rows)</MuiMenuItem>
                                        <MuiMenuItem value="first">First Row Only</MuiMenuItem>
                                        {headerConfig.main.rows.length > 1 && (
                                            <MuiMenuItem value="second">Second Row Only</MuiMenuItem>
                                        )}
                                        <MuiMenuItem value="none">None (Disable Sticky)</MuiMenuItem>
                                    </TextField>
                                </Box>
                            )}
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            {/* Mobile Menu Settings */}
                            <Typography variant="subtitle2" gutterBottom>Mobile Menu</Typography>
                            <Box sx={{ mb: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={mobileMenu.enabled}
                                            onChange={(e) => handleUpdateMobileMenu({ enabled: e.target.checked })}
                                        />
                                    }
                                    label="Custom Mobile Menu"
                                />
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>
                                    If disabled, an automatic menu will be generated.
                                </Typography>

                                {mobileMenu.enabled && (
                                    <TextField
                                        select
                                        label="Select Menu"
                                        value={mobileMenu.menuId || ''}
                                        onChange={(e) => handleUpdateMobileMenu({ menuId: e.target.value })}
                                        fullWidth
                                        size="small"
                                        sx={{ mt: 1 }}
                                    >
                                        <MuiMenuItem value="">
                                            <em>None</em>
                                        </MuiMenuItem>
                                        {menus.map((menu) => (
                                            <MuiMenuItem key={menu._id} value={menu._id}>
                                                {menu.name}
                                            </MuiMenuItem>
                                        ))}
                                    </TextField>
                                )}
                            </Box>
                        </Box>
                    </Collapse>
                </Paper>

                <Dialog open={!!activeSettingsRow} onClose={() => setSettingsRowId(null)} maxWidth="xs" fullWidth>
                    <DialogTitle>Row Settings</DialogTitle>
                    <DialogContent>
                        {activeSettingsRow && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                                <TextField
                                    label="Row Height (px)"
                                    type="number"
                                    size="small"
                                    value={activeSettingsRow.height ?? ''}
                                    placeholder={`${headerConfig.main.height || 80}`}
                                    onChange={(e) => {
                                        const value = e.target.value.trim();
                                        const parsed = parseInt(value, 10);
                                        handleUpdateRow(activeSettingsRow.id, {
                                            height: value === '' || Number.isNaN(parsed) ? undefined : parsed,
                                        });
                                    }}
                                    inputProps={{ min: 0 }}
                                    fullWidth
                                    helperText="Leave empty to use main header height"
                                />

                                <Typography variant="subtitle2">Show Row On</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    {ALL_VIEWPORTS.map((viewport) => {
                                        const visibleOn = activeSettingsRow.visibleOn && activeSettingsRow.visibleOn.length > 0
                                            ? activeSettingsRow.visibleOn
                                            : ALL_VIEWPORTS;
                                        const isActive = visibleOn.includes(viewport);
                                        return (
                                            <Button
                                                key={viewport}
                                                size="small"
                                                variant={isActive ? 'contained' : 'outlined'}
                                                onClick={() => handleToggleRowViewport(activeSettingsRow.id, viewport)}
                                            >
                                                {viewport.charAt(0).toUpperCase() + viewport.slice(1)}
                                            </Button>
                                        );
                                    })}
                                </Box>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSettingsRowId(null)}>Close</Button>
                    </DialogActions>
                </Dialog>

                {/* Element Configuration Dialog */}
                <HeaderElementConfig
                    open={!!editingElement}
                    element={editingElement?.element || null}
                    onClose={() => setEditingElement(null)}
                    onSave={handleSaveElement}
                    storeId={storeId}
                />
            </Box>
        </DndContext>
    );
}
