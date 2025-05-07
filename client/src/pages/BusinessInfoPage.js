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
  TextField,
} from '@mui/material';
const config = require('../config.json');

export default function BusinessInfoPage() {
  const { businessId } = useParams();
  const [business, setBusiness] = useState(null);

  // year bounds for average_review
  const [yearLow, setYearLow]   = useState('2014');
  const [yearHigh, setYearHigh] = useState('2016');

  const [metrics, setMetrics] = useState({
    averageReview:       null,
    checkinPerformance:  null,
    reviewTrend:         null,
    engagementLevel:     null,
  });

  // Fetch business details
  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/business/${businessId}`)
      .then(res => res.json())
      .then(data => setBusiness(data))
      .catch(console.error);
  }, [businessId]);

  // Fetch metrics including averageReview with dynamic year bounds
  useEffect(() => {
    const endpoints = {
      averageReview:      `/average_review/${businessId}?year_low=${yearLow}&year_high=${yearHigh}`,
      checkinPerformance: `/checkin_performance/${businessId}`,
      reviewTrend:        `/review_trend/${businessId}`,
      engagementLevel:    `/engagement_level/${businessId}`,
    };

    Object.entries(endpoints).forEach(([key, path]) => {
      fetch(`http://${config.server_host}:${config.server_port}${path}`)
        .then(res => res.json())
        .then(data => {
          setMetrics(prev => ({ ...prev, [key]: data }));
        })
        .catch(console.error);
    });
  }, [businessId, yearLow, yearHigh]);

  if (!business) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Loading business info...</Typography>
      </Container>
    );
  }

  // full address for map
  const fullAddress = `${business.address}, ${business.city}, ${business.state} ${business.postal_code}`;
  const mapSrc      = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;

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
                    <Table size="small" sx={{ border: 'none' }}>
                      <TableBody>
                        {Object.entries(business.hours).map(([day, hrs]) => (
                          <TableRow key={day} sx={{ border: 'none' }}>
                            <TableCell sx={{ border: 'none', fontWeight: 500, p: 0.5 }}>
                              {day}
                            </TableCell>
                            <TableCell sx={{ border: 'none', p: 0.5 }}>
                              {hrs}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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

            {/* Year bounds selectors */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Year Low"
                type="number"
                value={yearLow}
                onChange={e => setYearLow(e.target.value)}
                sx={{ width: 120 }}
              />
              <TextField
                label="Year High"
                type="number"
                value={yearHigh}
                onChange={e => setYearHigh(e.target.value)}
                sx={{ width: 120 }}
              />
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1">Avg Reviews (3-mo rolling)</Typography>
                <Typography>
                  {metrics.averageReview?.[metrics.averageReview.length - 1]?.rolling_avg_reviews ?? '...'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1">Checkin Performance</Typography>
                <Typography>
                  {metrics.checkinPerformance?.checkin_performance ?? '...'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1">Review Trend</Typography>
                <Typography>
                  {metrics.reviewTrend?.[metrics.reviewTrend.length - 1]?.review_trend ?? '...'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle1">Engagement Level</Typography>
                <Typography>
                  {metrics.engagementLevel?.[0]?.engagement_label ?? '...'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
