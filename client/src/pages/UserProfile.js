import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Divider,
  TextField,
  Button,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
const config = require('../config.json');

export default function UserProfile() {
  const navigate = useNavigate();
  const [userId, setUserId]         = useState('');
  const [username, setUsername]     = useState('');
  const [reviewCount, setReviewCount] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [message, setMessage]       = useState('');

  // on mount: check auth and load data
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    // extract user_id & username from token payload
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    setUserId(payload.user_id);
    setUsername(payload.username);

    // fetch review count
    fetch(`http://${config.server_host}:${config.server_port}/user_review_count?user_id=${payload.user_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setReviewCount(data[0].total_reviews);
        }
      })
      .catch(console.error);
  }, [navigate]);

  const handleChangePassword = async () => {
    setMessage('');
    if (newPassword !== confirmPassword) {
      setMessage("Passwords don't match");
      return;
    }
    try {
      const res = await fetch(
        `http://${config.server_host}:${config.server_port}/change_password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, new_password: newPassword }),
        }
      );
      const data = await res.json();
      setMessage(data.message || 'Password updated');
    } catch (err) {
      console.error(err);
      setMessage('Network error');
    }
  };

  return (
    <Container sx={{ mt: 4, maxWidth: 'sm' }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Typography variant="body1"><strong>Username:</strong> {username}</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        <strong>User ID:</strong> {userId}
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        <strong>Total Reviews:</strong> {reviewCount}
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Change Password
      </Typography>
      <Box sx={{ display: 'grid', gap: 2, mb: 2 }}>
        <TextField
          label="New Password"
          type="password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />
        <TextField
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={e => setConfirm(e.target.value)}
        />
        <Button variant="contained" onClick={handleChangePassword}>
          Update Password
        </Button>
      </Box>
      {message && (
        <Typography color="primary" sx={{ mt: 1 }}>
          {message}
        </Typography>
      )}
    </Container>
  );
}
