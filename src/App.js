import React from "react";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box,
  ThemeProvider,
  CssBaseline,
  Button,
  alpha,
  styled
} from "@mui/material";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import theme from "./theme";
import Home from "./pages/Home";
import Visualizations from "./pages/Visualizations";
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

const GradientTypography = styled(Typography)(({ theme }) => ({
  background: 'linear-gradient(45deg, #4ECDC4, #FF6B6B)',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  fontWeight: 'bold',
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.primary,
  textTransform: 'none',
  marginLeft: theme.spacing(2),
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.1),
  },
}));

const Navbar = () => {
  const location = useLocation();

  return (
    <AppBar 
      position="fixed"
      sx={{
        background: alpha('#1A1B1E', 0.8),
        backdropFilter: 'blur(10px)',
      }}
    >
      <Toolbar>
        <GradientTypography 
          variant="h5" 
          component={Link} 
          to="/"
          sx={{ 
            textDecoration: 'none',
            flexGrow: 1
          }}
        >
          ML Model Visualizer
        </GradientTypography>
        <Box>
          <NavButton
            component={Link}
            to="/"
            variant={location.pathname === '/' ? 'contained' : 'text'}
          >
            Home
          </NavButton>
          <NavButton
            component={Link}
            to="/visualizations"
            variant={location.pathname === '/visualizations' ? 'contained' : 'text'}
          >
            Visualizations
          </NavButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ 
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0A0A0B 0%, #1A1B1E 100%)',
        }}>
          <Navbar />
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/visualizations" element={<Visualizations />} />
              </Routes>
            </AnimatePresence>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
