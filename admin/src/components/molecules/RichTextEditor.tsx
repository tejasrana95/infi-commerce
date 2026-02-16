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
    FormatAlignLeft, FormatAlignCenter, FormatAlignRight, FormatAlignJustify, LinkOff, CodeOff,
    Fullscreen, FullscreenExit,
} from '@mui/icons-material';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
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
    showSourceToggle?: boolean; // Allow switching to HTML source mode
    showFullscreen?: boolean; // Allow fullscreen editing mode
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
    showSourceToggle?: boolean;
    sourceMode: boolean;
    onSourceToggle: () => void;
    showFullscreen?: boolean;
    isFullscreen?: boolean;
    onFullscreenToggle?: () => void;
}

const MenuBar = ({ editor, variant, showSourceToggle, sourceMode, onSourceToggle, showFullscreen, isFullscreen, onFullscreenToggle }: MenuBarProps) => {
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

            {/* Source Code Toggle */}
            {showSourceToggle && (
                <>
                    <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 0.5, height: 24 }} />
                    <Tooltip title={sourceMode ? 'Visual Editor' : 'HTML Source'}>
                        <IconButton
                            size="small"
                            onClick={onSourceToggle}
                            color={sourceMode ? 'primary' : 'default'}
                        >
                            <IntegrationInstructionsIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </>
            )}

            {/* Fullscreen Toggle */}
            {showFullscreen && onFullscreenToggle && (
                <>
                    <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 0.5, height: 24 }} />
                    <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                        <IconButton
                            size="small"
                            onClick={onFullscreenToggle}
                            color={isFullscreen ? 'primary' : 'default'}
                        >
                            {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
                        </IconButton>
                    </Tooltip>
                </>
            )}
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
    minHeight = 200,
    showSourceToggle = false,
    showFullscreen = false,
}: RichTextEditorProps) {
    const theme = useTheme();
    const [sourceMode, setSourceMode] = useState(false);
    const [sourceValue, setSourceValue] = useState(value);
    const [isFullscreen, setIsFullscreen] = useState(false);

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
        // Keep source view in sync
        if (!sourceMode) {
            setSourceValue(value);
        }
    }, [value, editor, sourceMode]);

    // Handle source mode toggle
    const handleSourceToggle = useCallback(() => {
        if (sourceMode) {
            // Switching from source to visual - apply source changes
            if (editor) {
                editor.commands.setContent(sourceValue);
            }
            onChange(sourceValue);
        } else {
            // Switching to source mode - sync source value
            setSourceValue(editor?.getHTML() || value);
        }
        setSourceMode(!sourceMode);
    }, [sourceMode, sourceValue, editor, value, onChange]);

    // Handle source textarea changes
    const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSourceValue(e.target.value);
    };

    // Apply source changes on blur
    const handleSourceBlur = () => {
        if (editor) {
            editor.commands.setContent(sourceValue);
        }
        onChange(sourceValue);
    };

    // Editor content component (reused in both normal and fullscreen mode)
    const renderEditorContent = (fullscreenMode?: boolean) => (
        <>
            <MenuBar
                editor={editor}
                variant={variant}
                showSourceToggle={showSourceToggle}
                sourceMode={sourceMode}
                onSourceToggle={handleSourceToggle}
                showFullscreen={showFullscreen}
                isFullscreen={isFullscreen}
                onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
            />

            {sourceMode ? (
                <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <textarea
                        value={sourceValue}
                        onChange={handleSourceChange}
                        onBlur={handleSourceBlur}
                        style={{
                            width: '100%',
                            flex: 1,
                            minHeight: fullscreenMode ? 'calc(100vh - 150px)' : (typeof minHeight === 'number' ? minHeight : 200),
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            lineHeight: 1.5,
                            padding: '12px',
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: '4px',
                            backgroundColor: theme.palette.grey[900],
                            color: theme.palette.common.white,
                            resize: fullscreenMode ? 'none' : 'vertical',
                        }}
                        placeholder="<p>Enter HTML code here...</p>"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        Editing HTML source. Click the code icon to switch back to visual editor.
                    </Typography>
                </Box>
            ) : (
                <Box sx={{
                    flex: fullscreenMode ? 1 : undefined,
                    overflow: fullscreenMode ? 'auto' : undefined,
                    '& .ProseMirror': fullscreenMode ? { minHeight: 'calc(100vh - 120px)' } : {}
                }}>
                    <EditorContent editor={editor} />
                </Box>
            )}
        </>
    );

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
                        borderColor: error ? theme.palette.error.main : theme.palette.primary.main,
                    },
                    '&:focus-within': {
                        borderColor: theme.palette.primary.main,
                        boxShadow: `0 0 0 1px ${theme.palette.primary.main}`
                    },
                    '& .ProseMirror': {
                        outline: 'none',
                        minHeight: minHeight,
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontSize: '15px',
                        lineHeight: '1.7',
                        color: theme.palette.text.primary,

                        // Headings
                        '& h1': {
                            fontSize: '2em',
                            fontWeight: 700,
                            lineHeight: 1.3,
                            marginTop: '1.5em',
                            marginBottom: '0.5em',
                            color: theme.palette.text.primary,
                            letterSpacing: '-0.02em',
                            '&:first-child': { marginTop: 0 },
                        },
                        '& h2': {
                            fontSize: '1.65em',
                            fontWeight: 700,
                            lineHeight: 1.35,
                            marginTop: '1.4em',
                            marginBottom: '0.5em',
                            color: theme.palette.text.primary,
                            letterSpacing: '-0.015em',
                            '&:first-child': { marginTop: 0 },
                        },
                        '& h3': {
                            fontSize: '1.35em',
                            fontWeight: 600,
                            lineHeight: 1.4,
                            marginTop: '1.3em',
                            marginBottom: '0.5em',
                            color: theme.palette.text.primary,
                            letterSpacing: '-0.01em',
                            '&:first-child': { marginTop: 0 },
                        },
                        '& h4': {
                            fontSize: '1.15em',
                            fontWeight: 600,
                            lineHeight: 1.45,
                            marginTop: '1.2em',
                            marginBottom: '0.5em',
                            color: theme.palette.text.primary,
                            '&:first-child': { marginTop: 0 },
                        },
                        '& h5': {
                            fontSize: '1em',
                            fontWeight: 600,
                            lineHeight: 1.5,
                            marginTop: '1.1em',
                            marginBottom: '0.5em',
                            color: theme.palette.text.primary,
                            '&:first-child': { marginTop: 0 },
                        },
                        '& h6': {
                            fontSize: '0.95em',
                            fontWeight: 600,
                            lineHeight: 1.5,
                            marginTop: '1em',
                            marginBottom: '0.5em',
                            color: theme.palette.text.secondary,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            '&:first-child': { marginTop: 0 },
                        },

                        // Paragraphs
                        '& p': {
                            marginTop: '0.75em',
                            marginBottom: '0.75em',
                            lineHeight: 1.7,
                            '&:first-child': { marginTop: 0 },
                            '&:last-child': { marginBottom: 0 },
                        },

                        // Lists
                        '& ul, & ol': {
                            paddingLeft: '1.8em',
                            marginTop: '0.85em',
                            marginBottom: '0.85em',
                            '&:first-child': { marginTop: 0 },
                            '&:last-child': { marginBottom: 0 },
                        },
                        '& ul': {
                            listStyleType: 'disc',
                        },
                        '& ol': {
                            listStyleType: 'decimal',
                        },
                        '& li': {
                            marginTop: '0.5em',
                            marginBottom: '0.5em',
                            paddingLeft: '0.3em',
                            lineHeight: 1.7,
                            '& p': {
                                marginTop: '0.5em',
                                marginBottom: '0.5em',
                            },
                        },
                        '& ul ul, & ul ol, & ol ul, & ol ol': {
                            marginTop: '0.5em',
                            marginBottom: '0.5em',
                        },

                        // Strong and emphasis
                        '& strong, & b': {
                            fontWeight: 600,
                            color: theme.palette.text.primary,
                        },
                        '& em, & i': {
                            fontStyle: 'italic',
                        },
                        '& u': {
                            textDecoration: 'underline',
                            textDecorationColor: theme.palette.primary.main,
                            textDecorationThickness: '2px',
                        },
                        '& s, & strike': {
                            textDecoration: 'line-through',
                            opacity: 0.7,
                        },

                        // Links
                        '& a': {
                            color: theme.palette.primary.main,
                            textDecoration: 'underline',
                            textDecorationColor: 'rgba(59, 130, 246, 0.3)',
                            textDecorationThickness: '2px',
                            textUnderlineOffset: '2px',
                            transition: 'all 0.2s',
                            '&:hover': {
                                textDecorationColor: theme.palette.primary.main,
                                backgroundColor: 'rgba(59, 130, 246, 0.08)',
                            },
                        },

                        // Code
                        '& code': {
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                            color: theme.palette.mode === 'dark' ? '#e879f9' : '#e11d48',
                            padding: '0.15em 0.4em',
                            borderRadius: '4px',
                            fontSize: '0.9em',
                            fontFamily: '"Fira Code", "SF Mono", Monaco, monospace',
                            fontWeight: 500,
                        },

                        // Blockquotes
                        '& blockquote': {
                            borderLeft: `4px solid ${theme.palette.primary.main}`,
                            paddingLeft: '1.2em',
                            marginLeft: 0,
                            marginRight: 0,
                            marginTop: '1.2em',
                            marginBottom: '1.2em',
                            fontStyle: 'italic',
                            color: theme.palette.text.secondary,
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                            paddingTop: '0.8em',
                            paddingBottom: '0.8em',
                            paddingRight: '1em',
                            borderRadius: '0 8px 8px 0',
                            '& p': {
                                fontSize: '1.05em',
                                lineHeight: 1.6,
                            },
                        },

                        // Horizontal rule
                        '& hr': {
                            border: 'none',
                            borderTop: `2px solid ${theme.palette.divider}`,
                            marginTop: '2em',
                            marginBottom: '2em',
                        },
                    },
                    '& .ProseMirror p.is-editor-empty:first-of-type::before': {
                        color: theme.palette.text.disabled,
                        content: 'attr(data-placeholder)',
                        float: 'left',
                        height: 0,
                        pointerEvents: 'none',
                    },
                    '& .ProseMirror img': {
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: 8,
                        marginTop: '1em',
                        marginBottom: '1em',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    },
                    '& .ProseMirror pre': {
                        background: theme.palette.mode === 'dark' ? '#1e293b' : '#1e1e1e',
                        color: theme.palette.common.white,
                        padding: '1rem 1.25rem',
                        borderRadius: '8px',
                        fontFamily: '"Fira Code", "SF Mono", Monaco, monospace',
                        fontSize: '0.9em',
                        lineHeight: 1.6,
                        marginTop: '1.2em',
                        marginBottom: '1.2em',
                        overflow: 'auto',
                        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        '& code': {
                            background: 'transparent',
                            color: 'inherit',
                            padding: 0,
                            borderRadius: 0,
                            fontSize: 'inherit',
                            fontWeight: 'normal',
                        },
                    },
                }}
            >
                {renderEditorContent()}
            </Box>
            {helperText && (
                <Typography variant="caption" color={error ? 'error' : 'textSecondary'} sx={{ mt: 0.5, ml: 1.5 }}>
                    {helperText}
                </Typography>
            )}

            {/* Fullscreen Dialog */}
            <Dialog
                open={isFullscreen}
                onClose={() => setIsFullscreen(false)}
                fullScreen
                PaperProps={{
                    sx: {
                        bgcolor: 'background.paper',
                        display: 'flex',
                        flexDirection: 'column',
                        '& .ProseMirror': {
                            outline: 'none',
                            flex: 1,
                            minHeight: 'calc(100vh - 100px)',
                            padding: '24px',
                            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            fontSize: '15px',
                            lineHeight: '1.7',
                            color: theme.palette.text.primary,

                            // Headings
                            '& h1': {
                                fontSize: '2em',
                                fontWeight: 700,
                                lineHeight: 1.3,
                                marginTop: '1.5em',
                                marginBottom: '0.5em',
                                color: theme.palette.text.primary,
                                letterSpacing: '-0.02em',
                                '&:first-child': { marginTop: 0 },
                            },
                            '& h2': {
                                fontSize: '1.65em',
                                fontWeight: 700,
                                lineHeight: 1.35,
                                marginTop: '1.4em',
                                marginBottom: '0.5em',
                                color: theme.palette.text.primary,
                                letterSpacing: '-0.015em',
                                '&:first-child': { marginTop: 0 },
                            },
                            '& h3': {
                                fontSize: '1.35em',
                                fontWeight: 600,
                                lineHeight: 1.4,
                                marginTop: '1.3em',
                                marginBottom: '0.5em',
                                color: theme.palette.text.primary,
                                letterSpacing: '-0.01em',
                                '&:first-child': { marginTop: 0 },
                            },
                            '& h4, & h5, & h6': {
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                                marginTop: '1.2em',
                                marginBottom: '0.5em',
                                '&:first-child': { marginTop: 0 },
                            },

                            // Paragraphs
                            '& p': {
                                marginTop: '0.75em',
                                marginBottom: '0.75em',
                                lineHeight: 1.7,
                                '&:first-child': { marginTop: 0 },
                                '&:last-child': { marginBottom: 0 },
                            },

                            // Lists
                            '& ul, & ol': {
                                paddingLeft: '1.8em',
                                marginTop: '0.85em',
                                marginBottom: '0.85em',
                            },
                            '& li': {
                                marginTop: '0.5em',
                                marginBottom: '0.5em',
                                paddingLeft: '0.3em',
                                lineHeight: 1.7,
                            },

                            // Strong and emphasis
                            '& strong, & b': {
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                            },
                            '& em, & i': {
                                fontStyle: 'italic',
                            },
                            '& u': {
                                textDecoration: 'underline',
                                textDecorationColor: theme.palette.primary.main,
                                textDecorationThickness: '2px',
                            },

                            // Links
                            '& a': {
                                color: theme.palette.primary.main,
                                textDecoration: 'underline',
                                textDecorationColor: 'rgba(59, 130, 246, 0.3)',
                                textDecorationThickness: '2px',
                                textUnderlineOffset: '2px',
                            },
                        },
                        '& .ProseMirror p.is-editor-empty:first-of-type::before': {
                            color: theme.palette.text.disabled,
                            content: 'attr(data-placeholder)',
                            float: 'left',
                            height: 0,
                            pointerEvents: 'none',
                        },
                        '& .ProseMirror img': {
                            maxWidth: '100%',
                            height: 'auto',
                            borderRadius: 8,
                            marginTop: '1em',
                            marginBottom: '1em',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        },
                        '& .ProseMirror pre': {
                            background: theme.palette.mode === 'dark' ? '#1e293b' : '#1e1e1e',
                            color: theme.palette.common.white,
                            padding: '1rem 1.25rem',
                            borderRadius: '8px',
                            fontFamily: '"Fira Code", "SF Mono", Monaco, monospace',
                            fontSize: '0.9em',
                            lineHeight: 1.6,
                            marginTop: '1.2em',
                            marginBottom: '1.2em',
                            overflow: 'auto',
                            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        },
                        '& .ProseMirror blockquote': {
                            borderLeft: `4px solid ${theme.palette.primary.main}`,
                            paddingLeft: '1.2em',
                            marginLeft: 0,
                            marginRight: 0,
                            marginTop: '1.2em',
                            marginBottom: '1.2em',
                            fontStyle: 'italic',
                            color: theme.palette.text.secondary,
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                            paddingTop: '0.8em',
                            paddingBottom: '0.8em',
                            paddingRight: '1em',
                            borderRadius: '0 8px 8px 0',
                        }
                    }
                }}
            >
                {renderEditorContent(true)}
            </Dialog>
        </Box>
    );
}
