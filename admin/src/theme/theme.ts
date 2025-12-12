'use client';

import { createTheme, alpha } from '@mui/material/styles';

// Professional color palette - subtle and refined
const colors = {
  primary: {
    main: '#4f46e5', // Indigo
    light: '#6366f1',
    dark: '#4338ca',
    50: '#eef2ff',
    100: '#e0e7ff',
    600: '#4f46e5',
    700: '#4338ca',
  },
  secondary: {
    main: '#0891b2', // Cyan
    light: '#06b6d4',
    dark: '#0e7490',
  },
  success: {
    main: '#059669',
    light: '#10b981',
    dark: '#047857',
  },
  warning: {
    main: '#d97706',
    light: '#f59e0b',
    dark: '#b45309',
  },
  error: {
    main: '#dc2626',
    light: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    main: '#2563eb',
    light: '#3b82f6',
    dark: '#1d4ed8',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: '#ffffff',
    },
    success: {
      main: colors.success.main,
      light: colors.success.light,
      dark: colors.success.dark,
      contrastText: '#ffffff',
    },
    warning: {
      main: colors.warning.main,
      light: colors.warning.light,
      dark: colors.warning.dark,
      contrastText: '#ffffff',
    },
    error: {
      main: colors.error.main,
      light: colors.error.light,
      dark: colors.error.dark,
      contrastText: '#ffffff',
    },
    info: {
      main: colors.info.main,
      light: colors.info.light,
      dark: colors.info.dark,
      contrastText: '#ffffff',
    },
    background: {
      default: colors.gray[50],
      paper: '#ffffff',
    },
    text: {
      primary: colors.gray[900],
      secondary: colors.gray[600],
      disabled: colors.gray[400],
    },
    divider: colors.gray[200],
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 500,
      letterSpacing: '0.01em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 4, // Professional 4px default
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
    '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.08)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: `${colors.gray[300]} ${colors.gray[100]}`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 6,
            height: 6,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 3,
            backgroundColor: colors.gray[300],
            minHeight: 24,
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: colors.gray[400],
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            backgroundColor: colors.gray[100],
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          transition: 'all 0.15s ease-in-out',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          },
        },
        outlined: {
          borderWidth: 1,
          '&:hover': {
            borderWidth: 1,
            backgroundColor: alpha(colors.primary.main, 0.04),
          },
        },
        text: {
          '&:hover': {
            backgroundColor: alpha(colors.primary.main, 0.04),
          },
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '10px 20px',
          fontSize: '0.9375rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          boxShadow: 'none',
          border: `1px solid ${colors.gray[200]}`,
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        },
        elevation2: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        },
        outlined: {
          border: `1px solid ${colors.gray[200]}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            borderRadius: 4,
            transition: 'all 0.15s ease-in-out',
            '& fieldset': {
              borderColor: colors.gray[300],
            },
            '&:hover fieldset': {
              borderColor: colors.gray[400],
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary.main,
              borderWidth: 1,
            },
          },
          '& .MuiInputBase-input': {
            fontSize: '0.875rem',
            color: colors.gray[900],
          },
          '& .MuiInputLabel-root': {
            color: colors.gray[600],
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 4,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colors.gray[200]}`,
          fontSize: '0.875rem',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: colors.gray[50],
          color: colors.gray[700],
          fontSize: '0.8125rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: colors.gray[50],
          },
          '&.Mui-selected': {
            backgroundColor: alpha(colors.primary.main, 0.04),
            '&:hover': {
              backgroundColor: alpha(colors.primary.main, 0.08),
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${colors.gray[200]}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${colors.gray[200]}`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '2px 0',
          transition: 'all 0.15s ease-in-out',
          '&.Mui-selected': {
            backgroundColor: colors.primary.main,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: colors.primary.dark,
            },
            '& .MuiListItemIcon-root': {
              color: '#ffffff',
            },
          },
          '&:hover': {
            backgroundColor: alpha(colors.primary.main, 0.04),
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            backgroundColor: alpha(colors.primary.main, 0.04),
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.gray[900],
          fontSize: '0.75rem',
          borderRadius: 4,
          padding: '6px 10px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '0.875rem',
        },
      },
    },
  },
});
