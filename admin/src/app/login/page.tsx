'use client';

import { Box, Container } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/organisms';

export default function LoginPage() {
  const { login } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Container maxWidth="sm">
        <LoginForm onSubmit={handleLogin} />
      </Container>
    </Box>
  );
}
