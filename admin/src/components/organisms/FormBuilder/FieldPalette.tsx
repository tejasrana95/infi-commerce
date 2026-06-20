'use client';

import { Box, Typography, Paper, Divider } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { fieldTypeDefinitions, FieldTypeDefinition } from './types';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import NotesIcon from '@mui/icons-material/Notes';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import RepeatIcon from '@mui/icons-material/Repeat';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import LinkIcon from '@mui/icons-material/Link';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const iconMap: Record<string, any> = {
    TextFields: TextFieldsIcon,
    Notes: NotesIcon,
    Email: EmailIcon,
    Phone: PhoneIcon,
    CalendarToday: CalendarTodayIcon,
    AccessTime: AccessTimeIcon,
    Event: EventIcon,
    ArrowDropDown: ArrowDropDownIcon,
    RadioButtonChecked: RadioButtonCheckedIcon,
    CheckBox: CheckBoxIcon,
    FormatBold: FormatBoldIcon,
    Repeat: RepeatIcon,
    AttachFile: AttachFileIcon,
    Image: ImageIcon,
    Link: LinkIcon,
};

interface FieldPaletteItemProps {
    definition: FieldTypeDefinition;
}

function FieldPaletteItem({ definition }: FieldPaletteItemProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-${definition.type}`,
        data: {
            type: 'palette-field',
            fieldType: definition.type,
        },
    });

    const IconComponent = iconMap[definition.icon] || TextFieldsIcon;

    return (
        <Paper
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            sx={{
                p: 1.25,
                mb: 1,
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: isDragging ? 0.3 : 1,
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: 'rgba(0,0,0,0.08)',
                bgcolor: 'background.paper',
                '&:hover': {
                    bgcolor: 'grey.50',
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transform: 'translateY(-1px)',
                },
            }}
        >
            <DragIndicatorIcon fontSize="small" sx={{ color: 'rgba(0,0,0,0.2)' }} />
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    bgcolor: 'primary.50',
                    color: 'primary.main'
                }}
            >
                <IconComponent sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>
                    {definition.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem', lineHeight: 1.2 }}>
                    {definition.description}
                </Typography>
            </Box>
        </Paper>
    );
}

export default function FieldPalette() {
    const basicFields = fieldTypeDefinitions.filter(f => f.category === 'basic');
    const advancedFields = fieldTypeDefinitions.filter(f => f.category === 'advanced');
    const fileFields = fieldTypeDefinitions.filter(f => f.category === 'file');

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ mb: 2, px: 1 }}>
                <Typography variant="overline" color="text.secondary" fontWeight={800} sx={{ letterSpacing: 1 }}>
                    Palette
                </Typography>
            </Box>

            {/* Basic Fields */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, mt: 1, px: 1, fontSize: '0.75rem', textTransform: 'uppercase', color: 'primary.main' }}>
                Basic Fields
            </Typography>
            <Box sx={{ px: 0.5 }}>
                {basicFields.map(definition => (
                    <FieldPaletteItem key={definition.type} definition={definition} />
                ))}
            </Box>

            <Divider sx={{ my: 2, mx: 1, opacity: 0.5 }} />

            {/* Advanced Fields */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, px: 1, fontSize: '0.75rem', textTransform: 'uppercase', color: 'primary.main' }}>
                Advanced Fields
            </Typography>
            <Box sx={{ px: 0.5 }}>
                {advancedFields.map(definition => (
                    <FieldPaletteItem key={definition.type} definition={definition} />
                ))}
            </Box>

            <Divider sx={{ my: 2, mx: 1, opacity: 0.5 }} />

            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, px: 1, fontSize: '0.75rem', textTransform: 'uppercase', color: 'primary.main' }}>
                File Upload
            </Typography>
            <Box sx={{ px: 0.5 }}>
                {fileFields.map(definition => (
                    <FieldPaletteItem key={definition.type} definition={definition} />
                ))}
            </Box>
        </Box>
    );
}
