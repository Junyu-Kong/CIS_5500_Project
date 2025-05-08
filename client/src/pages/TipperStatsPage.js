// src/pages/TipperStatsPage.js
import { Container, Typography, Divider } from '@mui/material';
import { NavLink } from 'react-router-dom';
import LazyTable from '../components/LazyTable';
const config = require('../config.json');

export default function TipperStatsPage() {
  const route = `http://${config.server_host}:${config.server_port}/tipper_stats`;

  const columns = [
    {
      field: 'user_name',
      headerName: 'User'
    },
    { field: 'states_reviewed', headerName: 'States Reviewed' },
    { field: 'total_reviews',   headerName: 'Reviews' },
    { field: 'has_ever_tipped',  headerName: 'Tipped?' , type: 'boolean',
        width: 120},
  ];

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Reviewer Stats
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <LazyTable
        route={route}
        columns={columns}
        defaultPageSize={10}
        rowsPerPageOptions={[5, 10, 20]}
      />
    </Container>
  );
}
