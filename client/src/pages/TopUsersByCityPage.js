// src/pages/RandomTopUsersByCityPage.js
import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Divider,
  Box,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { NavLink } from 'react-router-dom';

const config = require('../config.json');

export default function RandomTopUsersByCityPage() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAndPick = () => {
    setLoading(true);
    fetch(`http://${config.server_host}:${config.server_port}/top_users_by_city`)
      .then(res => res.json())
      .then(data => {
        const cities = Array.from(new Set(data.map(r => r.city)));
        for (let i = cities.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [cities[i], cities[j]] = [cities[j], cities[i]];
        }
        const picked = cities.slice(0, 3);
        const filtered = data.filter(r => picked.includes(r.city));
        setRows(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchAndPick, []);

  const columns = [
    { field: 'city', headerName: 'City', width: 150 },
    {
      field: 'user_name',
      headerName: 'User',
      width: 200
    },
    { field: 'total_reviews', headerName: 'Reviews', width: 120 },
    { field: 'total_tips',    headerName: 'Tips',    width: 120 },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Box display="flex" alignItems="center">
        <Typography variant="h4" gutterBottom>
          Top 3 Users in busy cities
        </Typography>
        <Tooltip title="Busy cities: ≥ 50 open businesses and average rating > 3.5">
          <Box
            component="span"
            sx={{
              ml: 1,
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '1px solid',
              borderColor: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'help',
            }}
          >
            <Typography variant="subtitle2" sx={{ lineHeight: 1 }}>?</Typography>
          </Box>
        </Tooltip>
      </Box>

      <Button
        variant="contained"
        onClick={fetchAndPick}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        Randomly Pick Another 3 Cities
      </Button>

      <Divider sx={{ mb: 2 }} />

      <div style={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSize={9}
          rowsPerPageOptions={[9]}
          getRowId={(row) => `${row.city}_${row.user_id}`}
        />
      </div>
    </Container>
  );
}
