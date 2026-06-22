import { useEditor, EditorContent, Editor, useEditorState } from '@tiptap/react';
import { Node, Mark, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import EmojiPicker from 'emoji-picker-react';
import { Box, IconButton, Select, MenuItem, Typography, Paper, Divider, Tooltip, useTheme, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, SelectChangeEvent, Tabs, Tab } from '@mui/material';
import {
    FormatBold, FormatItalic, FormatUnderlined, FormatStrikethrough,
    FormatListBulleted, FormatListNumbered, FormatQuote, Code,
    Undo, Redo, Image as ImageIcon, Link as LinkIcon,
    FormatAlignLeft, FormatAlignCenter, FormatAlignRight, LinkOff,
    Fullscreen, FullscreenExit, BorderColor,
    HelpOutline as HelpOutlineIcon, Delete as DeleteIcon,
    ArrowUpward as ArrowUpwardIcon, ArrowDownward as ArrowDownwardIcon,
    HorizontalRule as HorizontalRuleIcon, TableChart,
    TableRows, ViewColumn, DeleteSweep,
    FormatClear, AddReaction,
} from '@mui/icons-material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import { useEffect, useState, useCallback, useMemo } from 'react';
import FileManagerButton from './FileManagerButton';
import { FileItem } from '@/types/file';

// ---------------------------------------------------------------------------
// Helper – extract YouTube video ID from any YouTube URL
// ---------------------------------------------------------------------------
function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// ---------------------------------------------------------------------------
// Custom Tiptap Node – YouTube iframe embed
// ---------------------------------------------------------------------------
const YouTubeNode = Node.create({
    name: 'youtubeEmbed',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            src: { default: null },
            width: { default: '100%' },
            height: { default: '360' },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-youtube-embed]',
                getAttrs: (node) => {
                    const el = node as HTMLElement;
                    const iframe = el.querySelector('iframe');
                    return {
                        src: iframe?.getAttribute('src') ?? null,
                        width: iframe?.getAttribute('width') ?? '100%',
                        height: iframe?.getAttribute('height') ?? '360',
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            { 'data-youtube-embed': '', class: 'youtube-embed-wrapper' },
            [
                'iframe',
                mergeAttributes(
                    {
                        src: HTMLAttributes.src,
                        width: HTMLAttributes.width,
                        height: HTMLAttributes.height,
                        frameborder: '0',
                        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
                        referrerpolicy: 'strict-origin-when-cross-origin',
                        allowfullscreen: 'true',
                    }
                ),
            ],
        ];
    },
});

export interface FAQItem {
    question: string;
    answer: string;
}

const FAQBlock = Node.create({
    name: 'faqBlock',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            faqs: {
                default: [],
                parseHTML: (element) => {
                    const dataFaqs = element.getAttribute('data-faqs');
                    if (dataFaqs) {
                        try {
                            return JSON.parse(dataFaqs);
                        } catch {
                            return [];
                        }
                    }
                    return [];
                },
                renderHTML: (attributes) => {
                    return {
                        'data-faqs': JSON.stringify(attributes.faqs),
                    };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-faq-block]',
            },
        ];
    },

    renderHTML({ node }) {
        const faqs = (node.attrs.faqs as FAQItem[]) || [];

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': faqs.map((faq) => ({
                '@type': 'Question',
                'name': faq.question,
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': faq.answer,
                },
            })),
        };

        return [
            'div',
            { 'data-faq-block': 'true', 'data-faqs': JSON.stringify(faqs), class: 'faq-block-wrapper' },
            [
                'div',
                { class: 'faq-accordion-container' },
                ...faqs.map((faq) => [
                    'details',
                    { class: 'faq-item', itemscope: '', itemprop: 'mainEntity', itemtype: 'https://schema.org/Question' },
                    [
                        'summary',
                        { class: 'faq-question', itemprop: 'name' },
                        faq.question,
                    ],
                    [
                        'div',
                        { class: 'faq-answer', itemscope: '', itemprop: 'acceptedAnswer', itemtype: 'https://schema.org/Answer' },
                        [
                            'div',
                            { itemprop: 'text' },
                            faq.answer,
                        ],
                    ],
                ]),
            ],
            [
                'script',
                { type: 'application/ld+json' },
                JSON.stringify(jsonLd),
            ],
        ];
    },
});

