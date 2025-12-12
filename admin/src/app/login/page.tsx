'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
  Checkbox,
  FormControlLabel,
  Alert,
  Collapse,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '@/contexts/AuthContext';
import { Transition } from '@/utils/transition';



export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }, [email, password, login]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: 'background.default',
      }}
    >
      {/* Left Side - Branding */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '40%',
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          color: 'white',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: `
              radial-gradient(circle at 20% 50%, white 1px, transparent 1px),
              radial-gradient(circle at 80% 80%, white 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '16px',
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              backdropFilter: 'blur(10px)',
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 40 }} />
          </Box>

          <Typography variant="h3" fontWeight={700} gutterBottom>
            Infi Commerce
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400, mb: 4 }}>
            Admin Panel
          </Typography>

          <Box sx={{ textAlign: 'left', mt: 6 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                ✓ Manage Products & Inventory
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.875rem' }}>
                Complete control over your product catalog
              </Typography>
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                ✓ Track Sales & Analytics
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.875rem' }}>
                Real-time insights into your business
              </Typography>
            </Box>
            <Box>
              <Typography variant="body1" fontWeight={600} gutterBottom>
                ✓ Multi-Store Management
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.875rem' }}>
                Manage multiple stores from one dashboard
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Right Side - Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 4, md: 6 },
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Mobile Logo */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              flexDirection: 'column',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '12px',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <LockOutlinedIcon sx={{ fontSize: 30, color: 'white' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              Infi Commerce
            </Typography>
          </Box>

          {/* Form Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
              Welcome back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to access the admin panel
            </Typography>
          </Box>

          {/* Error Alert */}
          <Collapse in={!!error}>
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          </Collapse>

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              sx={{ mb: 2 }}
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2" color="text.secondary">
                    Remember me
                  </Typography>
                }
              />
              <MuiLink
                onClick={handleClickOpen}
                variant="body2"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Forgot password?
              </MuiLink>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !email || !password}
              sx={{
                py: 1.5,
                fontSize: '0.9375rem',
                fontWeight: 600,
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <MuiLink
                onClick={handleClickOpen}
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Contact administrator
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Box>
      <Dialog
        open={open}
        onClose={handleClose}
        slots={{
          transition: Transition,
        }}

      >
        <DialogTitle>
          Contact administrator
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Due to security reasons, you are not allowed to create an account or reset your password. Please contact the administrator for assistance.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Okay</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
