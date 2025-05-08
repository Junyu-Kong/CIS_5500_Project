// src/pages/BusinessInfoPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Button,
  Rating,
} from '@mui/material';

const config = require('../config.json');

export default function BusinessInfoPage() {
  const { businessId } = useParams();
  const navigate       = useNavigate();

  // year bounds for average_review
  const [yearLow, setYearLow]   = useState('2014');
  const [yearHigh, setYearHigh] = useState('2016');

  const [business, setBusiness] = useState(null);
  const [metrics, setMetrics]   = useState({
    averageReview:      null,
    checkinPerformance: null,
    reviewTrend:        null,
    engagementLevel:    null,
  });

  // Review form state
  const [rating, setRating]         = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitMsg, setSubmitMsg]   = useState('');

  // Recent reviews state
  const [recentReviews, setRecentReviews] = useState([]);

  // Require login
  const token = localStorage.getItem('token');
  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  // Decode user_id from token or raw
  let userId = token;
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );
    userId = payload.user_id;
  } catch {}

  // Fetch business details
  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/business/${businessId}`)
      .then(r => r.json())
      .then(setBusiness)
      .catch(console.error);
  }, [businessId]);

  // Fetch metrics
  useEffect(() => {
    const eps = {
      averageReview:      `/average_review/${businessId}?year_low=${yearLow}&year_high=${yearHigh}`,
      checkinPerformance: `/checkin_performance/${businessId}`,
      reviewTrend:        `/review_trend/${businessId}`,
      engagementLevel:    `/engagement_level/${businessId}`,
    };
    Object.entries(eps).forEach(([k, p]) =>
      fetch(`http://${config.server_host}:${config.server_port}${p}`)
        .then(r => r.json())
        .then(data => setMetrics(prev => ({ ...prev, [k]: data })))
        .catch(console.error)
    );
  }, [businessId, yearLow, yearHigh]);

  // Fetch recent reviews (re-run after submit)
  useEffect(() => {
    fetch(`http://${config.server_host}:${config.server_port}/business/${businessId}/reviews`)
      .then(r => r.json())
      .then(setRecentReviews)
      .catch(console.error);
  }, [businessId, submitMsg]);

  // Submit review
  const handleSubmitReview = () => {
    setSubmitMsg('');
    if (!rating || !reviewText.trim()) {
      setSubmitMsg('Please select stars and write some text.');
      return;
    }
    fetch(`http://${config.server_host}:${config.server_port}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id:     userId,
        business_id: businessId,
        stars:       rating,
        review_text: reviewText.trim(),
      }),
    })
      .then(r => r.json())
      .then(j => setSubmitMsg(j.message || 'Review submitted'))
      .catch(err => {
        console.error(err);
        setSubmitMsg('Network error');
      });
  };

  if (!business) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Loading business info...</Typography>
      </Container>
    );
  }

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

        {/* Performance Metrics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
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

        {/* Review Form */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Write a Review
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Rating
                name="review-rating"
                value={rating}
                onChange={(_, v) => setRating(v)}
              />
              <TextField
                label="Your review"
                fullWidth
                multiline
                minRows={2}
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
              />
            </Box>
            <Button variant="contained" onClick={handleSubmitReview}>
              Submit
            </Button>
            {submitMsg && (
              <Typography sx={{ mt: 1 }}>{submitMsg}</Typography>
            )}
          </Paper>
        </Grid>

        {/* Recent Reviews */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mt: 2 }} elevation={2}>
            <Typography variant="h6" gutterBottom>
              Recent Reviews
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Stars</TableCell>
                  <TableCell>Review</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentReviews.map(r => (
                  <TableRow key={r.review_id}>
                    <TableCell>{r.user_name}</TableCell>
                    <TableCell>
                      <Rating value={r.stars} readOnly size="small" />
                    </TableCell>
                    <TableCell>{r.review_text}</TableCell>
                    <TableCell>{r.review_date}</TableCell>
                  </TableRow>
                ))}
                {!recentReviews.length && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No reviews yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
