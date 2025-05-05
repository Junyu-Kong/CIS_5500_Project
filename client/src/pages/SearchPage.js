// src/pages/SearchPage.js
import { useState } from 'react';
import { Container, TextField, Button, Box, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';

import LazyTable from '../components/LazyTable';
const config = require('../config.json');

export default function SearchPage() {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [minRating, setMinRating] = useState('');
  const [route, setRoute] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (city)     params.append('city', city);
    if (category) params.append('category', category);
    if (minRating) params.append('rating', minRating);

    const url = `http://${config.server_host}:${config.server_port}/local_categorized_business?${params.toString()}`;
    setRoute(url);
  };

  const columns = [
    {
      field: 'name',
      headerName: 'Business Name',
      renderCell: (row) => (
        <NavLink to={`/business/${row.business_id}`}>
          {row.name}
        </NavLink>
      ),
    },
    { field: 'address',      headerName: 'Address' },
    { field: 'city',         headerName: 'City' },
    { field: 'state',        headerName: 'State' },
    { field: 'categories',   headerName: 'Categories' },
    { field: 'avg_rating',   headerName: 'Avg Rating' },
    { field: 'total_reviews', headerName: 'Reviews' },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Search Businesses
      </Typography>

      <Box
        component="form"
        onSubmit={e => { e.preventDefault(); handleSearch(); }}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3
        }}
      >
        <TextField
          label="City"
          value={city}
          onChange={e => setCity(e.target.value)}
        />
        <TextField
          label="Category"
          value={category}
          onChange={e => setCategory(e.target.value)}
        />
        <TextField
          label="Min Rating"
          type="number"
          inputProps={{ min: 0, max: 5, step: 0.1 }}
          value={minRating}
          onChange={e => setMinRating(e.target.value)}
        />
        <Button
          type="submit"
          variant="contained"
        >
          Search
        </Button>
      </Box>

      {route && (
        <LazyTable
          route={route}
          columns={columns}
          defaultPageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
        />
      )}
    </Container>
  );
}
