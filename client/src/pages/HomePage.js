// src/pages/HomePage.js
import { useEffect, useState } from 'react';
import { Container, Divider, Typography } from '@mui/material';

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
    { field: 'name',         headerName: 'Business Name' },
    { field: 'city',         headerName: 'City' },
    { field: 'avg_rating',   headerName: 'Avg Rating' },
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
