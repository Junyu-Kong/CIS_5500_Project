import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { indigo, amber } from "@mui/material/colors";
import { createTheme } from "@mui/material/styles";

import NavBar from "./components/NavBar";

// Pages
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TopLocalBusinessesPage from "./pages/TopLocalBusinessesPage";
import TopUsersByCityPage from './pages/TopUsersByCityPage';
import TipperStatsPage    from './pages/TipperStatsPage';
import BusinessInfoPage from "./pages/BusinessInfoPage";
import UserProfile from "./pages/UserProfile";

// custom MUI theme
export const theme = createTheme({
  palette: {
    primary: indigo,
    secondary: amber,
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <NavBar />
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={<HomePage />} />

          {/* Search & Browse */}
          <Route path="/search" element={<SearchPage />} />

          <Route path="/leaderboard/local" element={<TopLocalBusinessesPage />} />
          <Route path="/leaderboard/users" element={<TopUsersByCityPage />} />
          <Route path="/leaderboard/tippers" element={<TipperStatsPage />} />
          <Route path="/business/:businessId" element={<BusinessInfoPage />} />

          <Route path="/profile" element={<UserProfile />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          

          {/* fallback: could add a 404 page */}
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
