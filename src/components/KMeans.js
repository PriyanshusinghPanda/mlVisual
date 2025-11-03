import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Slider,
  Typography,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  useTheme,
  alpha,
  styled
} from '@mui/material';

const StyledPaper = styled(Paper)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
}));
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import * as d3 from 'd3';

const KMeans = () => {
  const theme = useTheme();
  const [params, setParams] = useState({
    k: 3,
    points: 100,
    speed: 1
  });
  const [isRunning, setIsRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const svgRef = useRef();
  const animationRef = useRef();
  const [data, setData] = useState([]);
  const [centroids, setCentroids] = useState([]);

  // Generate random data points
  const generateData = () => {
    const newData = Array.from({ length: params.points }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 400,
      cluster: null
    }));
    setData(newData);
    
    // Generate initial random centroids
    const newCentroids = Array.from({ length: params.k }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 400
    }));
    setCentroids(newCentroids);
    setIteration(0);
  };

  // Initialize visualization
  useEffect(() => {
    generateData();
  }, [params.points, params.k]);

  // D3 visualization setup
  useEffect(() => {
    if (!data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const svgElement = svgRef.current;
    const width = svgElement.clientWidth - margin.left - margin.right;
    const height = svgElement.clientHeight - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
      .domain([0, 800])
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([0, 400])
      .range([height - margin.bottom, margin.top]);

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .style("color", alpha(theme.palette.text.primary, 0.6))
      .call(xAxis);

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .style("color", alpha(theme.palette.text.primary, 0.6))
      .call(yAxis);

    // Add grid
    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .style("stroke", alpha(theme.palette.text.primary, 0.1))
      .style("stroke-dasharray", "3,3")
      .call(xAxis
        .tickSize(-height + margin.top + margin.bottom)
        .tickFormat("")
      );

    svg.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .style("stroke", alpha(theme.palette.text.primary, 0.1))
      .style("stroke-dasharray", "3,3")
      .call(yAxis
        .tickSize(-width + margin.left + margin.right)
        .tickFormat("")
      );

    // Draw points
    svg.selectAll("circle.point")
      .data(data)
      .join("circle")
      .attr("class", "point")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 6)
      .attr("fill", d => d.cluster === null ? "#ccc" : d3.schemeCategory10[d.cluster]);

    // Draw centroids
    svg.selectAll("circle.centroid")
      .data(centroids)
      .join("circle")
      .attr("class", "centroid")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 8)
      .attr("fill", (_, i) => d3.schemeCategory10[i])
      .attr("stroke", "black")
      .attr("stroke-width", 2);
  }, [data, centroids]);

  // K-means algorithm step
  const algorithmStep = () => {
    // Assign points to nearest centroid
    const newData = data.map(point => {
      const distances = centroids.map((centroid, i) => ({
        index: i,
        distance: Math.sqrt(
          Math.pow(centroid.x - point.x, 2) + 
          Math.pow(centroid.y - point.y, 2)
        )
      }));
      const nearest = distances.reduce((min, curr) => 
        curr.distance < min.distance ? curr : min
      );
      return { ...point, cluster: nearest.index };
    });

    // Update centroids
    const newCentroids = centroids.map((_, i) => {
      const clusterPoints = newData.filter(p => p.cluster === i);
      if (clusterPoints.length === 0) return centroids[i];
      return {
        x: d3.mean(clusterPoints, d => d.x),
        y: d3.mean(clusterPoints, d => d.y)
      };
    });

    setData(newData);
    setCentroids(newCentroids);
    setIteration(prev => prev + 1);
  };

  // Animation control
  useEffect(() => {
    if (isRunning) {
      animationRef.current = setInterval(
        algorithmStep,
        1000 / params.speed
      );
    }
    return () => clearInterval(animationRef.current);
  }, [isRunning, params.speed]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    generateData();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        K-Means Clustering Visualization
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <StyledPaper sx={{ 
            position: 'sticky',
            top: '80px',
            zIndex: 1
          }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>Parameters</Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Number of Clusters (K): {params.k}
                <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                  - Cluster count
                </Typography>
              </Typography>
              <Slider
                value={params.k}
                onChange={(_, value) => setParams({ ...params, k: value })}
                min={2}
                max={10}
                marks
                disabled={isRunning}
                sx={{
                  '& .MuiSlider-thumb': {
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  },
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Number of Points: {params.points}
                <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                  - Dataset size
                </Typography>
              </Typography>
              <Slider
                value={params.points}
                onChange={(_, value) => setParams({ ...params, points: value })}
                min={50}
                max={500}
                step={50}
                disabled={isRunning}
                sx={{
                  '& .MuiSlider-thumb': {
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.1)',
                    },
                  },
                }}
              />
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Animation Speed</InputLabel>
              <Select
                value={params.speed}
                onChange={(e) => setParams({ ...params, speed: e.target.value })}
                label="Animation Speed"
              >
                <MenuItem value={0.5}>Slow</MenuItem>
                <MenuItem value={1}>Normal</MenuItem>
                <MenuItem value={2}>Fast</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={isRunning ? <PauseIcon /> : <PlayArrowIcon />}
                onClick={isRunning ? handlePause : handleStart}
                fullWidth
                sx={{
                  background: 'linear-gradient(45deg, #4ECDC4, #2E9B94)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.2)',
                  },
                }}
              >
                {isRunning ? 'Pause' : 'Start'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
                fullWidth
                sx={{
                  borderColor: theme.palette.primary.main,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
                  },
                }}
              >
                Reset
              </Button>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Status</Typography>
              <Box sx={{ 
                p: 2, 
                borderRadius: 1, 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}>
                <Typography variant="body2" color="text.secondary">Iteration</Typography>
                <Typography variant="h4" sx={{ color: theme.palette.primary.main }}>
                  {iteration}
                </Typography>
              </Box>
            </Box>
          </StyledPaper>
        </Grid>

        <Grid item xs={12} md={9}>
          <StyledPaper sx={{ 
            minHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <svg
              ref={svgRef}
              style={{
                width: '100%',
                height: '100%',
                minHeight: '800px',
                background: alpha(theme.palette.background.default, 0.8),
                borderRadius: theme.spacing(2),
              }}
            />
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default KMeans;