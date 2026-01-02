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

            {/* Content - No tabs, just show the editor directly */}
            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    bgcolor: 'grey.50',
                }}
            >
                {selectedModule && selectedSectionId ? (
                    <Box sx={{ p: 1 }}>
                        <ModuleEditor
                            module={selectedModule}
                            onChange={(updated) => onUpdateModule(selectedSectionId, selectedModule.id, updated)}
                            onDelete={() => onDeleteModule(selectedSectionId, selectedModule.id)}
                            storeId={storeId}
                        />
                    </Box>
                ) : selectedSection ? (
                    <Box sx={{ p: 1 }}>
                        <SectionEditor
                            section={selectedSection}
                            onChange={(updated) => onUpdateSection(selectedSection.id, updated)}
                            onDelete={() => onDeleteSection(selectedSection.id)}
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
                            p: 4,
                            textAlign: 'center',
                        }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                bgcolor: 'grey.200',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2,
                            }}
                        >
                            <SettingsIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                        </Box>
                        <Typography variant="body1" color="text.secondary" fontWeight={500}>
                            Select a section or module
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Click on any element in the canvas to edit its properties
                        </Typography>
                    </Box>
                )}
            </Box>
        </Drawer>
    );
}
