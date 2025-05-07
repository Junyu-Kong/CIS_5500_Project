// src/pages/RegisterPage.js
import { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Box,
  Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
const config = require('../config.json');

export default function RegisterPage() {
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [error, setError]             = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      const res = await fetch(
        `http://${config.server_host}:${config.server_port}/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        }
      );
      const data = await res.json();

      if (res.status === 201) {
        navigate('/login');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    }
  };

  return (
    <Container sx={{ mt: 4, maxWidth: 'xs' }}>
      <Typography variant="h4" gutterBottom>
        Register
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
        <TextField
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirm(e.target.value)}
          required
        />
        <Button type="submit" variant="contained">
          Sign Up
        </Button>
      </Box>
    </Container>
  );
}
