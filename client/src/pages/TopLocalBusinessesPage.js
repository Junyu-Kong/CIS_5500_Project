// src/pages/TopLocalBusinessesPage.js
import { useState } from 'react';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Divider,
} from '@mui/material';
import { NavLink } from 'react-router-dom';

import LazyTable from '../components/LazyTable';
const config = require('../config.json');

export default function TopLocalBusinessesPage() {
  const baseRoute = `http://${config.server_host}:${config.server_port}/top_local_business`;
  const [stateInput, setStateInput] = useState('');
  const [cityInput, setCityInput]   = useState('');
  const [route, setRoute]           = useState(baseRoute);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (stateInput) params.append('state', stateInput);
    if (cityInput)  params.append('city', cityInput);
    const url = params.toString()
      ? `${baseRoute}?${params.toString()}`
      : baseRoute;
    setRoute(url);
  };

  const columns = [
    {
      field: 'business_name',
      headerName: 'Business Name'
    },
    { field: 'state',        headerName: 'State' },
    { field: 'city',         headerName: 'City' },
    { field: 'stars',        headerName: 'Avg Rating' },
    { field: 'review_count', headerName: 'Reviews' },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Top Local Businesses
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          mb: 3
        }}
      >
        <TextField
          label="State (e.g. CA)"
          value={stateInput}
          onChange={(e) => setStateInput(e.target.value)}
        />
        <TextField
          label="City (e.g. San Francisco)"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
        >
          Filter
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <LazyTable
        route={route}
        columns={columns}
        defaultPageSize={5}
        rowsPerPageOptions={[5, 10]}
      />
    </Container>
  );
}
