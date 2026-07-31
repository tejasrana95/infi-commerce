'use client';

import {
    Box,
    Typography,
    Paper,
    IconButton,
    Collapse,
    Button,
    Tooltip,
    Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SettingsIcon from '@mui/icons-material/Settings';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import TabletIcon from '@mui/icons-material/Tablet';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LayoutSection, LayoutModule } from '@/types';
import ModuleRenderer from './ModuleRenderer';
import { getModuleDefinition } from './types';

// =========================================================================
// Action button shared styles
// =========================================================================
const actionBtnSx = {
    p: 0.75,
    color: '#6B7280',
    borderRadius: 1,
    transition: 'all 0.15s',
    '&:hover': { color: '#1F2937', bgcolor: '#F3F4F6' },
    '&.Mui-disabled': { color: '#D1D5DB' },
};

// =========================================================================
// ModuleCard — a single module inside a section
// =========================================================================
interface ModuleCardProps {
    module: LayoutModule;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onClone: () => void;
    sectionId: string;
    columnId?: string;
    index: number;
    storeId?: string;
}

function ModuleCard({ module, isSelected, onSelect, onDelete, onClone, sectionId, columnId, index, storeId }: ModuleCardProps) {
    const definition = getModuleDefinition(module.type);
    const isRemovable = module.isRemovable !== false && definition?.category !== 'placeholder';
    const [hovered, setHovered] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: module.id,
        data: { type: 'module', module, sectionId, columnId, index },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 999 : undefined,
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={(e) => {
                e.stopPropagation(); // Prevent section selection
                onSelect();
            }}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.25,
                mb: 0.75,
                bgcolor: isSelected ? '#EFF6FF' : '#FFFFFF',
                border: isSelected ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                borderRadius: 1.5,
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: isSelected ? '0 2px 8px rgba(59,130,246,0.12)' : 'none',
                '&:hover': {
                    borderColor: isSelected ? '#3B82F6' : '#D1D5DB',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                },
            }}
        >
            {/* Drag handle */}
            <Box
                {...attributes}
                {...listeners}
                sx={{
                    cursor: isDragging ? 'grabbing' : 'grab',
                    color: hovered ? '#9CA3AF' : '#E5E7EB',
                    display: 'flex',
                    transition: 'color 0.15s',
                    '&:hover': { color: '#6B7280' },
                }}
            >
                <DragIndicatorIcon sx={{ fontSize: '1.125rem' }} />
            </Box>

            {/* Module preview */}
            <Box flex={1} sx={{ minWidth: 0 }}>
                <ModuleRenderer module={module} isSelected={isSelected} onClick={onSelect} storeId={storeId} />
            </Box>

            {/* Hover actions */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 0.25,
                    opacity: hovered ? 1 : 0,
                    transition: 'opacity 0.15s',
                }}
            >
                <Tooltip title="Duplicate" arrow>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); onClone(); }} sx={actionBtnSx}>
                        <ContentCopyIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                </Tooltip>
                {isRemovable && (
                    <Tooltip title="Delete" arrow>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            sx={{ ...actionBtnSx, '&:hover': { color: '#EF4444', bgcolor: '#FEE2E2' } }}>
                            <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        </Box>
    );
}

// =========================================================================
// ModuleDropZone — droppable area inside sections
// =========================================================================
function ModuleDropZone({ sectionId, columnId, children }: { sectionId: string; columnId?: string; children: React.ReactNode }) {
    const dropId = columnId ? `drop-${sectionId}-${columnId}` : `drop-${sectionId}`;
    const { setNodeRef, isOver } = useDroppable({
        id: dropId,
        data: { type: 'section-drop', sectionId, columnId },
    });

    return (
        <Box
            ref={setNodeRef}
            sx={{
                minHeight: 52,
                p: 1.5,
                border: isOver ? '2px dashed #3B82F6' : '2px dashed transparent',
                borderRadius: 1.5,
                bgcolor: isOver ? 'rgba(59,130,246,0.04)' : 'transparent',
                transition: 'all 0.2s',
            }}
        >
            {children || (
                <Typography variant="body2" sx={{ color: '#9CA3AF', textAlign: 'center', py: 1, fontSize: '0.8rem' }}>
                    Drop modules here
                </Typography>
            )}
        </Box>
    );
}

