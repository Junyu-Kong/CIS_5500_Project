// src/pages/HomePage.js
import { useEffect, useState } from 'react';
import { Container, Divider, Button, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';

import LazyTable from '../components/LazyTable';
const config = require('../config.json');

export default function HomePage() {
  const [author, setAuthor] = useState('');

  useEffect(() => {
    // fetch the app author’s name
    fetch(`http://${config.server_host}:${config.server_port}/author/name`)
      .then(res => res.json())
      .then(data => setAuthor(data.data))
      .catch(console.error);
  }, []);

  const columns = [
    {
      field: 'business_name',
      headerName: 'Business Name',
      // link into the detail page for this business
      renderCell: (row) => (
        <NavLink to={`/business/${row.business_id}`}>
          {row.business_name}
        </NavLink>
      )
    },
    { field: 'city',       headerName: 'City' },
    { field: 'stars',      headerName: 'Avg Rating' },
    { field: 'review_count', headerName: 'Reviews' },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to YelpClone
      </Typography>

      <Typography variant="body1" gutterBottom>
        App Author: <strong>{author || '...'}</strong>
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Button
        component={NavLink}
        to="/search"
        variant="contained"
        color="primary"
        sx={{ mr: 2 }}
      >
        Search Businesses
      </Button>

      <Button
        component={NavLink}
        to="/login"
        variant="outlined"
        color="secondary"
      >
        Login / Register
      </Button>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom>
        Top Businesses
      </Typography>

      <LazyTable
        route={`http://${config.server_host}:${config.server_port}/top_business`}
        columns={columns}
        defaultPageSize={10}
        rowsPerPageOptions={[5, 10, 20]}
      />
    </Container>
  );
}
