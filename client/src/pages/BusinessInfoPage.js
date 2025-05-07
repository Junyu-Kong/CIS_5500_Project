// src/pages/BusinessInfoPage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
const config = require('../config.json');

export default function BusinessInfoPage() {
  const { businessId } = useParams();
  const [business, setBusiness] = useState(null);
  const [metrics, setMetrics] = useState({
    averageReview: null,
    checkinPerformance: null,
    reviewTrend: null,
    engagementLevel: null,
  });

  // Fetch business details
  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/business/${businessId}`)
      .then(res => res.json())
      .then(data => setBusiness(data))
      .catch(console.error);
  }, [businessId]);

  // Fetch metrics
  useEffect(() => {
    const endpoints = {
      averageReview: `/average_review/${businessId}`,
      checkinPerformance: `/checkin_performance/${businessId}`,
      reviewTrend: `/review_trend/${businessId}`,
      engagementLevel: `/engagement_level/${businessId}`,
    };

    Object.entries(endpoints).forEach(([key, path]) => {
      fetch(`http://${config.server_host}:${config.server_port}${path}`)
        .then(res => res.json())
        .then(data => setMetrics(prev => ({ ...prev, [key]: data })))
        .catch(console.error);
    });
  }, [businessId]);

  if (!business) {
    return <Container sx={{ mt: 4 }}><Typography>Loading business info...</Typography></Container>;
  }

  // Construct full address for map
  const fullAddress = `${business.address}, ${business.city}, ${business.state} ${business.postal_code}`;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {business.name}
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={4}>
        {/* Business Details */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Business Information
            </Typography>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>{business.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Address</TableCell>
                  <TableCell>{fullAddress}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Open Status</TableCell>
                  <TableCell>{business.is_open ? 'Open' : 'Closed'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Categories</TableCell>
                  <TableCell>{business.categories}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Hours</TableCell>
                  <TableCell>
                    <Box component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(business.hours, null, 2)}
                    </Box>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Map */}
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Location
          </Typography>
          <Box sx={{ border: 1, borderRadius: 1, overflow: 'hidden', height: 300 }}>
            <iframe
              title="business-location"
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
            />
          </Box>
        </Grid>

        {/* Metrics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1">Average Review</Typography>
                <Typography>{metrics.averageReview?.value ?? '...'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1">Checkin Performance</Typography>
                <Typography>{metrics.checkinPerformance?.value ?? '...'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1">Review Trend</Typography>
                <Typography>{metrics.reviewTrend?.value ?? '...'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1">Engagement Level</Typography>
                <Typography>{metrics.engagementLevel?.value ?? '...'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
