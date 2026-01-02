'use client';

import { useState } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Alert,
    AlertTitle,
    Paper,
    Typography,
    alpha
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import StorageIcon from '@mui/icons-material/Storage';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import ExportSection from '@/components/backup/ExportSection';
import ImportSection from '@/components/backup/ImportSection';
import DatabaseBackupSection from '@/components/backup/DatabaseBackupSection';
import PageHeader from '@/components/molecules/PageHeader';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`backup-tabpanel-${index}`}
            aria-labelledby={`backup-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 4 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const tabs = [
    {
        label: 'Export Data',
        icon: <FileDownloadIcon />,
        description: 'Download your data as Excel files'
    },
    {
        label: 'Import Data',
        icon: <FileUploadIcon />,
        description: 'Upload data from Excel files'
    },
    {
        label: 'Database Backup',
        icon: <StorageIcon />,
        description: 'Full database backup & restore'
    }
];

export default function BackupRestorePage() {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box>
            <PageHeader
                title="Backup & Restore"
                subtitle="Export data to Excel, import records from spreadsheets, or manage complete database snapshots."
                backUrl="/settings"
            />

            {/* Security Warning */}
            <Paper
                elevation={0}
                sx={{
                    mb: 4,
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: alpha('#f59e0b', 0.08),
                    border: '1px solid',
                    borderColor: alpha('#f59e0b', 0.3),
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2
                }}
            >
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        bgcolor: alpha('#f59e0b', 0.15),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                >
                    <WarningAmberIcon sx={{ color: '#d97706', fontSize: 24 }} />
                </Box>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#92400e', mb: 0.5 }}>
                        Security Notice
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#a16207', lineHeight: 1.6 }}>
                        This feature is restricted to super administrators. Always perform a <strong>Database Backup</strong> before importing any data to ensure you can recover in case of errors.
                    </Typography>
                </Box>
            </Paper>

            {/* Main Content Container */}
            <Paper
                variant="outlined"
                sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
                }}
            >
                {/* Tab Navigation */}
                <Box
                    sx={{
                        bgcolor: 'grey.50',
                        borderBottom: 1,
                        borderColor: 'divider'
                    }}
                >
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        indicatorColor="primary"
                        textColor="primary"
                        variant="fullWidth"
                        sx={{
                            minHeight: 72,
                            '& .MuiTab-root': {
                                minHeight: 72,
                                textTransform: 'none',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                gap: 1,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    bgcolor: 'action.hover'
                                },
                                '&.Mui-selected': {
                                    bgcolor: 'background.paper'
                                }
                            },
                            '& .MuiTabs-indicator': {
                                height: 3,
                                borderRadius: '3px 3px 0 0'
                            }
                        }}
                    >
                        {tabs.map((tab, index) => (
                            <Tab
                                key={index}
                                icon={tab.icon}
                                iconPosition="start"
                                label={
                                    <Box sx={{ textAlign: 'left' }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: activeTab === index ? 700 : 600,
                                                color: activeTab === index ? 'primary.main' : 'text.primary'
                                            }}
                                        >
                                            {tab.label}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: 'text.secondary',
                                                display: { xs: 'none', sm: 'block' }
                                            }}
                                        >
                                            {tab.description}
                                        </Typography>
                                    </Box>
                                }
                                id={`backup-tab-${index}`}
                                sx={{
                                    borderRight: index < tabs.length - 1 ? 1 : 0,
                                    borderColor: 'divider',
                                    '& .MuiSvgIcon-root': {
                                        fontSize: 24,
                                        color: activeTab === index ? 'primary.main' : 'text.secondary'
                                    }
                                }}
                            />
                        ))}
                    </Tabs>
                </Box>

                {/* Tab Content */}
                <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                    <TabPanel value={activeTab} index={0}>
                        <ExportSection />
                    </TabPanel>
                    <TabPanel value={activeTab} index={1}>
                        <ImportSection />
                    </TabPanel>
                    <TabPanel value={activeTab} index={2}>
                        <DatabaseBackupSection />
                    </TabPanel>
                </Box>
            </Paper>
        </Box>
    );
}
