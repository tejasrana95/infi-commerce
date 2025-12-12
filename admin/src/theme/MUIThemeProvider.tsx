'use client';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme as baseTheme } from './theme'; // Original theme import

const theme = createTheme(baseTheme, {
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          overflow: 'auto !important',
          paddingRight: '0 !important'
        }
      }
    },
    MuiModal: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
    MuiDialog: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
    // Drawer removed to fix console error on permanent variant
    MuiMenu: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
    MuiPopover: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
  }
});

export default function MUIThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
