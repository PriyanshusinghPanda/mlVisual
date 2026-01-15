import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import SchemaIcon from '@mui/icons-material/Schema';

const MotionBox = motion(Box);
const MotionButton = motion(Button);
const MotionCard = motion(Card);

const algorithms = [
  {
    title: 'K-Means Clustering',
    description: 'Interactive visualization of the K-means clustering algorithm with adjustable parameters.',
    icon: <BubbleChartIcon sx={{ fontSize: 40 }} />,
    path: '/visualizations?tab=0'
  },
  {
    title: 'DBSCAN',
    description: 'Density-based spatial clustering with animated cluster formation and expansion.',
    icon: <SchemaIcon sx={{ fontSize: 40 }} />,
    path: '/visualizations?tab=1'
  },
  {
    title: 'Linear Regression',
    description: 'Visual representation of linear regression with adjustable noise and data points.',
    icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
    path: '/visualizations?tab=2'
  },
  {
    title: 'Model Architecture',
    description: 'Interactive neural network architecture visualization (Coming Soon).',
    icon: <TimelineIcon sx={{ fontSize: 40 }} />,
    path: '/visualizations?tab=3'
  }
];

const Home = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0A0B 0%, #1A1B1E 100%)',
      pt: 8,
      pb: 8
    }}>
      <Container>
        <Grid container spacing={6} alignItems="center">
          {/* Hero Section */}
          <Grid item xs={12} md={6}>
            <MotionBox
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography 
                variant="h2" 
                gutterBottom
                sx={{
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #4ECDC4, #FF6B6B)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                AI Model Visualizer
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ mb: 4, color: 'text.secondary' }}
              >
                Interactive visualizations of machine learning algorithms and models
              </Typography>
              <MotionButton
                variant="contained"
                size="large"
                onClick={() => navigate('/visualizations')}
                sx={{
                  background: 'linear-gradient(45deg, #4ECDC4, #2E9B94)',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                  }
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Visualizations
              </MotionButton>
            </MotionBox>
          </Grid>

          {/* Feature Cards */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              {algorithms.map((algo, index) => (
                <Grid item xs={12} sm={6} md={3} key={algo.title}>
                  <MotionCard
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    sx={{
                      height: '100%',
                      background: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 8px 20px ${alpha(theme.palette.common.black, 0.2)}`,
                      }
                    }}
                    onClick={() => navigate(algo.path)}
                  >
                    <CardContent>
                      <Box sx={{ 
                        color: 'primary.main', 
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {algo.icon}
                      </Box>
                      <Typography variant="h6" gutterBottom align="center">
                        {algo.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center">
                        {algo.description}
                      </Typography>
                    </CardContent>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;