// =========================================================================
// SectionBlock — a single section card
// =========================================================================
interface SectionBlockProps {
    section: LayoutSection;
    isSelected: boolean;
    selectedModuleId: string | null;
    selectedColumnId?: string | null;
    isFirst: boolean;
    isLast: boolean;
    onSelect: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onClone: () => void;
    onDelete: () => void;
    onSelectModule: (moduleId: string) => void;
    onDeleteModule: (moduleId: string) => void;
    onCloneModule: (moduleId: string) => void;
    onSelectColumn?: (sectionId: string, columnId: string) => void;
    onInsertBefore: () => void;
    onInsertAfter: () => void;
    storeId?: string;
}

function SectionBlock({
    section,
    isSelected,
    selectedModuleId,
    selectedColumnId,
    isFirst,
    isLast,
    onSelect,
    onMoveUp,
    onMoveDown,
    onClone,
    onDelete,
    onSelectModule,
    onDeleteModule,
    onCloneModule,
    onSelectColumn,
    onInsertBefore,
    onInsertAfter,
    storeId,
}: SectionBlockProps) {
    const [hovered, setHovered] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const blockRef = useRef<HTMLDivElement>(null);

    const moduleCount = section.modules.length +
        (section.columns?.reduce((acc, col) => acc + col.modules.length, 0) || 0);

    return (
        <Box
            ref={blockRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            sx={{ position: 'relative', mb: 1 }}
        >
            {/* ---- Insert button ABOVE ---- */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    height: 20,
                    mb: -0.5,
                    mt: -0.5,
                    opacity: hovered ? 1 : 0,
                    transition: 'opacity 0.2s',
                    zIndex: 5,
                    position: 'relative',
                }}
            >
                <Tooltip title="Insert section above" arrow>
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onInsertBefore(); }}
                        sx={{
                            width: 28,
                            height: 28,
                            bgcolor: '#FFFFFF',
                            border: '1.5px solid #D1D5DB',
                            borderRadius: '50%',
                            color: '#6B7280',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            transition: 'all 0.15s',
                            '&:hover': {
                                bgcolor: '#3B82F6',
                                borderColor: '#3B82F6',
                                color: '#FFFFFF',
                                boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
                            },
                        }}
                    >
                        <AddIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* ---- Section Card ---- */}
            <Paper
                elevation={0}
                onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.section-toolbar')) return;
                    onSelect();
                }}
                sx={{
                    border: isSelected ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                    borderRadius: 2,
                    bgcolor: '#FFFFFF',
                    overflow: 'hidden',
                    boxShadow: isSelected
                        ? '0 4px 16px rgba(59,130,246,0.12)'
                        : hovered ? '0 4px 16px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                    cursor: 'pointer',
                }}
            >
                {/* ---- Section Header ---- */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        py: 1.5,
                        bgcolor: isSelected ? '#F0F9FF' : '#FAFBFC',
                        borderBottom: collapsed ? 'none' : '1px solid #F3F4F6',
                    }}
                >
                    <Box flex={1} sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F2937' }}>
                            {section.name || 'Untitled Section'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.7rem' }}>
                            {section.type} &middot; {moduleCount} block{moduleCount !== 1 ? 's' : ''}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5, px: 0.75, py: 0.5, bgcolor: '#F3F4F6', borderRadius: 0.75, border: '1px solid #E5E7EB' }}>
                        <DesktopWindowsIcon sx={{ fontSize: '0.8rem', color: section.visibility.desktop ? '#3B82F6' : '#D1D5DB' }} />
                        <TabletIcon sx={{ fontSize: '0.8rem', color: section.visibility.tablet ? '#3B82F6' : '#D1D5DB' }} />
                        <PhoneIphoneIcon sx={{ fontSize: '0.8rem', color: section.visibility.mobile ? '#3B82F6' : '#D1D5DB' }} />
                    </Box>

                    <Box className="section-toolbar" sx={{ display: 'flex', gap: 0.25, opacity: (hovered || isSelected) ? 1 : 0, transition: 'opacity 0.15s' }}>
                        <Tooltip title="Move up" arrow>
                            <span>
                                <IconButton size="small" disabled={isFirst} onClick={(e) => { e.stopPropagation(); onMoveUp(); }} sx={actionBtnSx}>
                                    <KeyboardArrowUpIcon sx={{ fontSize: '1.1rem' }} />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Move down" arrow>
                            <span>
                                <IconButton size="small" disabled={isLast} onClick={(e) => { e.stopPropagation(); onMoveDown(); }} sx={actionBtnSx}>
                                    <KeyboardArrowDownIcon sx={{ fontSize: '1.1rem' }} />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
                        <Tooltip title="Duplicate" arrow>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onClone(); }} sx={actionBtnSx}>
                                <ContentCopyIcon sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete" arrow>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }}
                                sx={{ ...actionBtnSx, '&:hover': { color: '#EF4444', bgcolor: '#FEE2E2' } }}>
                                <DeleteIcon sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                        </Tooltip>
                        <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
                        <Tooltip title={collapsed ? 'Expand' : 'Collapse'} arrow>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }} sx={actionBtnSx}>
                                {collapsed ? <UnfoldMoreIcon sx={{ fontSize: '1rem' }} /> : <UnfoldLessIcon sx={{ fontSize: '1rem' }} />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Settings" arrow>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onSelect(); }} sx={actionBtnSx}>
                                <SettingsIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* ---- Section Body ---- */}
                <Collapse in={!collapsed}>
                    <Box sx={{ p: 2 }}>
                        {section.columns && section.columns.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {section.columns.map((col, idx) => (
                                    <Box key={col.id} sx={{ flex: col.width, minWidth: 0 }}>
                                        <Box
                                            onClick={() => onSelectColumn?.(section.id, col.id)}
                                            sx={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                px: 1, py: 0.5, mb: 0.75,
                                                bgcolor: selectedColumnId === col.id ? '#EFF6FF' : '#F9FAFB',
                                                borderRadius: 1, cursor: 'pointer',
                                                border: selectedColumnId === col.id ? '1px solid #3B82F6' : '1px solid transparent',
                                                '&:hover': { bgcolor: '#F3F4F6' },
                                            }}
                                        >
                                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#6B7280' }}>Column {idx + 1}</Typography>
                                            <SettingsIcon sx={{ fontSize: '0.7rem', color: '#9CA3AF' }} />
                                        </Box>
                                        <SortableContext items={col.modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                                            <ModuleDropZone sectionId={section.id} columnId={col.id}>
                                                {col.modules.map((mod, idx2) => (
                                                    <ModuleCard
                                                        key={mod.id}
                                                        module={mod}
                                                        isSelected={selectedModuleId === mod.id}
                                                        onSelect={() => onSelectModule(mod.id)}
                                                        onDelete={() => onDeleteModule(mod.id)}
                                                        onClone={() => onCloneModule(mod.id)}
                                                        sectionId={section.id}
                                                        columnId={col.id}
                                                        index={idx2}
                                                        storeId={storeId}
                                                    />
                                                ))}
                                            </ModuleDropZone>
                                        </SortableContext>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <SortableContext items={section.modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                                <ModuleDropZone sectionId={section.id}>
                                    {section.modules.map((mod, idx) => (
                                        <ModuleCard
                                            key={mod.id}
                                            module={mod}
                                            isSelected={selectedModuleId === mod.id}
                                            onSelect={() => onSelectModule(mod.id)}
                                            onDelete={() => onDeleteModule(mod.id)}
                                            onClone={() => onCloneModule(mod.id)}
                                            sectionId={section.id}
                                            index={idx}
                                            storeId={storeId}
                                        />
                                    ))}
                                </ModuleDropZone>
                            </SortableContext>
                        )}
                    </Box>
                </Collapse>
            </Paper>

            {/* ---- Insert button BELOW ---- */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    height: 20,
                    mt: -0.5,
                    mb: -0.5,
                    opacity: hovered ? 1 : 0,
                    transition: 'opacity 0.2s',
                    zIndex: 5,
                    position: 'relative',
                }}
            >
                <Tooltip title="Insert section below" arrow>
                    <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onInsertAfter(); }}
                        sx={{
                            width: 28,
                            height: 28,
                            bgcolor: '#FFFFFF',
                            border: '1.5px solid #D1D5DB',
                            borderRadius: '50%',
                            color: '#6B7280',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                            transition: 'all 0.15s',
                            '&:hover': {
                                bgcolor: '#3B82F6',
                                borderColor: '#3B82F6',
                                color: '#FFFFFF',
                                boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
                            },
                        }}
                    >
                        <AddIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
}