const HighlightSpan = Mark.create({
    name: 'highlightSpan',
    parseHTML() {
        return [
            {
                tag: 'span',
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes), 0];
    },
});

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

// ---------------------------------------------------------------------------
// YouTube Dialog
// ---------------------------------------------------------------------------
const YouTubeDialog = ({ open, onClose, onEmbed }: { open: boolean; onClose: () => void; onEmbed: (videoId: string) => void }) => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');

    const handleEmbed = () => {
        const id = extractYouTubeId(url.trim());
        if (!id) {
            setError('Please enter a valid YouTube URL');
            return;
        }
        onEmbed(id);
        setUrl('');
        setError('');
        onClose();
    };

    const handleClose = () => {
        setUrl('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Embed YouTube Video</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="YouTube URL"
                    placeholder="https://www.youtube.com/watch?v=..."
                    fullWidth
                    variant="outlined"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setError(''); }}
                    error={!!error}
                    helperText={error || 'Paste any YouTube link (watch, youtu.be, or embed URL)'}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleEmbed} variant="contained" disabled={!url}>Embed</Button>
            </DialogActions>
        </Dialog>
    );
};

const ICON_GROUPS: Record<string, string[]> = {
    All: [],
    Essentials: ['✓', '✔', '✕', '✖', '★', '☆', '✦', '✧', '•', '◦', '→', '←', '↑', '↓', '↗', '↘', '↺', '↻', '⚡', '🔥', '💡', '📌', '📍', '❗', '❓', '✅', '☑', '⚠'],
    Arrows: ['→', '←', '↑', '↓', '↔', '↕', '↗', '↘', '↙', '↖', '➔', '➜', '➤', '➥', '➦', '➧', '➨', '➩', '➪', '➫', '➬', '➭', '➮', '➯'],
    Shapes: ['●', '○', '◉', '◌', '■', '□', '▪', '▫', '▲', '△', '▶', '▷', '▼', '▽', '◆', '◇', '◈', '◍', '⬟', '⬢', '⬡', '⬣', '⬤'],
    Blog: ['📝', '✍', '📖', '📚', '📗', '📘', '📙', '📒', '📔', '📓', '📄', '📃', '🗞', '📰', '🧠', '🎯', '📣', '📢', '💬', '🗨', '🧩', '✨'],
    Media: ['📷', '📸', '🎥', '🎬', '🎞', '📹', '🎙', '🎧', '🎵', '🎶', '🖼', '🧾', '🗂', '🗃', '🗄', '📁', '📂', '🧷', '📎', '🔗', '🖇'],
    Tech: ['💻', '🖥', '⌨', '🖱', '📱', '🔌', '🔋', '🛰', '🌐', '⚙', '🛠', '🔧', '🧰', '🧪', '🔬', '🤖', '🧬', '🔐', '🔒', '🔓', '🛡'],
    Business: ['💼', '📈', '📉', '📊', '💹', '🧮', '🏷', '🛒', '🛍', '📦', '🚚', '🏦', '💳', '💰', '💵', '💴', '💶', '💷', '🧾', '🗓', '📅'],
    UI: ['🔍', '🔎', '🔔', '🔕', '🛎', '⭐', '❤️', '🖤', '🩶', '🤍', '💙', '💚', '💛', '🧡', '💜', '🩷', '🧭', '📌', '📍', '🏁', '🚩'],
    Contact: ['☎', '📞', '📲', '✉', '📧', '📨', '📩', '💌', '📬', '📭', '🌍', '📍', '🏢', '🏠', '🌐', '🔗', '🆔', '👤', '👥', '🤝', '🫶'],
    Commerce: ['🛒', '🛍', '📦', '🏷', '💰', '💳', '💸', '🏪', '🚚', '📬', '✅', '⭐', '🔥', '🎁', '🎉', '🧾', '📈', '📉', '🧮', '🧷'],
    Social: ['👍', '👎', '👏', '🙌', '🤝', '🙏', '💬', '🗨', '🗯', '❤️', '💙', '💚', '💛', '💜', '🧡', '🖤', '🤍', '💯', '🔥', '✨', '🎉'],
    Legal: ['©', '®', '™', '℠', '§', '¶', '⚖', '🛡', '🔒', '🔓', '🧾', '📜', '📝', '🆔', '🔏', '🧷', '✅', '☑'],
};

