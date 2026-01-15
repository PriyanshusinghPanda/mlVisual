import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Slider,
  Typography,
  Button,
  Paper,
  styled,
  useTheme,
  alpha
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import * as d3 from 'd3';
import { SimpleLinearRegression } from 'ml-regression';

const StyledPaper = styled(Paper)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
  },
}));

const LinearRegression = () => {
  const theme = useTheme();
  const [params, setParams] = useState({
    points: 50,
    noise: 20,
  });
  const [data, setData] = useState([]);
  const [regression, setRegression] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panelWidth, setPanelWidth] = useState(140);
  const [isResizing, setIsResizing] = useState(false);
  const svgRef = useRef();

  const generateData = () => {
    const slope = Math.random() * 2 - 1; // Random slope between -1 and 1
    const intercept = Math.random() * 100; // Random intercept
    const newData = [];
    
    for (let i = 0; i < params.points; i++) {
      const x = Math.random() * 800;
      const yTrue = slope * x + intercept;
      const noise = (Math.random() - 0.5) * params.noise;
      newData.push({
        x: x,
        y: yTrue + noise
      });
    }
    
    setData(newData);
    calculateRegression(newData);
  };

  const calculateRegression = (points) => {
    const x = points.map(p => p.x);
    const y = points.map(p => p.y);
    const regression = new SimpleLinearRegression(x, y);
    setRegression(regression);
  };

  useEffect(() => {
    generateData();
  }, [params.points, params.noise]);

  useEffect(() => {
    if (!data.length || !regression || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const svgElement = svgRef.current;
    const width = svgElement.clientWidth || 800;
    const height = svgElement.clientHeight || 600;

    if (width <= 0 || height <= 0) return;

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.x)])
      .range([0, chartWidth]);

    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.y) - 10, d3.max(data, d => d.y) + 10])
      .range([chartHeight, 0]);

    // Add the x-axis
    g.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .style("color", theme.palette.text.secondary);

    // Add the y-axis
    g.append("g")
      .call(d3.axisLeft(y))
      .style("color", theme.palette.text.secondary);

    // Add the scatter plot
    g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.x))
      .attr("cy", d => y(d.y))
      .attr("r", 4)
      .style("fill", theme.palette.primary.main)
      .style("opacity", 0.6);

    // Add the regression line
    const line = d3.line()
      .x(d => x(d))
      .y(d => y(regression.predict(d)));

    const xDomain = x.domain();
    g.append("path")
      .datum([xDomain[0], xDomain[1]])
      .attr("class", "line")
      .attr("d", line)
      .style("stroke", theme.palette.secondary.main)
      .style("stroke-width", 2)
      .style("fill", "none");

    // Add equation text
    const equation = `y = ${regression.slope.toFixed(2)}x + ${regression.intercept.toFixed(2)}`;
    g.append("text")
      .attr("x", chartWidth - 200)
      .attr("y", 30)
      .style("fill", theme.palette.text.primary)
      .text(equation);

  }, [data, regression, theme]);

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
            Points: {params.points}
          </Typography>
          <Slider
            value={params.points}
            onChange={(_, value) => setParams({ ...params, points: value })}
            min={10}
            max={200}
            step={10}
            size="small"
            sx={{ '& .MuiSlider-thumb': { width: 16, height: 16 } }}
          />
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: '0.75rem', mb: 0.5 }}>
            Noise: {params.noise}
          </Typography>
          <Slider
            value={params.noise}
            onChange={(_, value) => setParams({ ...params, noise: value })}
            min={0}
            max={50}
            size="small"
            sx={{ '& .MuiSlider-thumb': { width: 16, height: 16 } }}
          />
        </Box>

        <Button
          variant="contained"
          startIcon={<RestartAltIcon />}
          onClick={generateData}
          fullWidth
          size="small"
          sx={{ fontSize: '0.7rem', padding: '4px', mb: 1.5 }}
        >
          Generate
        </Button>

        <Box sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
        }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', mb: 0.5 }}>Stats</Typography>
          {regression && (
            <>
              <Typography sx={{ fontSize: '0.65rem', mb: 0.25 }}>
                m: {regression.slope.toFixed(3)}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', mb: 0.25 }}>
                b: {regression.intercept.toFixed(3)}
              </Typography>
              <Typography sx={{ fontSize: '0.65rem' }}>
                R²: {regression.score(data.map(p => p.x), data.map(p => p.y)).r2.toFixed(3)}
              </Typography>
            </>
          )}
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

export default LinearRegression;