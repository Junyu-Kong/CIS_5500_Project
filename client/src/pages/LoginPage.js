// src/pages/LoginPage.js
import { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
const config = require('../config.json');

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(
        `http://${config.server_host}:${config.server_port}/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }
      );
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    }
  };

  return (
    <Container sx={{ mt: 4, maxWidth: 'xs' }}>
      <Typography variant="h4" gutterBottom>
        Login
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
        <TextField
          label="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <Button type="submit" variant="contained">
          Log In
        </Button>
      </Box>

      <Typography sx={{ mt: 2 }}>
        Don't have an account?{' '}
        <NavLink to="/register" style={{ textDecoration: 'none', fontWeight: 500 }}>
          Register here
        </NavLink>
      </Typography>
    </Container>
  );
}
