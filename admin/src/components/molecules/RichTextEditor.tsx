import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Box, IconButton, Select, MenuItem, Typography, Paper, Divider, Tooltip, useTheme, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, SelectChangeEvent } from '@mui/material';
import {
    FormatBold, FormatItalic, FormatUnderlined, FormatStrikethrough,
    FormatListBulleted, FormatListNumbered, FormatQuote, Code,
    Undo, Redo, Image as ImageIcon, Link as LinkIcon,
    FormatAlignLeft, FormatAlignCenter, FormatAlignRight, FormatAlignJustify, LinkOff,
} from '@mui/icons-material';
import { useEffect, useState, useCallback } from 'react';
import FileManagerButton from './FileManagerButton';
import { FileItem } from '@/types/file';

export type RichTextEditorVariant = 'minimal' | 'standard' | 'full';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    variant?: RichTextEditorVariant;
    label?: string;
    placeholder?: string;
    error?: boolean;
    helperText?: string;
    minHeight?: string | number;
}

const LinkDialog = ({ open, onClose, onSave, initialUrl }: { open: boolean, onClose: () => void, onSave: (url: string) => void, initialUrl: string }) => {
    const [url, setUrl] = useState(initialUrl);

    useEffect(() => {
        setUrl(initialUrl);
    }, [initialUrl]);

    const handleSave = () => {
        onSave(url);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="URL"
                    fullWidth
                    variant="outlined"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={!url}>Save</Button>
            </DialogActions>
        </Dialog>
    );
};

interface MenuBarProps {
    editor: Editor | null;
    variant: RichTextEditorVariant;
}

const MenuBar = ({ editor, variant }: MenuBarProps) => {
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const theme = useTheme();

    if (!editor) {
        return null;
    }

    const openLinkDialog = () => {
        setLinkDialogOpen(true);
    };

    const setLink = (url: string) => {
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const handleImageSelect = (files: FileItem[]) => {
        if (files.length > 0) {
            editor.chain().focus().setImage({ src: files[0].url }).run();
        }
    };

    const handleHeadingChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value;
        if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
        } else if (value.startsWith('h')) {
            const level = parseInt(value.replace('h', '')) as 1 | 2 | 3;
            editor.chain().focus().toggleHeading({ level }).run();
        }
    };

    const getHeadingValue = () => {
        if (editor.isActive('heading', { level: 1 })) return 'h1';
        if (editor.isActive('heading', { level: 2 })) return 'h2';
        if (editor.isActive('heading', { level: 3 })) return 'h3';
        if (editor.isActive('heading', { level: 4 })) return 'h4';
        if (editor.isActive('heading', { level: 5 })) return 'h5';
        if (editor.isActive('heading', { level: 6 })) return 'h6';
        return 'paragraph';
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 1,
                mb: 1,
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.default,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 0.5,
                borderRadius: 0,
            }}
        >
            {/* Heading Selector */}
            {variant !== 'minimal' && (
                <>
                    <Select
                        value={getHeadingValue()}
                        onChange={handleHeadingChange}
                        size="small"
                        sx={{
                            minWidth: 120,
                            height: 32,
                            mr: 1,
                            '.MuiSelect-select': { py: 0.5, fontSize: '0.875rem' }
                        }}
                    >
                        <MenuItem value="paragraph">Paragraph</MenuItem>
                        <MenuItem value="h1">Heading 1</MenuItem>
                        <MenuItem value="h2">Heading 2</MenuItem>
                        <MenuItem value="h3">Heading 3</MenuItem>
                        <MenuItem value="h4">Heading 4</MenuItem>
                        <MenuItem value="h5">Heading 5</MenuItem>
                        <MenuItem value="h6">Heading 6</MenuItem>
                    </Select>
                    <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 0.5, height: 24 }} />
                </>
            )}

            {/* Formatting Group */}
            <Tooltip title="Bold">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    color={editor.isActive('bold') ? 'primary' : 'default'}
                >
                    <FormatBold fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Italic">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    color={editor.isActive('italic') ? 'primary' : 'default'}
                >
                    <FormatItalic fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Underline">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    color={editor.isActive('underline') ? 'primary' : 'default'}
                >
                    <FormatUnderlined fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Strike">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    color={editor.isActive('strike') ? 'primary' : 'default'}
                >
                    <FormatStrikethrough fontSize="small" />
                </IconButton>
            </Tooltip>

            <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 0.5, height: 24 }} />

            {/* Lists */}
            <Tooltip title="Bullet List">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    color={editor.isActive('bulletList') ? 'primary' : 'default'}
                >
                    <FormatListBulleted fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Ordered List">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    color={editor.isActive('orderedList') ? 'primary' : 'default'}
                >
                    <FormatListNumbered fontSize="small" />
                </IconButton>
            </Tooltip>

            {/* Alignment - Standard/Full Only */}
            {(variant === 'standard' || variant === 'full') && (
                <>
                    <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 0.5, height: 24 }} />
                    <Tooltip title="Align Left">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                            color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
                        >
                            <FormatAlignLeft fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Align Center">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                            color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
                        >
                            <FormatAlignCenter fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Align Right">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                            color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
                        >
                            <FormatAlignRight fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </>
            )}


            <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 0.5, height: 24 }} />

            {/* Link */}
            <Tooltip title="Insert Link">
                <IconButton
                    size="small"
                    onClick={openLinkDialog}
                    color={editor.isActive('link') ? 'primary' : 'default'}
                >
                    <LinkIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            {editor.isActive('link') && (
                <Tooltip title="Unlink">
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().unsetLink().run()}
                    >
                        <LinkOff fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}


            {/* Image */}
            <FileManagerButton
                accept="image/*"
                category="images"
                onSelect={handleImageSelect}
                trigger={
                    <Tooltip title="Insert Image">
                        <IconButton size="small">
                            <ImageIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                }
            />

            {variant !== 'minimal' && (
                <>
                    <Tooltip title="Blockquote">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            color={editor.isActive('blockquote') ? 'primary' : 'default'}
                        >
                            <FormatQuote fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Code Block">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                            color={editor.isActive('codeBlock') ? 'primary' : 'default'}
                        >
                            <Code fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <Tooltip title="Undo">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                >
                    <Undo fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Redo">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                >
                    <Redo fontSize="small" />
                </IconButton>
            </Tooltip>

            <LinkDialog
                open={linkDialogOpen}
                onClose={() => setLinkDialogOpen(false)}
                onSave={setLink}
                initialUrl={editor.getAttributes('link').href || ''}
            />
        </Paper>
    );
};

