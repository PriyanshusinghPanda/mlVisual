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
  useTheme,
  alpha,
  styled
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import * as d3 from 'd3';

const StyledPaper = styled(Paper)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: theme.spacing(2),
}));

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
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panelWidth, setPanelWidth] = useState(140);
  const [isResizing, setIsResizing] = useState(false);

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
    if (!data.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const svgElement = svgRef.current;
    const width = svgElement.clientWidth || 800;
    const height = svgElement.clientHeight || 600;

    if (width <= 0 || height <= 0) return;

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xScale = d3.scaleLinear()
      .domain([0, 800])
      .range([margin.left, margin.left + chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 400])
      .range([margin.top + chartHeight, margin.top]);

    // Create a group for zoomable content
    const g = svg.append("g")
      .attr("class", "zoom-group");

    // Add axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    g.append("g")
      .attr("transform", `translate(0,${margin.top + chartHeight})`)
      .style("color", alpha(theme.palette.text.primary, 0.6))
      .call(xAxis);

    g.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .style("color", alpha(theme.palette.text.primary, 0.6))
      .call(yAxis);

    // Add grid
    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${margin.top + chartHeight})`)
      .style("stroke", alpha(theme.palette.text.primary, 0.1))
      .style("stroke-dasharray", "3,3")
      .call(xAxis
        .tickSize(-chartHeight)
        .tickFormat("")
      );

    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${margin.left},0)`)
      .style("stroke", alpha(theme.palette.text.primary, 0.1))
      .style("stroke-dasharray", "3,3")
      .call(yAxis
        .tickSize(-chartWidth)
        .tickFormat("")
      );

    // Draw points
    g.selectAll("circle.point")
      .data(data, (_, i) => i)
      .join("circle")
      .attr("class", "point")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 6)
      .style("fill", d => d.cluster === null ? "#ccc" : d3.schemeCategory10[d.cluster])
      .style("opacity", 0.7);

    // Draw centroids
    g.selectAll("circle.centroid")
      .data(centroids, (_, i) => i)
      .join("circle")
      .attr("class", "centroid")
      .attr("cx", d => xScale(d.x))
      .attr("cy", d => yScale(d.y))
      .attr("r", 8)
      .style("fill", (_, i) => d3.schemeCategory10[i])
      .attr("stroke", "black")
      .attr("stroke-width", 2);

  }, [data, centroids, theme]);

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
  }, [isRunning, params.speed, data, centroids]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    generateData();
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(5, prev.scale * delta))
    }));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setTransform(prev => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetZoom = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  const handleResizeMove = (e) => {
    if (!isResizing) return;
    const newWidth = Math.max(100, Math.min(400, e.clientX));
    setPanelWidth(newWidth);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing]);

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'row',
      gap: 0
    }}>
      {/* Left Panel - Parameters */}
      <Box sx={{ 
        width: `${panelWidth}px`,
        flexShrink: 0,
        background: alpha(theme.palette.background.paper, 0.6),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 0,
        overflow: 'auto',
        p: 1.5,
        position: 'relative'
      }}>
        <Typography variant="subtitle2" sx={{ fontSize: '0.85rem', fontWeight: 'bold', mb: 1.5 }}>
          Parameters
        </Typography>
        
        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: '0.75rem', mb: 0.5 }}>
            Clusters: {params.k}
          </Typography>
          <Slider
            value={params.k}
            onChange={(_, value) => setParams({ ...params, k: value })}
            min={2}
            max={10}
            marks
            disabled={isRunning}
            size="small"
            sx={{ '& .MuiSlider-thumb': { width: 16, height: 16 } }}
          />
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: '0.75rem', mb: 0.5 }}>
            Points: {params.points}
          </Typography>
          <Slider
            value={params.points}
            onChange={(_, value) => setParams({ ...params, points: value })}
            min={50}
            max={500}
            step={50}
            disabled={isRunning}
            size="small"
            sx={{ '& .MuiSlider-thumb': { width: 16, height: 16 } }}
          />
        </Box>

        <FormControl fullWidth sx={{ mb: 1.5 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>Speed</InputLabel>
          <Select
            value={params.speed}
            onChange={(e) => setParams({ ...params, speed: e.target.value })}
            label="Speed"
            size="small"
          >
            <MenuItem value={0.5}>Slow</MenuItem>
            <MenuItem value={1}>Normal</MenuItem>
            <MenuItem value={2}>Fast</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexDirection: 'column' }}>
          <Button
            variant="contained"
            startIcon={isRunning ? <PauseIcon /> : <PlayArrowIcon />}
            onClick={isRunning ? handlePause : handleStart}
            fullWidth
            size="small"
            sx={{
              background: 'linear-gradient(45deg, #4ECDC4, #2E9B94)',
              fontSize: '0.7rem',
              padding: '4px'
            }}
          >
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            fullWidth
            size="small"
            sx={{ fontSize: '0.7rem', padding: '4px' }}
          >
            Reset
          </Button>
          <Button
            variant="text"
            onClick={resetZoom}
            fullWidth
            size="small"
            sx={{ fontSize: '0.65rem', padding: '4px' }}
          >
            Reset Zoom
          </Button>
        </Box>

        <Box sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
        }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Iteration</Typography>
          <Typography sx={{ fontSize: '1.3rem', color: theme.palette.primary.main, fontWeight: 'bold' }}>
            {iteration}
          </Typography>
        </Box>
        
        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 2 }}>
          🔍 Scroll to zoom | Drag to pan
        </Typography>
      </Box>

      {/* Resizer Divider */}
      <Box
        onMouseDown={handleResizeStart}
        sx={{
          width: '4px',
          cursor: 'col-resize',
          backgroundColor: alpha(theme.palette.divider, 0.3),
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.5),
          },
          transition: isResizing ? 'none' : 'background-color 0.2s',
          flexShrink: 0
        }}
      />

      {/* Right Panel - Visualization */}
      <Box 
        sx={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          style={{
            width: '100%',
            height: '100%',
            background: alpha(theme.palette.background.default, 0.5),
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s'
          }}
        />
      </Box>
    </Box>
  );
};

export default KMeans;
