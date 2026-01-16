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
import EditIcon from '@mui/icons-material/Edit';
import GestureIcon from '@mui/icons-material/Gesture';
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
    speed: 1,
    shape: 'blobs',
    brushSize: 20
  });
  const [isRunning, setIsRunning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [iteration, setIteration] = useState(0);
  const svgRef = useRef();
  const animationRef = useRef();
  const [data, setData] = useState([]);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [dbscanState, setDbscanState] = useState({
    index: 0,
    cluster: 0,
    queue: [],
    phase: "FIND_UNVISITED"
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
    let newData = [];
    
    switch (params.shape) {
      case 'circles':
        newData = generateCircles();
        break;
      case 'moons':
        newData = generateMoons();
        break;
      case 'blobs':
      default:
        newData = generateBlobs();
        break;
    }

    setData(newData);
    setIteration(0);
    setCurrentPoint(null);
    setDbscanState({
       index: 0,
       cluster: 0,
       queue: [],
       phase: "FIND_UNVISITED"
    });
  };

  const generateBlobs = () => {
    const clusters = 3;
    const pointsPerCluster = Math.floor(params.points / clusters);
    const newData = [];

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

    const noisePoints = params.points - (clusters * pointsPerCluster);
    for (let i = 0; i < noisePoints; i++) {
      newData.push({
        x: Math.random() * 800,
        y: Math.random() * 400,
        cluster: null,
        visited: false
      });
    }
    return newData;
  };

  const generateCircles = () => {
    const newData = [];
    const pointsPerCircle = Math.floor(params.points / 2);
    
    // Inner circle
    for (let i = 0; i < pointsPerCircle; i++) {
      const angle = (i / pointsPerCircle) * 2 * Math.PI;
      const r = 80 + (Math.random() - 0.5) * 20;
      newData.push({
        x: 400 + r * Math.cos(angle),
        y: 200 + r * Math.sin(angle),
        cluster: null,
        visited: false
      });
    }

    // Outer circle
    for (let i = 0; i < params.points - pointsPerCircle; i++) {
      const angle = (i / (params.points - pointsPerCircle)) * 2 * Math.PI;
      const r = 180 + (Math.random() - 0.5) * 20;
      newData.push({
        x: 400 + r * Math.cos(angle),
        y: 200 + r * Math.sin(angle),
        cluster: null,
        visited: false
      });
    }
    return newData;
  };

  const generateMoons = () => {
    const newData = [];
    const pointsPerMoon = Math.floor(params.points / 2);
    
    // Top moon
    for (let i = 0; i < pointsPerMoon; i++) {
      const angle = (i / pointsPerMoon) * Math.PI;
      const r = 100 + (Math.random() - 0.5) * 20;
      newData.push({
        x: 300 + r * Math.cos(angle),
        y: 200 - r * Math.sin(angle),
        cluster: null,
        visited: false
      });
    }

    // Bottom moon
    for (let i = 0; i < params.points - pointsPerMoon; i++) {
      const angle = (i / (params.points - pointsPerMoon)) * Math.PI;
      const r = 100 + (Math.random() - 0.5) * 20;
      newData.push({
        x: 500 + r * Math.cos(angle), // Moved right +200
        y: 200 + r * Math.sin(angle) - 50, // Moved down and adjusted overlap
        cluster: null,
        visited: false
      });
    }
    return newData;
  };



  // Initialize visualization
  useEffect(() => {
    generateData();
  }, [params.points, params.shape]);

  // Precompute neighbors when data or epsilon changes
  useEffect(() => {
    if (data.length === 0) return;
    neighborsRef.current = data.map(p => 
      data.map(q => dist(p, q) <= params.epsilon)
    );
  }, [data, params.epsilon]);

  // DBSCAN algorithm functions
  // Optimization: uses precomputed boolean matrix
  const getNeighbors = (index) => {
    return data.filter((_, i) => neighborsRef.current[index][i]);
  };

  const algorithmStep = () => {
    const newData = [...data];
    const state = { ...dbscanState };
    
    // Phase 1: FIND_UNVISITED
    // Search for the next unvisited point to start a new cluster or identify noise
    if (state.phase === "FIND_UNVISITED") {
      // Find first unvisited point starting from current index
      let foundIndex = -1;
      for (let i = state.index; i < newData.length; i++) {
        if (!newData[i].visited) {
          foundIndex = i;
          break;
        }
      }

      if (foundIndex === -1) {
        // All points visited, finished
        setIsRunning(false);
        return;
      }

      // Update state to point to this new unvisited point
      state.index = foundIndex;
      state.phase = "CHECK_NEIGHBORS";
      
      // Visuals: Highlight the point we are checking
      const point = newData[foundIndex];
      setCurrentPoint(point);
      
      setDbscanState(state);
      return;
    }

    // Phase 2: CHECK_NEIGHBORS
    // Check if the current point has enough neighbors to start a cluster
    if (state.phase === "CHECK_NEIGHBORS") {
      const point = newData[state.index];
      point.visited = true; // Mark as visited
      
      point.visited = true; // Mark as visited
      const neighbors = getNeighbors(state.index);
      
      if (neighbors.length < params.minPoints) {
        // Mark as Noise
        point.cluster = -1; 
        state.phase = "FIND_UNVISITED";
        state.index += 1; // Move search forward
      } else {
        // Start New Cluster
        state.cluster += 1;
        point.cluster = state.cluster;
        
        // Add valid neighbors to queue for expansion
        // "If a neighboring point also has at least MinPts neighbors, include it in the same cluster." 
        // -> Standard DBSCAN: Add all neighbors to queue. We check their density later.
        // But strictly: "Move to each of its neighboring points... If a neighboring point also has..."
        // We will add all neighbors to the queue to process them one by one.
        
        const neighborsToQueue = neighbors.map(n => newData.indexOf(n));
        
        // Assign cluster ID to neighbors immediately (Density-Reachable)
        neighborsToQueue.forEach(idx => {
            if (newData[idx].cluster === null || newData[idx].cluster === -1) {
                newData[idx].cluster = state.cluster;
            }
        });
        
        state.queue = neighborsToQueue;
        state.phase = "EXPAND_CLUSTER";
      }
      
      setData(newData);
      setDbscanState(state);
      setIteration(prev => prev + 1);
      return;
    }

    // Phase 3: EXPAND_CLUSTER
    // Process neighbors in the queue
    if (state.phase === "EXPAND_CLUSTER") {
      if (state.queue.length === 0) {
        // No more neighbors, cluster finished
        state.phase = "FIND_UNVISITED";
        state.index += 1;
        setDbscanState(state);
        return;
      }

      // Pop next neighbor index
      const neighborIndex = state.queue.shift();
      const neighborPoint = newData[neighborIndex];

      // Highlight current expansion point
      setCurrentPoint(neighborPoint);

      // "If not visited..."
      if (!neighborPoint.visited) {
        neighborPoint.visited = true;
        
        const neighborNeighbors = getNeighbors(neighborPoint, newData);
        
        if (neighborNeighbors.length >= params.minPoints) {
          // "Include it in the same cluster" (already done when added to queue/cluster)
          // "Continue expanding..." -> Add its neighbors to queue
          neighborNeighbors.forEach(n => {
            const nIdx = newData.indexOf(n);
            if (newData[nIdx].cluster === null || newData[nIdx].cluster === -1) {
               newData[nIdx].cluster = state.cluster;
               // Avoid adding duplicates to queue to prevent infinite loops/redundancy? 
               // Standard DBSCAN adds if not visited. We do this by checking visited later or here.
               if (!newData[nIdx].visited && !state.queue.includes(nIdx)) {
                   state.queue.push(nIdx);
               }
            }
          });
        }
      }
      
      if (neighborPoint.cluster === null || neighborPoint.cluster === -1) {
          neighborPoint.cluster = state.cluster;
      }

      setData(newData);
      setDbscanState(state);
      setIteration(prev => prev + 1);
    }
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
  }, [isRunning, params.speed, data, dbscanState]);

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

  const addPointsAt = (clientX, clientY) => {
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const canvasX = (clickX - transform.x) / transform.scale;
    const canvasY = (clickY - transform.y) / transform.scale;

    const svgElement = svgRef.current;
    const width = svgElement.clientWidth || 800;
    const height = svgElement.clientHeight || 600;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const scaleX = d3.scaleLinear().domain([0, 800]).range([margin.left, margin.left + chartWidth]);
    const scaleY = d3.scaleLinear().domain([0, 400]).range([margin.top + chartHeight, margin.top]);

    // Generate multiple points if dragging/brushing
    const pointsToAdd = [];
    const density = Math.max(1, Math.floor(params.brushSize / 5));
    
    for (let i = 0; i < density; i++) {
        // Random offset within brush radius (in data coordinates estimate)
        // We need to convert brushSize (pixels) to data units approx
        // approx scale factor is (chartWidth / 800) ~ 0.8
        const r = (Math.random() * params.brushSize) / transform.scale; 
        const theta = Math.random() * 2 * Math.PI;
        const offsetX = r * Math.cos(theta);
        const offsetY = r * Math.sin(theta);
        
        const dataX = scaleX.invert(canvasX + offsetX);
        const dataY = scaleY.invert(canvasY + offsetY);

        pointsToAdd.push({
            x: dataX,
            y: dataY,
            cluster: null,
            visited: false
        });
    }

    setData(prev => [...prev, ...pointsToAdd]);
  };

  const handleMouseDown = (e) => {
    if (isDrawing) {
       addPointsAt(e.clientX, e.clientY);
       // Allow dragging to continue adding points
       setIsDragging(true); // Reuse isDragging to track mouse down state for drawing too
       return;
    }
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    if (isDrawing) {
        addPointsAt(e.clientX, e.clientY);
        return;
    }

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
          <InputLabel sx={{ fontSize: '0.75rem' }}>Shape</InputLabel>
          <Select
            value={params.shape}
            onChange={(e) => setParams({ ...params, shape: e.target.value })}
            label="Shape"
            size="small"
            disabled={isRunning}
          >
            <MenuItem value="blobs">Blobs</MenuItem>
            <MenuItem value="circles">Circles</MenuItem>
            <MenuItem value="moons">Moons</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: '0.75rem', mb: 0.5 }}>
            Speed: {params.speed}x
          </Typography>
          <Slider
            value={params.speed}
            onChange={(_, value) => setParams({ ...params, speed: value })}
            min={0.1}
            max={10}
            step={0.1}
            size="small"
            sx={{ '& .MuiSlider-thumb': { width: 16, height: 16 } }}
          />
        </Box>

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
          {!isRunning && iteration > 0 && (
             <Button
                variant="outlined"
                startIcon={<PlayArrowIcon />}
                onClick={algorithmStep}
                fullWidth
                size="small"
                sx={{ fontSize: '0.7rem', padding: '4px' }}
              >
                Next Step
              </Button>
          )}
          <Button
            variant={isDrawing ? "contained" : "outlined"}
            color={isDrawing ? "warning" : "primary"}
            startIcon={<EditIcon />}
            onClick={() => setIsDrawing(!isDrawing)}
            fullWidth
            size="small"
            sx={{ fontSize: '0.7rem', padding: '4px' }}
          >
            {isDrawing ? 'Drawing On' : 'Draw Points'}
          </Button>

          {isDrawing && (
            <Box sx={{ mt: 1, px: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, pt: 1 }}>
                <Typography sx={{ fontSize: '0.65rem' }}>Brush Size: {params.brushSize}</Typography>
                <Slider 
                    value={params.brushSize}
                    onChange={(_, v) => setParams({...params, brushSize: v})}
                    min={5}
                    max={50}
                    size="small"
                />
            </Box>
          )}
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

        <Box sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.error.main, 0.1),
          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
          mt: 1
        }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Noise Points</Typography>
          <Typography sx={{ fontSize: '1.3rem', color: theme.palette.error.main, fontWeight: 'bold' }}>
            {data.filter(p => p.cluster === -1).length}
          </Typography>
        </Box>

        <Box sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.info.main, 0.1),
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          mt: 1
        }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Visited / Total</Typography>
          <Typography sx={{ fontSize: '1.3rem', color: theme.palette.info.main, fontWeight: 'bold' }}>
            {data.filter(p => p.visited).length} / {params.points}
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
          cursor: isDrawing ? 'crosshair' : (isDragging ? 'grabbing' : 'grab')
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