export default function RichTextEditor({
    value,
    onChange,
    variant = 'standard',
    label,
    placeholder,
    error,
    helperText,
    minHeight = 200
}: RichTextEditorProps) {
    const theme = useTheme();

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                autolink: true,
            }),
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Start writing...',
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph', 'image'],
            }),
            TextStyle,
            Color,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
                style: `min-height: ${typeof minHeight === 'number' ? `${minHeight}px` : minHeight}; padding: 16px; padding-top: 0;`,
            },
        },
        immediatelyRender: false,
    });

    // Update editor content if value changes externally
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            if (editor.getText() === '' && value === '<p></p>') return;
            if (editor.getHTML() !== value) {
                editor.commands.setContent(value);
            }
        }
    }, [value, editor]);


    return (
        <Box sx={{ width: '100%' }}>
            {label && (
                <Typography variant="body2" color={error ? 'error' : 'textSecondary'} sx={{ mb: 1, ml: 1 }}>
                    {label}
                </Typography>
            )}
            <Box
                sx={{
                    border: `1px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    overflow: 'hidden',
                    '&:hover': {
                        // Only apply hover border if not error
                        borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
                    },
                    '&:focus-within': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 0 0 1px ${theme.palette.primary.main}`
                    },
                    '& .ProseMirror': {
                        outline: 'none',
                        minHeight: minHeight,
                    },
                    '& .ProseMirror p.is-editor-empty:first-of-type::before': {
                        color: theme.palette.text.disabled,
                        content: 'attr(data-placeholder)',
                        float: 'left',
                        height: 0,
                        pointerEvents: 'none',
                    },
                    // Tiptap specific styling for image/code
                    '& .ProseMirror img': {
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: 4,
                    },
                    '& .ProseMirror pre': {
                        background: theme.palette.grey[900],
                        color: theme.palette.common.white,
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        fontFamily: 'monospace',
                    },
                    '& .ProseMirror blockquote': {
                        borderLeft: `3px solid ${theme.palette.grey[300]}`,
                        paddingLeft: '1rem',
                        marginLeft: 0,
                        marginRight: 0,
                        fontStyle: 'italic',
                    }
                }}
            >
                <MenuBar editor={editor} variant={variant} />
                <EditorContent editor={editor} />
            </Box>
            {helperText && (
                <Typography variant="caption" color={error ? 'error' : 'textSecondary'} sx={{ mt: 0.5, ml: 1.5 }}>
                    {helperText}
                </Typography>
            )}
        </Box>
    );
}
