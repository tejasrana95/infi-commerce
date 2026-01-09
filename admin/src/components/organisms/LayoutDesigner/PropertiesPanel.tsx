'use client';

import { Box, Drawer, IconButton, Typography, useTheme, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import { LayoutSection, LayoutModule } from '@/types';
import SectionEditor from './SectionEditor';
import ModuleEditor from './ModuleEditor';

interface PropertiesPanelProps {
    open: boolean;
    onClose: () => void;
    selectedSection: LayoutSection | undefined;
    selectedModule: LayoutModule | undefined;
    selectedSectionId: string | null;
    onUpdateSection: (sectionId: string, updates: Partial<LayoutSection>) => void;
    onUpdateModule: (sectionId: string, moduleId: string, updates: Partial<LayoutModule>) => void;
    onDeleteSection: (sectionId: string) => void;
    onDeleteModule: (sectionId: string, moduleId: string) => void;
    storeId: string;
    copiedStyle?: any;
    onCopyStyle?: (style: any) => void;
}

export default function PropertiesPanel({
    open,
    onClose,
    selectedSection,
    selectedModule,
    selectedSectionId,
    onUpdateSection,
    onUpdateModule,
    onDeleteSection,
    onDeleteModule,
    storeId,
    copiedStyle,
    onCopyStyle,
}: PropertiesPanelProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const title = selectedModule
        ? 'Module Settings'
        : selectedSection
            ? 'Section Settings'
            : 'Properties';

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            variant="temporary"
            PaperProps={{
                sx: {
                    width: { xs: '90%', sm: 400, md: 420 },
                    maxWidth: 500,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                },
            }}
            sx={{
                '& .MuiBackdrop-root': {
                    backdropFilter: 'blur(4px)',
                    bgcolor: 'rgba(0, 0, 0, 0.3)',
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <Typography variant="h6" fontWeight={600}>
                    {title}
                </Typography>
                <IconButton
                    size="small"
                    onClick={onClose}
                    sx={{
                        bgcolor: 'grey.100',
                        '&:hover': { bgcolor: 'grey.200' },
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {selectedModule && selectedSectionId ? (
                    <Box sx={{ p: 2 }}>
                        <ModuleEditor
                            module={selectedModule}
                            onChange={(updated) => onUpdateModule(selectedSectionId, selectedModule.id, updated)}
                            onDelete={() => onDeleteModule(selectedSectionId, selectedModule.id)}
                            storeId={storeId}
                        />
                    </Box>
                ) : selectedSection ? (
                    <Box sx={{ p: 2 }}>
                        <SectionEditor
                            section={selectedSection}
                            onChange={(updated) => onUpdateSection(selectedSection.id, updated)}
                            onDelete={() => onDeleteSection(selectedSection.id)}
                            copiedStyle={copiedStyle}
                            onCopyStyle={onCopyStyle!}
                        />
                    </Box>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            p: 3,
                            textAlign: 'center',
                            color: '#9CA3AF',
                        }}
                    >
                        <SettingsIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 1.5 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#6B7280', mb: 0.5 }}>
                            No selection
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9CA3AF', fontSize: '0.8rem' }}>
                            Click on elements to edit
                        </Typography>
                    </Box>
                )}
            </Box>
        </Drawer>
    );
}