// =========================================================================
// SectionList
// =========================================================================
interface SectionListProps {
    sections: LayoutSection[];
    selectedSectionId: string | null;
    selectedModuleId: string | null;
    selectedColumnId?: string | null;
    onSelectSection: (id: string) => void;
    onCloneSection: (id: string) => void;
    onDeleteSection: (id: string) => void;
    onMoveSection: (fromIndex: number, toIndex: number) => void;
    onInsertSectionAt: (index: number) => void;
    onSelectModule: (sectionId: string, moduleId: string) => void;
    onDeleteModule: (sectionId: string, moduleId: string) => void;
    onCloneModule: (sectionId: string, moduleId: string) => void;
    onAddSection: () => void;
    onSelectColumn: (sectionId: string, columnId: string) => void;
    storeId?: string;
}

export default function SectionList({
    sections,
    selectedSectionId,
    selectedModuleId,
    selectedColumnId,
    onSelectSection,
    onCloneSection,
    onDeleteSection,
    onMoveSection,
    onInsertSectionAt,
    onSelectModule,
    onDeleteModule,
    onCloneModule,
    onAddSection,
    onSelectColumn,
    storeId,
}: SectionListProps) {
    if (sections.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No sections yet. Add your first section to start building.
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAddSection}
                    sx={{
                        bgcolor: '#3B82F6',
                        '&:hover': { bgcolor: '#2563EB' },
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        borderRadius: 2,
                    }}
                >
                    Add Section
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            {sections.map((section, index) => (
                <SectionBlock
                    key={section.id}
                    section={section}
                    isSelected={selectedSectionId === section.id}
                    selectedModuleId={selectedModuleId}
                    selectedColumnId={selectedColumnId}
                    isFirst={index === 0}
                    isLast={index === sections.length - 1}
                    onSelect={() => onSelectSection(section.id)}
                    onMoveUp={() => onMoveSection(index, index - 1)}
                    onMoveDown={() => onMoveSection(index, index + 1)}
                    onClone={() => onCloneSection(section.id)}
                    onDelete={() => onDeleteSection(section.id)}
                    onSelectModule={(moduleId) => onSelectModule(section.id, moduleId)}
                    onDeleteModule={(moduleId) => onDeleteModule(section.id, moduleId)}
                    onCloneModule={(moduleId) => onCloneModule(section.id, moduleId)}
                    onSelectColumn={onSelectColumn}
                    onInsertBefore={() => onInsertSectionAt(index)}
                    onInsertAfter={() => onInsertSectionAt(index + 1)}
                    storeId={storeId}
                />
            ))}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={onAddSection}
                    sx={{
                        borderColor: '#D1D5DB',
                        color: '#6B7280',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 3,
                        '&:hover': {
                            borderColor: '#3B82F6',
                            color: '#3B82F6',
                            bgcolor: '#EFF6FF',
                        },
                    }}
                >
                    Add Section
                </Button>
            </Box>
        </Box>
    );
}
