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
                p: 1.5,
                mb: 1,
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                transition: 'all 0.2s',
                opacity: isDragging ? 0.5 : 1,
                '&:hover': {
                    bgcolor: 'primary.50',
                    borderColor: 'primary.main',
                    boxShadow: 1,
                },
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <DragIndicatorIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <IconComponent fontSize="small" color="primary" />
            <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                    {definition.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
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
        <Box>
            <Typography variant="h6" gutterBottom fontWeight={600}>
                Field Types
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Drag fields to the form canvas
            </Typography>

            {/* Basic Fields */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: 'text.secondary' }}>
                Basic Fields
            </Typography>
            {basicFields.map(definition => (
                <FieldPaletteItem key={definition.type} definition={definition} />
            ))}

            <Divider sx={{ my: 2 }} />

            {/* Advanced Fields */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: 'text.secondary' }}>
                Advanced Fields
            </Typography>
            {advancedFields.map(definition => (
                <FieldPaletteItem key={definition.type} definition={definition} />
            ))}

            <Divider sx={{ my: 2 }} />

            {/* File Fields */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, color: 'text.secondary' }}>
                File Upload
            </Typography>
            {fileFields.map(definition => (
                <FieldPaletteItem key={definition.type} definition={definition} />
            ))}
        </Box>
    );
}
