'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Typography,
    Button,
    IconButton,
    Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { useRouter } from 'next/navigation';
import { FormSubmission } from '@/types';
import api from '@/lib/api';
import { format } from 'date-fns';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
} from '@mui/material';
import { useConfirm } from '@/contexts/ConfirmContext';

const SubmissionDetailDialog = ({ open, onClose, submission, form }: { open: boolean, onClose: () => void, submission: FormSubmission | null, form: any }) => {
    if (!submission || !form) return null;

    // Get label map
    const fieldLabelMap: Record<string, string> = {};
    const fieldTypeMap: Record<string, string> = {};
    const subFieldsMap: Record<string, any[]> = {};

    form.sections?.forEach((section: any) => {
        const fields = [...(section.fields || [])];
        if (section.columns) {
            section.columns.forEach((col: any) => fields.push(...(col.fields || [])));
        }
        fields.forEach((field: any) => {
            fieldLabelMap[field.name] = field.label;
            fieldTypeMap[field.name] = field.type;
            if (field.subFields) {
                subFieldsMap[field.name] = field.subFields;
            }
        });
    });

    const renderValue = (key: string, value: any) => {
        const type = fieldTypeMap[key];
        if (type === 'repeater' && typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    const subFields = subFieldsMap[key] || [];
                    const subLabelMap = subFields.reduce((acc, f) => ({ ...acc, [f.name]: f.label }), {} as any);

                    return (
                        <Box sx={{ mt: 1, pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                            {parsed.map((item, idx) => (
                                <Box key={idx} sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" color="primary">Item #{idx + 1}</Typography>
                                    {Object.entries(item).map(([sk, sv]) => (
                                        <Typography key={sk} variant="body2">
                                            <strong>{subLabelMap[sk] || sk}:</strong> {String(sv)}
                                        </Typography>
                                    ))}
                                </Box>
                            ))}
                        </Box>
                    );
                }
            } catch (e) { return String(value); }
        }
        if (type === 'file' || type === 'image') {
            return (
                <Button
                    href={`${value}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="text"
                    size="small"
                    startIcon={type === 'image' ? <ImageIcon /> : <InsertDriveFileIcon />}
                >
                    View File
                </Button>
            );
        }
        return String(value);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ fontWeight: 600 }}>Submission Details</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Submission ID</Typography>
                        <Typography variant="body1">{submission._id}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" color="text.secondary" display="block">Submitted At</Typography>
                        <Typography variant="body1">
                            {format(new Date(submission.createdAt), 'MMM d, yyyy HH:mm:ss')}
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Form Data</Typography>
                        <Grid container spacing={2}>
                            {Object.entries(submission.data).map(([key, value]) => (
                                <Grid size={{ xs: 12 }} key={key} sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1 }}>
                                        {fieldLabelMap[key] || key}
                                    </Typography>
                                    <Box>{renderValue(key, value)}</Box>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>

                    {submission.files && submission.files.length > 0 && (
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Uploaded Files</Typography>
                            <List>
                                {submission.files.map((file, idx) => (
                                    <ListItem key={idx} divider>
                                        <ListItemText
                                            primary={fieldLabelMap[file.fieldName] || file.fieldName}
                                            secondary={`${file.fileName} (${(file.fileSize / 1024).toFixed(2)} KB)`}
                                        />
                                        <ListItemSecondaryAction>
                                            <IconButton
                                                edge="end"
                                                href={file.fileUrl}
                                                target="_blank"
                                                title="Download"
                                            >
                                                <DownloadIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                ))}
                            </List>
                        </Grid>
                    )}

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Metadata</Typography>
                        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                            <Typography variant="body2"><strong>IP:</strong> {submission.metadata.ip}</Typography>
                            <Typography variant="body2"><strong>User Agent:</strong> {submission.metadata.userAgent}</Typography>
                            {submission.metadata.referer && (
                                <Typography variant="body2"><strong>Referer:</strong> {submission.metadata.referer}</Typography>
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained">Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default function FormSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [total, setTotal] = useState(0);
    const [form, setForm] = useState<any>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const { confirm } = useConfirm();

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/forms/${resolvedParams.id}/submissions`, {
                params: {
                    page: page + 1,
                    limit: rowsPerPage,
                },
            });

            // Also fetch form details if not already fetched
            if (!form) {
                const formResponse = await api.get(`/forms/${resolvedParams.id}`);
                setForm(formResponse.data.form);
            }

            setSubmissions(response.data.submissions);
            setTotal(response.data.pagination.total);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [page, rowsPerPage]);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDelete = async (id: string) => {
        if (!await confirm({ title: 'Delete Submission', message: 'Are you sure you want to delete this submission?', severity: 'error' })) return;

        try {
            await api.delete(`/forms/${resolvedParams.id}/submissions/${id}`);
            fetchSubmissions();
        } catch (error) {
            console.error('Error deleting submission:', error);
        }
    };

    const exportToCSV = () => {
        if (submissions.length === 0) return;

        // Get all unique field names from submissions
        const allFields = new Set<string>();
        submissions.forEach(sub => {
            Object.keys(sub.data).forEach(key => allFields.add(key));
        });

        const fieldNames = Array.from(allFields);
        const headers = ['Submission ID', 'Created At', ...fieldNames, 'IP', 'Email Sent'];

        const csvContent = [
            headers.join(','),
            ...submissions.map(sub =>
                [
                    sub._id,
                    format(new Date(sub.createdAt), 'yyyy-MM-dd HH:mm:ss'),
                    ...fieldNames.map(field => {
                        const value = sub.data[field];
                        if (typeof value === 'string') {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value || '';
                    }),
                    sub.metadata.ip || '',
                    sub.emailSent ? 'Yes' : 'No',
                ].join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const formName = form?.name || 'form';
        a.download = `${formName.replace(/[^a-z0-9]/gi, '_')}_submissions_${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.push('/forms')}
                        variant="outlined"
                    >
                        Back to Forms
                    </Button>
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                            Form Submissions
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {form?.name}
                        </Typography>
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={exportToCSV}
                    disabled={submissions.length === 0}
                >
                    Export to CSV
                </Button>
            </Box>

            {/* Table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Submitted At</TableCell>
                                <TableCell>Data Preview</TableCell>
                                <TableCell>IP Address</TableCell>
                                <TableCell>Email Status</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : submissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        No submissions yet
                                    </TableCell>
                                </TableRow>
                            ) : (
                                submissions.map((submission) => (
                                    <TableRow key={submission._id} hover>
                                        <TableCell>
                                            <code style={{ fontSize: '0.75rem' }}>
                                                {submission._id.substring(0, 8)}...
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(submission.createdAt), 'MMM d, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {Object.entries(submission.data).slice(0, 3).map(([key, value]) => (
                                                    <Typography key={key} variant="caption" display="block">
                                                        <strong>{key}:</strong> {String(value)}
                                                    </Typography>
                                                ))}
                                                {Object.keys(submission.data).length > 3 && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        +{Object.keys(submission.data).length - 3} more fields
                                                    </Typography>
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{submission.metadata.ip || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={submission.emailSent ? 'Sent' : 'Pending'}
                                                size="small"
                                                color={submission.emailSent ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setSelectedSubmission(submission);
                                                    setDetailsOpen(true);
                                                }}
                                                color="primary"
                                                title="View Details"
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(submission._id)}
                                                color="error"
                                                title="Delete"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[25, 50, 100]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            <SubmissionDetailDialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                submission={selectedSubmission}
                form={form}
            />
        </Box>
    );
}
