// src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Divider,
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Rating from '@mui/material/Rating';
import LazyTable from '../components/LazyTable';
const config = require('../config.json');

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [top3, setTop3] = useState([]);
  const [query, setQuery] = useState('');
  const defaultImages = ['/wine.png', '/icecream.png', '/balloons.png'];

  useEffect(() => {
    const user = localStorage.getItem('username');
    setCurrentUser(user);

    fetch(`http://${config.server_host}:${config.server_port}/top_business`)
      .then(res => res.json())
      .then(data => {
        setBusinesses(data);
        setTop3(data.slice(0, 3));
      })
      .catch(console.error);
  }, []);

  const columns = [
    {
      field: 'name',
      headerName: 'Business Name',
      renderCell: (row) => (
        <NavLink to={`/business/${row.business_id}`}>
          {row.name}
        </NavLink>
      )
    },
    { field: 'city', headerName: 'City' },
    { field: 'avg_rating', headerName: 'Avg Rating' },
    { field: 'review_count', headerName: 'Reviews' },
  ];

  return (
    <>
      {/* Hero Banner */}
      <Box
        sx={{
          height: 300,
          backgroundImage: `url('/banner.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
        }}
      >
        <Typography
          variant="h2"
          sx={{ color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}
        >
          Welcome to PENN Yelp
        </Typography>
      </Box>

      <Container sx={{ mt: 4 }}>
        {/* Current User */}
        <Typography variant="body1" gutterBottom>
          {currentUser
            ? <>Current User: <strong>{currentUser}</strong></>
            : <>Not logged in</>}
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Top 3 Businesses Grid */}
        <Typography variant="h5" gutterBottom>
          Top Businesses
        </Typography>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {top3.map((b, idx) => (
            <Grid item xs={12} sm={4} key={b.business_id}>
              <Card elevation={3}>
                <CardActionArea component={NavLink} to={`/business/${b.business_id}`}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={b.image_url || defaultImages[idx]}
                    alt={b.name}
                  />
                  <CardContent>
                    <Typography variant="h6">{b.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {b.city}
                    </Typography>
                    <Rating
                      value={parseFloat(b.avg_rating) || 0}
                      precision={.1}
                      readOnly
                      size="small"
                      sx={{mt: 1}}
                    />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* All Businesses Table */}
        <Typography variant="h5" gutterBottom>
          All Businesses
        </Typography>
        <LazyTable
          route={`http://${config.server_host}:${config.server_port}/top_business`}
          columns={columns}
          defaultPageSize={10}
          rowsPerPageOptions={[5, 10, 20]}
        />
      </Container>
    </>
  );
}