// src/components/NavBar.js
import { AppBar, Container, Toolbar, Typography, Box, Button } from '@mui/material';
import { NavLink } from 'react-router-dom';

// Helper for styled links
function NavText({ href, text, isMain = false }) {
  return (
    <Typography
      variant={isMain ? 'h5' : 'subtitle1'}
      noWrap
      sx={{
        mr: 4,
        fontFamily: 'monospace',
        fontWeight: isMain ? 700 : 500,
        letterSpacing: '.1rem',
      }}
    >
      <NavLink
        to={href}
        style={({ isActive }) => ({
          color: 'inherit',
          textDecoration: 'none',
          borderBottom: isActive ? '2px solid white' : 'none',
        })}
      >
        {text}
      </NavLink>
    </Typography>
  );
}

export default function NavBar() {
  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* left side */}
          <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center' }}>
            <NavText href="/" text="YELPCLONE" isMain />
            <NavText href="/" text="Home" />
            <NavText href="/search" text="Search" />
            <NavText href="/leaderboard/local" text="Top Local" />
            <NavText href="/leaderboard/users" text="Top Users" />
            <NavText href="/leaderboard/tippers" text="Tippers" />
          </Box>

          {/* rightmost */}
          <Button
            color="inherit"
            component={NavLink}
            to="/login"
            sx={{
              fontFamily: 'monospace',
              fontWeight: 500,
              letterSpacing: '.1rem',
              textDecoration: 'none',
            }}
          >
            Login
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
