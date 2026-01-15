import React, { useState, useEffect } from 'react';
import {
  Box,
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
import { useLocation } from 'react-router-dom';

const Visualizations = () => {
  const location = useLocation();
  const [tab, setTab] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam !== null) {
      setTab(parseInt(tabParam, 10));
    }
  }, [location.search]);

  const handleTabChange = (_, newValue) => setTab(newValue);

  return (
    <Box sx={{
      height: 'calc(100vh - 64px)',
      marginTop: '64px',
      background: 'linear-gradient(135deg, #0A0A0B 0%, #1A1B1E 100%)',
      display: 'flex',
      flexDirection: 'column',
      width: '100%'
    }}>
      <Box sx={{
        background: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderBottomWidth: 2,
        width: '100%',
        minHeight: '56px',
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        overflowY: 'hidden'
      }}>
        <Tabs 
          value={tab} 
          onChange={handleTabChange}
          sx={{
            minHeight: '56px',
            width: '100%',
            '& .MuiTabs-indicator': {
              background: 'linear-gradient(45deg, #4ECDC4, #FF6B6B)',
              height: 3,
              bottom: 0
            },
            '& .MuiTab-root': {
              color: '#888',
              fontSize: '0.95rem',
              padding: '12px 24px',
              minHeight: '56px',
              textTransform: 'none',
              fontWeight: 500,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              borderRadius: '8px 8px 0 0',
              marginRight: '4px',
              transition: 'all 0.2s ease',
              flex: '0 0 auto',
              '&:hover': {
                color: '#fff',
                borderColor: alpha(theme.palette.primary.main, 0.5),
                backgroundColor: alpha(theme.palette.primary.main, 0.05)
              },
              '&.Mui-selected': {
                color: '#fff',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                borderColor: alpha(theme.palette.primary.main, 0.5)
              },
            }
          }}
        >
          <Tab label="K-Means" />
          <Tab label="DBSCAN" />
          <Tab label="Linear Regression" />
          <Tab label="Model Architecture" />
        </Tabs>
      </Box>

      <Box sx={{ 
        flex: 1, 
        display: 'flex', 
        width: '100%',
        overflow: 'hidden'
      }}>
        {tab === 0 && <KMeans />}
        {tab === 1 && <DBSCAN />}
        {tab === 2 && <LinearRegression />}
        {tab === 3 && (
          <Box sx={{ 
            width: '100%',
            height: '100%',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            <Box sx={{ textAlign: 'center' }}>
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
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Visualizations;