ICON_GROUPS.All = Array.from(new Set(Object.values(ICON_GROUPS).flatMap((items) => items)));

const IconPickerDialog = ({
    open,
    onClose,
    onSelect,
}: {
    open: boolean;
    onClose: () => void;
    onSelect: (icon: string) => void;
}) => {
    const [pickerTab, setPickerTab] = useState<'symbols' | 'emoji'>('symbols');
    const [activeGroup, setActiveGroup] = useState<keyof typeof ICON_GROUPS>('All');
    const [query, setQuery] = useState('');
    const [customIcon, setCustomIcon] = useState('');

    const visibleIcons = useMemo(() => {
        const source = ICON_GROUPS[activeGroup] || ICON_GROUPS.All;
        if (!query.trim()) {
            return source;
        }

        const normalizedQuery = query.trim().toLowerCase();
        return source.filter((icon) => icon.toLowerCase().includes(normalizedQuery));
    }, [activeGroup, query]);

    const handleInsert = (icon: string) => {
        onSelect(icon);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Insert Icon</DialogTitle>
            <DialogContent>
                <Tabs
                    value={pickerTab}
                    onChange={(_, value) => setPickerTab(value)}
                    sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}
                >
                    <Tab value="symbols" label="Symbols" />
                    <Tab value="emoji" label="Emoji" />
                </Tabs>

                {pickerTab === 'symbols' && (
                    <>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, mt: 0.5 }}>
                            <Select
                                size="small"
                                value={activeGroup}
                                onChange={(e) => setActiveGroup(e.target.value as keyof typeof ICON_GROUPS)}
                                sx={{ minWidth: 160 }}
                            >
                                {Object.keys(ICON_GROUPS).map((groupName) => (
                                    <MenuItem key={groupName} value={groupName}>{groupName}</MenuItem>
                                ))}
                            </Select>
                            <TextField
                                size="small"
                                placeholder="Search icon"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                fullWidth
                            />
                        </Box>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 0.75, py: 0.5, maxHeight: 320, overflowY: 'auto' }}>
                            {visibleIcons.map((icon) => (
                                <Button
                                    key={`${activeGroup}-${icon}`}
                                    variant="outlined"
                                    onClick={() => handleInsert(icon)}
                                    sx={{ minWidth: 0, px: 0.75, py: 0.75, fontSize: '1.2rem' }}
                                >
                                    {icon}
                                </Button>
                            ))}
                        </Box>
                    </>
                )}

                {pickerTab === 'emoji' && (
                    <Box sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Includes complete Unicode emoji set with search and categories (WhatsApp-style use).
                        </Typography>
                        <EmojiPicker
                            onEmojiClick={(emojiData) => handleInsert(emojiData.emoji)}
                            width="100%"
                            height={380}
                            lazyLoadEmojis
                            searchDisabled={false}
                        />
                    </Box>
                )}

                <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                    <TextField
                        size="small"
                        label="Custom icon"
                        placeholder="Paste any emoji/symbol"
                        value={customIcon}
                        onChange={(e) => setCustomIcon(e.target.value)}
                        fullWidth
                    />
                    <Button
                        variant="contained"
                        onClick={() => handleInsert(customIcon)}
                        disabled={!customIcon.trim()}
                    >
                        Insert
                    </Button>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

