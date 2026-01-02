'use client';

import { Box, Drawer, IconButton, Typography, useTheme, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import { FormSection, FormField } from '@/types';
import SectionEditor from './SectionEditor';
import FieldEditor from './FieldEditor';

interface PropertiesPanelProps {
    open: boolean;
    onClose: () => void;
    selectedSection: FormSection | undefined;
    selectedField: FormField | undefined;
    selectedSectionId: string | null;
    onUpdateSection: (sectionId: string, updates: Partial<FormSection>) => void;
    onUpdateField: (sectionId: string, fieldId: string, updates: Partial<FormField>) => void;
    onDeleteSection: (sectionId: string) => void;
    onDeleteField: (sectionId: string, fieldId: string) => void;
    sections: FormSection[];
    errors?: Record<string, string>;
}

export default function PropertiesPanel({
    open,
    onClose,
    selectedSection,
    selectedField,
    selectedSectionId,
    onUpdateSection,
    onUpdateField,
    onDeleteSection,
    onDeleteField,
    sections,
    errors = {},
}: PropertiesPanelProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const title = selectedField
        ? 'Field Settings'
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
            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    bgcolor: 'grey.50',
                }}
            >
                {selectedField && selectedSectionId ? (
                    <Box sx={{ p: 2, pt: 1 }}>
                        <FieldEditor
                            field={selectedField}
                            onChange={(updated) => onUpdateField(selectedSectionId, selectedField.id, updated)}
                            onDelete={() => onDeleteField(selectedSectionId, selectedField.id)}
                            errors={errors}
                            selectedSectionId={selectedSectionId}
                            sections={sections}
                        />
                    </Box>
                ) : selectedSection ? (
                    <Box sx={{ p: 2, pt: 1 }}>
                        <SectionEditor
                            section={selectedSection}
                            onChange={(updated) => onUpdateSection(selectedSection.id, updated)}
                            onDelete={() => onDeleteSection(selectedSection.id)}
                            errors={errors}
                            sectionIndex={sections.findIndex(s => s.id === selectedSection.id)}
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
                            Select a section or field
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
