import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Paper,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import KMeans from '../components/KMeans';
import DBSCAN from '../components/DBSCAN';
import LinearRegression from '../components/LinearRegression';
import { motion } from 'framer-motion';

const MotionContainer = motion(Container);

const Visualizations = () => {
  const [tab, setTab] = useState(0);
  const theme = useTheme();

  const handleTabChange = (_, newValue) => setTab(newValue);

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0A0B 0%, #1A1B1E 100%)',
      pt: 4,
      pb: 4
    }}>
      <MotionContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          elevation={0}
          sx={{
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            borderRadius: 2
          }}
        >
          <Tabs 
            value={tab} 
            onChange={handleTabChange} 
            centered
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                background: 'linear-gradient(45deg, #4ECDC4, #FF6B6B)',
              },
              '& .MuiTab-root': {
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: 'text.primary',
                },
              },
            }}
          >
            <Tab label="K-Means" />
            <Tab label="DBSCAN" />
            <Tab label="Linear Regression" />
            <Tab label="Model Architecture" />
          </Tabs>

          <Box sx={{ mt: 2 }}>
            {tab === 0 && <KMeans />}
            {tab === 1 && <DBSCAN />}
            {tab === 2 && <LinearRegression />}
            {tab === 3 && (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography
                  variant="h5"
                  sx={{
                    background: 'linear-gradient(45deg, #4ECDC4, #FF6B6B)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                    fontWeight: 'bold',
                    mb: 2
                  }}
                >
                  Coming Soon
                </Typography>
                <Typography color="text.secondary">
                  We're working on an interactive neural network architecture visualizer.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </MotionContainer>
    </Box>
  );
};

export default Visualizations;