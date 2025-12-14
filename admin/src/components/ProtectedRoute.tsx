'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, LinearProgress } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          zIndex: 9999,
        }}
      >
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)',
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.5px' }}>
              Infi Commerce
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admin Panel
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          sx={{
            width: 160,
            height: 4,
            borderRadius: 2,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              backgroundImage: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
            }
          }}
        />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
