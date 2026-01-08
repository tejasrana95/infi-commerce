import React from 'react';
import { Box, Button, IconButton, Tooltip, Divider, Select, MenuItem, FormControl, Typography, alpha, Menu, ListItemIcon, ListItemText, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import SmartButtonIcon from '@mui/icons-material/SmartButton';
import SettingsIcon from '@mui/icons-material/Settings';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import DeleteIcon from '@mui/icons-material/Delete';
import GridOnIcon from '@mui/icons-material/GridOn';
import GridOffIcon from '@mui/icons-material/GridOff';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import StarIcon from '@mui/icons-material/Star';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignHorizontalRightIcon from '@mui/icons-material/AlignHorizontalRight';
import AlignHorizontalCenterIcon from '@mui/icons-material/AlignHorizontalCenter';
import AlignVerticalTopIcon from '@mui/icons-material/AlignVerticalTop';
import AlignVerticalBottomIcon from '@mui/icons-material/AlignVerticalBottom';
import AlignVerticalCenterIcon from '@mui/icons-material/AlignVerticalCenter';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import TabletMacIcon from '@mui/icons-material/TabletMac';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';

// Theme colors
const colors = {
    bg: '#0d0d1a',
    bgSecondary: '#13132a',
    bgTertiary: '#1a1a3a',
    border: '#2a2a4a',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.5)',
    accent: '#00d4ff',
    accent2: '#7c3aed',
    success: '#10b981',
    gradient: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)'
};

interface ToolbarProps {
    // Back and title
    sliderName?: string;
    onBack?: () => void;
    // Core actions
    onAddSlide: () => void;
    onSave: () => void;
    onAddLayer: (type: any) => void;
    onOpenSettings: () => void;
    activeSlide: boolean;
    viewMode: 'desktop' | 'tablet' | 'mobile';
    onChangeViewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    showGrid: boolean;
    onToggleGrid: () => void;
    snapToGrid: boolean;
    onToggleSnap: () => void;
    zoom: number;
    onChangeZoom: (zoom: number) => void;
    onCopyLayer?: () => void;
    onPasteLayer?: () => void;
    onDeleteLayer?: () => void;
    // Multi-select alignment
    selectedLayerCount?: number;
    onAlignLayers?: (alignment: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV' | 'distributeH' | 'distributeV') => void;
    // Layer grouping
    onGroupLayers?: () => void;
    onUngroupLayers?: () => void;
    hasGroupedSelection?: boolean;
    // Panel toggles
    leftPanelOpen?: boolean;
    onToggleLeftPanel?: () => void;
    rightPanelOpen?: boolean;
    onToggleRightPanel?: () => void;
    // Save state
    isSaving?: boolean;
}

const ToolbarButton = ({ icon, label, onClick, disabled, active }: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    active?: boolean;
}) => (
    <Tooltip title={label} arrow>
        <span>
            <IconButton
                size="small"
                onClick={onClick}
                disabled={disabled}
                sx={{
                    color: active ? colors.accent : colors.textSecondary,
                    backgroundColor: active ? alpha(colors.accent, 0.15) : 'transparent',
                    borderRadius: 1,
                    '&:hover': {
                        backgroundColor: alpha(colors.accent, 0.1),
                        color: colors.accent
                    },
                    '&.Mui-disabled': {
                        color: alpha(colors.textSecondary, 0.3)
                    }
                }}
            >
                {icon}
            </IconButton>
        </span>
    </Tooltip>
);

const ToolbarDivider = () => (
    <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: colors.border }} />
);

