// src/pages/HomePage.js
import { useEffect, useState } from 'react';
import { Container, Divider, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';

import LazyTable from '../components/LazyTable';
const config = require('../config.json');

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem('username');
    setCurrentUser(user);
  }, []);

  const columns = [
    { field: 'name',         headerName: 'Business Name',
      renderCell: (row) => (
        <NavLink to={`/business/${row.business_id}`}>
          {row.name}
        </NavLink>
      )
     },
    { field: 'city',         headerName: 'City' },
    { field: 'avg_rating',   headerName: 'Avg Rating' },
    { field: 'review_count', headerName: 'Reviews' },
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to PENN Yelp
      </Typography>

      <Typography variant="body1" gutterBottom>
        {currentUser
          ? <>Current User: <strong>{currentUser}</strong></>
          : <>Not logged in</>}
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
