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
  styled,
  useTheme,
  alpha
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import * as d3 from 'd3';

const StyledPaper = styled(Paper)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
}));

const DBSCAN = () => {
  const theme = useTheme();
  const [params, setParams] = useState({
    epsilon: 50,
    minPoints: 4,
    points: 100,
    speed: 1
  });
  const [isRunning, setIsRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const svgRef = useRef();
  const animationRef = useRef();
  const [data, setData] = useState([]);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [dbscanState, setDbscanState] = useState({
    index: 0,
    cluster: 0,
    neigh: [],
    phase: "initial"
  });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panelWidth, setPanelWidth] = useState(140);
  const [isResizing, setIsResizing] = useState(false);

  // Helper function to calculate distance between two points
  const dist = (p1, p2) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  // Returns all points within distance eps of x
  const regionQuery = (points, center, eps) => {
    return points.filter(p => dist(p, center) < eps);
  };

  // Creates an epsilon ball animation around a point
  const createEpsBall = (svg, point, eps, scale, keep = false) => {
    const ball = svg.append("circle")
      .attr("class", "eps_ball")
      .attr("cx", scale.x(point.x))
      .attr("cy", scale.y(point.y))
      .attr("r", 0)
      .style("stroke", point.cluster === null ? theme.palette.grey[500] : d3.schemeCategory10[point.cluster])
      .style("stroke-width", 2)
      .style("fill", "none");

    ball.transition()
      .duration(500)
      .attr("r", scale.x(eps) - scale.x(0));

    if (keep) {
      ball.transition()
        .delay(1000)
        .style("fill", point.cluster === null ? theme.palette.grey[500] : d3.schemeCategory10[point.cluster])
        .style("opacity", 0.2);
    } else {
      ball.transition()
        .delay(1000)
        .style("opacity", 0)
        .remove();
    }
  };

  // Generate random data points
  const generateData = () => {
    // Generate random clusters
    const clusters = 3;
    const pointsPerCluster = Math.floor(params.points / clusters);
    const newData = [];

    // Generate clustered points
    for (let i = 0; i < clusters; i++) {
      const centerX = 200 + Math.random() * 400;
      const centerY = 100 + Math.random() * 200;
      
      for (let j = 0; j < pointsPerCluster; j++) {
        newData.push({
          x: centerX + (Math.random() - 0.5) * 100,
          y: centerY + (Math.random() - 0.5) * 100,
          cluster: null,
          visited: false
        });
      }
    }

    // Add some noise points
    const noisePoints = params.points - (clusters * pointsPerCluster);
    for (let i = 0; i < noisePoints; i++) {
      newData.push({
        x: Math.random() * 800,
        y: Math.random() * 400,
        cluster: null,
        visited: false
      });
    }

    setData(newData);
    setIteration(0);
    setCurrentPoint(null);
    setDbscanState({
      index: 0,
      cluster: 0,
      neigh: [],
      phase: "initial"
    });
  };

  const dbscanStep = () => {
    const newData = [...data];
    const state = { ...dbscanState };
    const svg = d3.select(svgRef.current);
    
    const scale = {
      x: d3.scaleLinear().domain([0, 800]).range([50, 750]),
      y: d3.scaleLinear().domain([0, 400]).range([350, 50])
    };

    // Not expanding a cluster
    if (state.neigh.length === 0) {
      let index = state.index;
      while (index < newData.length && newData[index].visited) {
        index++;
      }

      if (index === newData.length) {
        setIsRunning(false);
        state.phase = "done";
        setDbscanState(state);
        return;
      }

      state.index = index + 1;
      const point = newData[index];
      point.visited = true;
      setCurrentPoint(point);

      const neighbors = regionQuery(newData, point, params.epsilon);
      
      if (neighbors.length >= params.minPoints) {
        state.cluster += 1;
        neighbors.forEach(n => {
          n.cluster = state.cluster;
          if (n !== point) {
            state.neigh.push(n);
          }
        });
        createEpsBall(svg, point, params.epsilon, scale, true);
      } else {
        point.cluster = -1; // Noise
        createEpsBall(svg, point, params.epsilon, scale, false);
      }
    } else {
      // Expanding a cluster
      const point = state.neigh.shift();
      if (!point.visited) {
        point.visited = true;
        setCurrentPoint(point);

        const neighbors = regionQuery(newData, point, params.epsilon);
        
        if (neighbors.length >= params.minPoints) {
          neighbors.forEach(n => {
            if (n.cluster === null || n.cluster === -1) {
              n.cluster = state.cluster;
              if (!n.visited) {
                state.neigh.push(n);
              }
            }
          });
          createEpsBall(svg, point, params.epsilon, scale, true);
        } else {
          createEpsBall(svg, point, params.epsilon, scale, false);
        }
      }
    }

    setData(newData);
    setDbscanState(state);
    setIteration(prev => prev + 1);
  };

  // Initialize visualization
  useEffect(() => {
    generateData();
  }, [params.points]);

  // DBSCAN algorithm functions
  const getNeighbors = (point, data) => {
    return data.filter(p => 
      Math.sqrt(Math.pow(p.x - point.x, 2) + Math.pow(p.y - point.y, 2)) <= params.epsilon
    );
  };

  const algorithmStep = () => {
    if (!data.some(p => !p.visited)) {
      setIsRunning(false);
      return;
    }

    const newData = [...data];
    let currentCluster = Math.max(...newData.map(p => p.cluster || -1)) + 1;
    
    // Find first unvisited point
    const pointIndex = newData.findIndex(p => !p.visited);
    if (pointIndex === -1) return;

    const point = newData[pointIndex];
    point.visited = true;
    setCurrentPoint(point);

    const neighbors = getNeighbors(point, newData);

    if (neighbors.length < params.minPoints) {
      point.cluster = -1; // Noise
    } else {
      point.cluster = currentCluster;
      
      // Expand cluster
      neighbors.forEach(neighbor => {
        if (!neighbor.visited) {
          neighbor.visited = true;
          const neighborNeighbors = getNeighbors(neighbor, newData);
          if (neighborNeighbors.length >= params.minPoints) {
            neighbor.cluster = currentCluster;
          }
        }
        if (neighbor.cluster === null || neighbor.cluster === -1) {
          neighbor.cluster = currentCluster;
        }
      });
    }

    setData(newData);
    setIteration(prev => prev + 1);
  };

  // D3 visualization setup
  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const svgElement = svgRef.current;
    const width = svgElement.clientWidth || 800;
    const height = svgElement.clientHeight || 600;

    if (width <= 0 || height <= 0) return;

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const scale = {
      x: d3.scaleLinear().domain([0, 800]).range([margin.left, margin.left + chartWidth]),
      y: d3.scaleLinear().domain([0, 400]).range([margin.top + chartHeight, margin.top])
    };

    // Add axes
    const xAxis = d3.axisBottom(scale.x).ticks(10);
    const yAxis = d3.axisLeft(scale.y).ticks(10);

    svg.append("g")
      .attr("transform", `translate(0,${margin.top + chartHeight})`)
      .style("color", theme.palette.text.secondary)
      .call(xAxis);

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .style("color", theme.palette.text.secondary)
      .call(yAxis);

    // Create a group for epsilon balls
    svg.append("g")
      .attr("class", "eps-balls");

    // Draw points with transitions
    const points = svg.selectAll("circle.point")
      .data(data)
      .join("circle")
      .attr("class", "point")
      .attr("cx", d => scale.x(d.x))
      .attr("cy", d => scale.y(d.y))
      .attr("r", 5)
      .style("fill", d => {
        if (d.cluster === null) return theme.palette.grey[400];
        if (d.cluster === -1) return theme.palette.grey[900];
        return d3.schemeCategory10[d.cluster % 10];
      })
      .style("stroke", d => d === currentPoint ? theme.palette.warning.main : "none")
      .style("stroke-width", 2)
      .style("cursor", "pointer")
      .style("transition", "all 0.3s ease");

    // Add hover effects
    points
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8)
          .style("stroke", theme.palette.warning.main)
          .style("stroke-width", 2);

        // Show epsilon circle on hover
        svg.append("circle")
          .attr("class", "hover-eps")
          .attr("cx", scale.x(d.x))
          .attr("cy", scale.y(d.y))
          .attr("r", scale.x(params.epsilon) - scale.x(0))
          .style("fill", "none")
          .style("stroke", theme.palette.warning.main)
          .style("stroke-dasharray", "5,5")
          .style("opacity", 0)
          .transition()
          .duration(200)
          .style("opacity", 0.5);
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 5)
          .style("stroke", d => d === currentPoint ? theme.palette.warning.main : "none");

        svg.selectAll(".hover-eps")
          .transition()
          .duration(200)
          .style("opacity", 0)
          .remove();
      });

    // Draw current point's epsilon radius
    if (currentPoint) {
      svg.append("circle")
        .attr("class", "current-eps")
        .attr("cx", scale.x(currentPoint.x))
        .attr("cy", scale.y(currentPoint.y))
        .attr("r", scale.x(params.epsilon) - scale.x(0))
        .style("fill", "none")
        .style("stroke", theme.palette.warning.main)
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,5")
        .style("opacity", 0)
        .transition()
        .duration(300)
        .style("opacity", 1);
    }
  }, [data, currentPoint, params.epsilon, theme]);

  // Animation control
  useEffect(() => {
    if (isRunning) {
      animationRef.current = setInterval(
        algorithmStep,
        1000 / params.speed
      );
    }
    return () => clearInterval(animationRef.current);
  }, [isRunning, params.speed, data]);

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
            Epsilon: {params.epsilon}
          </Typography>
          <Slider
            value={params.epsilon}
            onChange={(_, value) => setParams({ ...params, epsilon: value })}
            min={20}
            max={100}
            disabled={isRunning}
            size="small"
            sx={{ '& .MuiSlider-thumb': { width: 16, height: 16 } }}
          />
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: '0.75rem', mb: 0.5 }}>
            Min Points: {params.minPoints}
          </Typography>
          <Slider
            value={params.minPoints}
            onChange={(_, value) => setParams({ ...params, minPoints: value })}
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
        </Box>

        <Box sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          mb: 1
        }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Iteration</Typography>
          <Typography sx={{ fontSize: '1.3rem', color: theme.palette.primary.main, fontWeight: 'bold' }}>
            {iteration}
          </Typography>
        </Box>

        <Box sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.success.main, 0.1),
          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
        }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Clusters</Typography>
          <Typography sx={{ fontSize: '1.3rem', color: theme.palette.success.main, fontWeight: 'bold' }}>
            {dbscanState.cluster}
          </Typography>
        </Box>
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
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Box sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 1
        }}>
          <Box sx={{ 
            position: 'absolute',
            top: 10,
            left: 160,
            background: alpha(theme.palette.info.main, 0.1),
            border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
            borderRadius: 1,
            px: 1.5,
            py: 0.75,
            zIndex: 10
          }}>
            <Typography sx={{ fontSize: '0.75rem', color: 'info.main' }}>
              🔍 Scroll to zoom | Drag to pan
            </Typography>
          </Box>
          
          <Button
            onClick={resetZoom}
            size="small"
            variant="outlined"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              fontSize: '0.7rem',
              padding: '4px 8px',
              zIndex: 10
            }}
          >
            Reset Zoom
          </Button>

          <svg
            ref={svgRef}
            style={{
              width: '100%',
              height: '100%',
              background: alpha(theme.palette.background.default, 0.5),
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              transformOrigin: 'center',
              transition: isDragging ? 'none' : 'transform 0.1s',
              cursor: 'inherit'
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default DBSCAN;