export default function Toolbar({
    sliderName,
    onBack,
    onAddSlide,
    onSave,
    onAddLayer,
    onOpenSettings,
    activeSlide,
    viewMode,
    onChangeViewMode,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    showGrid,
    onToggleGrid,
    snapToGrid,
    onToggleSnap,
    zoom,
    onChangeZoom,
    onCopyLayer,
    onPasteLayer,
    onDeleteLayer,
    selectedLayerCount = 0,
    onAlignLayers,
    onGroupLayers,
    onUngroupLayers,
    hasGroupedSelection = false,
    leftPanelOpen = true,
    onToggleLeftPanel,
    rightPanelOpen = true,
    onToggleRightPanel,
    isSaving = false
}: ToolbarProps) {
    const [alignMenuAnchor, setAlignMenuAnchor] = React.useState<null | HTMLElement>(null);
    const alignMenuOpen = Boolean(alignMenuAnchor);

    const handleAlignClick = (event: React.MouseEvent<HTMLElement>) => {
        setAlignMenuAnchor(event.currentTarget);
    };

    const handleAlignClose = () => {
        setAlignMenuAnchor(null);
    };

    const handleAlignment = (alignment: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV' | 'distributeH' | 'distributeV') => {
        onAlignLayers?.(alignment);
        handleAlignClose();
    };

    const canAlign = selectedLayerCount >= 1 && onAlignLayers;

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            flexWrap: 'nowrap'
        }}>
            {/* Back Button & Title */}
            {onBack && (
                <>
                    <Tooltip title="Back to Sliders" arrow>
                        <IconButton
                            size="small"
                            onClick={onBack}
                            sx={{
                                color: colors.textSecondary,
                                '&:hover': { color: colors.accent, backgroundColor: alpha(colors.accent, 0.1) }
                            }}
                        >
                            <ArrowBackIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    {sliderName && (
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: colors.text,
                                fontWeight: 600,
                                maxWidth: 150,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                mr: 1
                            }}
                        >
                            {sliderName}
                        </Typography>
                    )}
                    <ToolbarDivider />
                </>
            )}

            {/* Left Panel Toggle */}
            {onToggleLeftPanel && (
                <Tooltip title={leftPanelOpen ? "Hide Slide List" : "Show Slide List"} arrow>
                    <IconButton
                        onClick={onToggleLeftPanel}
                        size="small"
                        sx={{
                            color: leftPanelOpen ? colors.accent : colors.textSecondary,
                            '&:hover': {
                                color: colors.accent,
                                backgroundColor: alpha(colors.accent, 0.1)
                            },
                            mr: 0.5
                        }}
                    >
                        {leftPanelOpen ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                    </IconButton>
                </Tooltip>
            )}

            {/* View Mode Selector */}
            <Box sx={{
                display: 'flex',
                bgcolor: colors.bgTertiary,
                borderRadius: 1,
                p: 0.25
            }}>
                <ToolbarButton
                    icon={<LaptopMacIcon fontSize="small" />}
                    label="Desktop View"
                    onClick={() => onChangeViewMode('desktop')}
                    active={viewMode === 'desktop'}
                />
                <ToolbarButton
                    icon={<TabletMacIcon fontSize="small" />}
                    label="Tablet View"
                    onClick={() => onChangeViewMode('tablet')}
                    active={viewMode === 'tablet'}
                />
                <ToolbarButton
                    icon={<PhoneIphoneIcon fontSize="small" />}
                    label="Mobile View"
                    onClick={() => onChangeViewMode('mobile')}
                    active={viewMode === 'mobile'}
                />
            </Box>

            <ToolbarDivider />

            {/* History */}
            <Box sx={{ display: 'flex', gap: 0.25 }}>
                <ToolbarButton
                    icon={<UndoIcon fontSize="small" />}
                    label="Undo (Ctrl+Z)"
                    onClick={onUndo}
                    disabled={!canUndo}
                />
                <ToolbarButton
                    icon={<RedoIcon fontSize="small" />}
                    label="Redo (Ctrl+Shift+Z)"
                    onClick={onRedo}
                    disabled={!canRedo}
                />
            </Box>

            <ToolbarDivider />

            {/* Add Slide */}
            <Tooltip title="Add New Slide" arrow>
                <Button
                    startIcon={<AddIcon />}
                    size="small"
                    onClick={onAddSlide}
                    sx={{
                        color: colors.text,
                        borderColor: colors.border,
                        textTransform: 'none',
                        fontSize: 12,
                        '&:hover': {
                            borderColor: colors.accent,
                            backgroundColor: alpha(colors.accent, 0.1)
                        }
                    }}
                    variant="outlined"
                >
                    Slide
                </Button>
            </Tooltip>

            <ToolbarDivider />

            {/* Layer Types */}
            <Box sx={{ display: 'flex', gap: 0.25 }}>
                <ToolbarButton
                    icon={<TextFieldsIcon fontSize="small" />}
                    label="Add Text Layer"
                    onClick={() => onAddLayer('text')}
                    disabled={!activeSlide}
                />
                <ToolbarButton
                    icon={<TextFieldsIcon fontSize="small" sx={{ borderBottom: '2px solid currentColor' }} />}
                    label="Add Rich Text (HTML)"
                    onClick={() => onAddLayer('rte')}
                    disabled={!activeSlide}
                />
                <ToolbarButton
                    icon={<ImageIcon fontSize="small" />}
                    label="Add Image Layer"
                    onClick={() => onAddLayer('image')}
                    disabled={!activeSlide}
                />
                <ToolbarButton
                    icon={<SmartButtonIcon fontSize="small" />}
                    label="Add Button Layer"
                    onClick={() => onAddLayer('button')}
                    disabled={!activeSlide}
                />
                <ToolbarButton
                    icon={<StarIcon fontSize="small" />}
                    label="Add Icon Layer"
                    onClick={() => onAddLayer('icon')}
                    disabled={!activeSlide}
                />
            </Box>

            <ToolbarDivider />

            {/* Layer Edit */}
            <Box sx={{ display: 'flex', gap: 0.25 }}>
                <ToolbarButton
                    icon={<ContentCopyIcon fontSize="small" />}
                    label="Copy Layer (Ctrl+C)"
                    onClick={onCopyLayer}
                    disabled={!onCopyLayer}
                />
                <ToolbarButton
                    icon={<ContentPasteIcon fontSize="small" />}
                    label="Paste Layer (Ctrl+V)"
                    onClick={onPasteLayer}
                    disabled={!onPasteLayer}
                />
                <ToolbarButton
                    icon={<DeleteIcon fontSize="small" />}
                    label="Delete Layer (Del)"
                    onClick={onDeleteLayer}
                    disabled={!onDeleteLayer}
                />
            </Box>

            <ToolbarDivider />

            {/* Grouping */}
            <Box sx={{ display: 'flex', gap: 0.25 }}>
                <Tooltip title={selectedLayerCount >= 2 ? "Group Layers (Ctrl+G)" : "Select 2+ layers to group"} arrow>
                    <span>
                        <Button
                            size="small"
                            onClick={onGroupLayers}
                            disabled={selectedLayerCount < 2}
                            sx={{
                                color: selectedLayerCount >= 2 ? colors.accent : colors.textSecondary,
                                borderColor: selectedLayerCount >= 2 ? colors.accent : colors.border,
                                textTransform: 'none',
                                fontSize: 11,
                                minWidth: 'auto',
                                px: 1,
                                '&:hover': {
                                    borderColor: colors.accent,
                                    backgroundColor: alpha(colors.accent, 0.1)
                                },
                                '&.Mui-disabled': {
                                    color: alpha(colors.textSecondary, 0.3),
                                    borderColor: alpha(colors.border, 0.3)
                                }
                            }}
                            variant="outlined"
                        >
                            Group
                        </Button>
                    </span>
                </Tooltip>
                <Tooltip title={hasGroupedSelection ? "Ungroup Layers" : "Select grouped layers first"} arrow>
                    <span>
                        <Button
                            size="small"
                            onClick={onUngroupLayers}
                            disabled={!hasGroupedSelection}
                            sx={{
                                color: hasGroupedSelection ? colors.accent : colors.textSecondary,
                                borderColor: hasGroupedSelection ? colors.accent : colors.border,
                                textTransform: 'none',
                                fontSize: 11,
                                minWidth: 'auto',
                                px: 1,
                                '&:hover': {
                                    borderColor: colors.accent,
                                    backgroundColor: alpha(colors.accent, 0.1)
                                },
                                '&.Mui-disabled': {
                                    color: alpha(colors.textSecondary, 0.3),
                                    borderColor: alpha(colors.border, 0.3)
                                }
                            }}
                            variant="outlined"
                        >
                            Ungroup
                        </Button>
                    </span>
                </Tooltip>
            </Box>

            <ToolbarDivider />

            {/* Alignment */}
            <Tooltip title={canAlign ? "Align Layers" : "Select 2+ layers (Ctrl+Click)"} arrow>
                <span>
                    <Button
                        size="small"
                        onClick={handleAlignClick}
                        disabled={!canAlign}
                        startIcon={<AlignHorizontalCenterIcon fontSize="small" />}
                        sx={{
                            color: canAlign ? colors.accent : colors.textSecondary,
                            borderColor: canAlign ? colors.accent : colors.border,
                            textTransform: 'none',
                            fontSize: 11,
                            minWidth: 'auto',
                            px: 1,
                            '&:hover': {
                                borderColor: colors.accent,
                                backgroundColor: alpha(colors.accent, 0.1)
                            },
                            '&.Mui-disabled': {
                                color: alpha(colors.textSecondary, 0.3),
                                borderColor: alpha(colors.border, 0.3)
                            }
                        }}
                        variant="outlined"
                    >
                        Align
                    </Button>
                </span>
            </Tooltip>

            {/* Alignment Menu */}
            <Menu
                anchorEl={alignMenuAnchor}
                open={alignMenuOpen}
                onClose={handleAlignClose}
                PaperProps={{
                    sx: {
                        bgcolor: colors.bgSecondary,
                        border: `1px solid ${colors.border}`,
                        minWidth: 180,
                        '& .MuiMenuItem-root': {
                            color: colors.text,
                            fontSize: 12,
                            py: 0.75,
                            '&:hover': { bgcolor: alpha(colors.accent, 0.1) }
                        }
                    }
                }}
            >
                <MenuItem onClick={() => handleAlignment('left')}>
                    <ListItemIcon><AlignHorizontalLeftIcon fontSize="small" sx={{ color: colors.accent }} /></ListItemIcon>
                    <ListItemText>Align Left</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAlignment('centerH')}>
                    <ListItemIcon><AlignHorizontalCenterIcon fontSize="small" sx={{ color: colors.accent }} /></ListItemIcon>
                    <ListItemText>Align Center (H)</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAlignment('right')}>
                    <ListItemIcon><AlignHorizontalRightIcon fontSize="small" sx={{ color: colors.accent }} /></ListItemIcon>
                    <ListItemText>Align Right</ListItemText>
                </MenuItem>
                <Divider sx={{ borderColor: colors.border, my: 0.5 }} />
                <MenuItem onClick={() => handleAlignment('top')}>
                    <ListItemIcon><AlignVerticalTopIcon fontSize="small" sx={{ color: colors.accent }} /></ListItemIcon>
                    <ListItemText>Align Top</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAlignment('centerV')}>
                    <ListItemIcon><AlignVerticalCenterIcon fontSize="small" sx={{ color: colors.accent }} /></ListItemIcon>
                    <ListItemText>Align Center (V)</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAlignment('bottom')}>
                    <ListItemIcon><AlignVerticalBottomIcon fontSize="small" sx={{ color: colors.accent }} /></ListItemIcon>
                    <ListItemText>Align Bottom</ListItemText>
                </MenuItem>
                <Divider sx={{ borderColor: colors.border, my: 0.5 }} />
                <MenuItem onClick={() => handleAlignment('distributeH')}>
                    <ListItemIcon><ViewColumnIcon fontSize="small" sx={{ color: colors.accent }} /></ListItemIcon>
                    <ListItemText>Distribute Horizontally</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAlignment('distributeV')}>
                    <ListItemIcon><TableRowsIcon fontSize="small" sx={{ color: colors.accent }} /></ListItemIcon>
                    <ListItemText>Distribute Vertically</ListItemText>
                </MenuItem>
            </Menu>

            <ToolbarDivider />

            {/* Grid & Snap */}
            <Box sx={{ display: 'flex', gap: 0.25 }}>
                <ToolbarButton
                    icon={showGrid ? <GridOnIcon fontSize="small" /> : <GridOffIcon fontSize="small" />}
                    label={showGrid ? "Hide Grid (G)" : "Show Grid (G)"}
                    onClick={onToggleGrid}
                    active={showGrid}
                />
                <ToolbarButton
                    icon={<CenterFocusStrongIcon fontSize="small" />}
                    label={snapToGrid ? "Snap: ON" : "Snap: OFF"}
                    onClick={onToggleSnap}
                    active={snapToGrid}
                />
            </Box>

            {/* Zoom */}
            <FormControl size="small" sx={{ minWidth: 70 }}>
                <Select
                    value={zoom}
                    onChange={(e) => onChangeZoom(e.target.value as number)}
                    size="small"
                    sx={{
                        color: colors.text,
                        fontSize: 11,
                        height: 28,
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.border
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.accent
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.accent
                        },
                        '& .MuiSvgIcon-root': {
                            color: colors.textSecondary
                        }
                    }}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                bgcolor: colors.bgSecondary,
                                borderColor: colors.border,
                                '& .MuiMenuItem-root': {
                                    color: colors.text,
                                    fontSize: 11,
                                    '&:hover': { bgcolor: alpha(colors.accent, 0.1) },
                                    '&.Mui-selected': { bgcolor: alpha(colors.accent, 0.2) }
                                }
                            }
                        }
                    }}
                >
                    <MenuItem value={0.25}>25%</MenuItem>
                    <MenuItem value={0.5}>50%</MenuItem>
                    <MenuItem value={0.75}>75%</MenuItem>
                    <MenuItem value={1}>100%</MenuItem>
                    <MenuItem value={1.25}>125%</MenuItem>
                    <MenuItem value={1.5}>150%</MenuItem>
                </Select>
            </FormControl>

            <Box sx={{ flex: 1 }} />

            {/* Right Panel Toggle */}
            {onToggleRightPanel && (
                <Tooltip title={rightPanelOpen ? "Hide Properties" : "Show Properties"} arrow>
                    <IconButton
                        onClick={onToggleRightPanel}
                        size="small"
                        sx={{
                            color: rightPanelOpen ? colors.accent : colors.textSecondary,
                            '&:hover': {
                                color: colors.accent,
                                backgroundColor: alpha(colors.accent, 0.1)
                            }
                        }}
                    >
                        {rightPanelOpen ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                    </IconButton>
                </Tooltip>
            )}

            {/* Settings */}
            <Tooltip title="Slider Settings" arrow>
                <IconButton
                    onClick={onOpenSettings}
                    size="small"
                    sx={{
                        color: colors.textSecondary,
                        '&:hover': {
                            color: colors.accent,
                            backgroundColor: alpha(colors.accent, 0.1)
                        }
                    }}
                >
                    <SettingsIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            {/* Save */}
            <Tooltip title="Save Slider (Ctrl+S)" arrow>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={onSave}
                    disabled={isSaving}
                    size="small"
                    sx={{
                        background: colors.gradient,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: 12,
                        px: 1.5,
                        height: 28,
                        '&:hover': {
                            background: colors.gradient,
                            opacity: 0.9
                        }
                    }}
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </Tooltip>
        </Box>
    );
}