// ---------------------------------------------------------------------------
// FAQ Dialog
// ---------------------------------------------------------------------------
const FAQDialog = ({
    open,
    onClose,
    onSave,
    onDelete,
    initialFaqs,
    showDelete
}: {
    open: boolean;
    onClose: () => void;
    onSave: (faqs: FAQItem[]) => void;
    onDelete?: () => void;
    initialFaqs: FAQItem[];
    showDelete?: boolean;
}) => {
    const [faqs, setFaqs] = useState<FAQItem[]>([]);

    useEffect(() => {
        if (open) {
            setFaqs(initialFaqs.length > 0 ? [...initialFaqs] : [{ question: '', answer: '' }]);
        }
    }, [open, initialFaqs]);

    const handleAdd = () => {
        setFaqs([...faqs, { question: '', answer: '' }]);
    };

    const handleRemove = (index: number) => {
        setFaqs(faqs.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof FAQItem, value: string) => {
        const newFaqs = [...faqs];
        newFaqs[index] = {
            ...newFaqs[index],
            [field]: value
        };
        setFaqs(newFaqs);
    };

    const handleMoveUp = (index: number) => {
        if (index === 0) return;
        const newFaqs = [...faqs];
        const temp = newFaqs[index];
        newFaqs[index] = newFaqs[index - 1];
        newFaqs[index - 1] = temp;
        setFaqs(newFaqs);
    };

    const handleMoveDown = (index: number) => {
        if (index === faqs.length - 1) return;
        const newFaqs = [...faqs];
        const temp = newFaqs[index];
        newFaqs[index] = newFaqs[index + 1];
        newFaqs[index + 1] = temp;
        setFaqs(newFaqs);
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete();
        }
        onClose();
    };

    const handleSave = () => {
        const filteredFaqs = faqs.filter(f => f.question.trim() !== '' && f.answer.trim() !== '');
        onSave(filteredFaqs);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ py: 1, px: 2, fontSize: '1.1rem' }}>Manage FAQs</DialogTitle>
            <DialogContent dividers sx={{ maxHeight: '75vh', overflowY: 'auto', p: 1.5 }}>
                {faqs.map((faq, index) => (
                    <Box key={index} sx={{ mb: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, backgroundColor: 'background.paper' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.8rem' }}>FAQ Item #{index + 1}</Typography>
                            <Box sx={{ display: 'flex', gap: 0.25 }}>
                                <IconButton size="small" onClick={() => handleMoveUp(index)} disabled={index === 0} sx={{ p: 0.25 }}>
                                    <ArrowUpwardIcon sx={{ fontSize: '1.1rem' }} />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleMoveDown(index)} disabled={index === faqs.length - 1} sx={{ p: 0.25 }}>
                                    <ArrowDownwardIcon sx={{ fontSize: '1.1rem' }} />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => handleRemove(index)} sx={{ p: 0.25 }}>
                                    <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                                </IconButton>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', md: 'row' } }}>
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    size="small"
                                    label="Question"
                                    fullWidth
                                    variant="outlined"
                                    value={faq.question}
                                    onChange={(e) => handleChange(index, 'question', e.target.value)}
                                />
                            </Box>
                            <Box sx={{ flex: 1.5 }}>
                                <TextField
                                    size="small"
                                    label="Answer"
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    maxRows={6}
                                    variant="outlined"
                                    value={faq.answer}
                                    onChange={(e) => handleChange(index, 'answer', e.target.value)}
                                />
                            </Box>
                        </Box>
                    </Box>
                ))}
                <Button onClick={handleAdd} variant="outlined" fullWidth sx={{ mt: 0.5, py: 0.5, fontSize: '0.85rem' }}>
                    + Add FAQ Item
                </Button>
            </DialogContent>
            <DialogActions sx={{ px: 2, py: 1 }}>
                {showDelete && onDelete && (
                    <Button onClick={handleDelete} color="error" variant="outlined" size="small" sx={{ mr: 'auto' }}>
                        Delete FAQs
                    </Button>
                )}
                <Button onClick={onClose} size="small">Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary" size="small">Save FAQs</Button>
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
    const [youtubeDialogOpen, setYoutubeDialogOpen] = useState(false);
    const [faqDialogOpen, setFaqDialogOpen] = useState(false);
    const [iconDialogOpen, setIconDialogOpen] = useState(false);
    const theme = useTheme();

    const editorState = useEditorState({
        editor,
        selector: ({ editor }) => {
            if (!editor) {
                return {
                    headingValue: 'paragraph',
                    canUndo: false,
                    canRedo: false,
                };
            }

            let headingValue = 'paragraph';
            if (editor.isActive('heading', { level: 1 })) headingValue = 'h1';
            else if (editor.isActive('heading', { level: 2 })) headingValue = 'h2';
            else if (editor.isActive('heading', { level: 3 })) headingValue = 'h3';
            else if (editor.isActive('heading', { level: 4 })) headingValue = 'h4';
            else if (editor.isActive('heading', { level: 5 })) headingValue = 'h5';
            else if (editor.isActive('heading', { level: 6 })) headingValue = 'h6';

            return {
                headingValue,
                canUndo: editor.can().undo(),
                canRedo: editor.can().redo(),
            };
        },
    });
    const menuState = editorState ?? {
        headingValue: 'paragraph',
        canUndo: false,
        canRedo: false,
    };

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

    const handleYoutubeEmbed = (videoId: string) => {
        const src = `https://www.youtube.com/embed/${videoId}`;
        editor.commands.focus();
        editor.commands.insertContent({
            type: 'youtubeEmbed',
            attrs: { src, width: '100%', height: '360' },
        });
    };

    const handleIconInsert = (icon: string) => {
        editor.chain().focus().insertContent(icon).run();
    };

    const getFaqDetails = () => {
        let exists = false;
        let faqs: FAQItem[] = [];
        let pos = -1;
        let nodeSize = 0;
        editor.state.doc.descendants((node, position) => {
            if (node.type.name === 'faqBlock') {
                exists = true;
                faqs = node.attrs.faqs || [];
                pos = position;
                nodeSize = node.nodeSize;
                return false;
            }
        });
        return { exists, faqs, pos, nodeSize };
    };

    const faqDetails = getFaqDetails();

    const handleFaqSave = (faqs: FAQItem[]) => {
        editor.commands.focus();
        const { exists, pos } = getFaqDetails();
        if (exists && pos !== -1) {
            editor.chain().focus().setNodeSelection(pos).updateAttributes('faqBlock', { faqs }).run();
        } else {
            editor.chain().focus().insertContent({
                type: 'faqBlock',
                attrs: { faqs }
            }).run();
        }
    };

    const handleDeleteFaq = () => {
        const { exists, pos, nodeSize } = getFaqDetails();
        if (exists && pos !== -1) {
            editor.chain().focus().deleteRange({ from: pos, to: pos + nodeSize }).run();
        }
    };

    const getActiveFaqs = (): FAQItem[] => {
        const { exists, faqs } = getFaqDetails();
        if (exists) {
            return faqs;
        }
        return [];
    };

    const handleHeadingChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value;
        if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
        } else if (value.startsWith('h')) {
            const level = parseInt(value.replace('h', ''), 10) as 1 | 2 | 3 | 4 | 5 | 6;
            editor.chain().focus().toggleHeading({ level }).run();
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                p: 1,
                mb: 1,
                position: 'sticky',
                top: 0,
                zIndex: 10,
                borderBottom: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.default,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 0.5,
                borderRadius: `${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0 0`,
            }}
        >
            {/* Heading Selector */}
            {variant !== 'minimal' && (
                <>
                    <Select
                        value={menuState.headingValue}
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
            <Tooltip title="Highlight Text (Span)">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleMark('highlightSpan').run()}
                    color={editor.isActive('highlightSpan') ? 'primary' : 'default'}
                >
                    <BorderColor fontSize="small" />
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

            {/* YouTube Embed – Full variant only */}
            {variant === 'full' && (
                <Tooltip title="Embed YouTube Video">
                    <IconButton size="small" onClick={() => setYoutubeDialogOpen(true)}>
                        <YouTubeIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}

            {/* FAQ Manager – Standard or Full variants */}
            {variant !== 'minimal' && (
                <Tooltip title={faqDetails.exists ? 'Edit FAQs' : 'Insert FAQs'}>
                    <IconButton
                        size="small"
                        onClick={() => setFaqDialogOpen(true)}
                        color={faqDetails.exists ? 'primary' : 'default'}
                    >
                        <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}

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

            {variant === 'full' && (
                <>
                    <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 0.5, height: 24 }} />
                    <Tooltip title="Insert Horizontal Line">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().setHorizontalRule().run()}
                            color={editor.isActive('horizontalRule') ? 'primary' : 'default'}
                        >
                            <HorizontalRuleIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Insert Icon">
                        <IconButton size="small" onClick={() => setIconDialogOpen(true)}>
                            <AddReaction fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove Formatting">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                        >
                            <FormatClear fontSize="small" />
                        </IconButton>
                    </Tooltip>

                    <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 0.5, height: 24 }} />
                    <Tooltip title="Insert Table (3x3)">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                            color={editor.isActive('table') ? 'primary' : 'default'}
                        >
                            <TableChart fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Add Row">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().addRowAfter().run()}
                            disabled={!editor.isActive('table')}
                        >
                            <TableRows fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Row">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().deleteRow().run()}
                            disabled={!editor.isActive('table')}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Add Column">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().addColumnAfter().run()}
                            disabled={!editor.isActive('table')}
                        >
                            <ViewColumn fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Column">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().deleteColumn().run()}
                            disabled={!editor.isActive('table')}
                        >
                            <DeleteSweep fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Table">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().deleteTable().run()}
                            disabled={!editor.isActive('table')}
                        >
                            <TableChart fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <Tooltip title="Undo">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!menuState.canUndo}
                >
                    <Undo fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Redo">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!menuState.canRedo}
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

            <YouTubeDialog
                open={youtubeDialogOpen}
                onClose={() => setYoutubeDialogOpen(false)}
                onEmbed={handleYoutubeEmbed}
            />

            <IconPickerDialog
                open={iconDialogOpen}
                onClose={() => setIconDialogOpen(false)}
                onSelect={handleIconInsert}
            />

            <FAQDialog
                open={faqDialogOpen}
                onClose={() => setFaqDialogOpen(false)}
                onSave={handleFaqSave}
                onDelete={handleDeleteFaq}
                initialFaqs={getActiveFaqs()}
                showDelete={faqDetails.exists}
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
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            YouTubeNode,
            HighlightSpan,
            FAQBlock,
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
                    '& .ProseMirror': fullscreenMode ? { minHeight: 'calc(100vh - 120px)' } : {},
                    maxHeight: '65vh',
                    overflowY: 'auto',
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
                        whiteSpace: 'pre-wrap',
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

                        // Tables
                        '& table': {
                            borderCollapse: 'collapse',
                            tableLayout: 'fixed',
                            width: '100%',
                            marginTop: '1.2em',
                            marginBottom: '1.2em',
                            overflow: 'hidden',
                        },
                        '& table td, & table th': {
                            border: `1px solid ${theme.palette.divider}`,
                            minWidth: '1em',
                            padding: '0.6rem 0.7rem',
                            verticalAlign: 'top',
                        },
                        '& table th': {
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                            fontWeight: 700,
                            textAlign: 'left',
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
                    '& .ProseMirror .youtube-embed-wrapper': {
                        position: 'relative',
                        width: '100%',
                        paddingBottom: '56.25%',
                        height: 0,
                        marginTop: '1.2em',
                        marginBottom: '1.2em',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        '& iframe': {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 0,
                        },
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
                            whiteSpace: 'pre-wrap',
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

                            // Tables
                            '& table': {
                                borderCollapse: 'collapse',
                                tableLayout: 'fixed',
                                width: '100%',
                                marginTop: '1.2em',
                                marginBottom: '1.2em',
                            },
                            '& table td, & table th': {
                                border: `1px solid ${theme.palette.divider}`,
                                minWidth: '1em',
                                padding: '0.6rem 0.7rem',
                                verticalAlign: 'top',
                            },
                            '& table th': {
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                                fontWeight: 700,
                                textAlign: 'left',
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
