import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Slider,
  Typography,
  Button,
  Paper,
  FormControl,
  Grid,
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
    if (!data.length || !regression) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.x)])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.y) - 10, d3.max(data, d => d.y) + 10])
      .range([height, 0]);

    // Add the x-axis
    g.append("g")
      .attr("transform", `translate(0,${height})`)
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
      .attr("x", width - 200)
      .attr("y", 30)
      .style("fill", theme.palette.text.primary)
      .text(equation);

  }, [data, regression, theme]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ 
        background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        fontWeight: 'bold'
      }}>
        Linear Regression Visualization
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <StyledPaper>
            <Typography gutterBottom variant="h6" sx={{ mb: 3 }}>
              Parameters
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography gutterBottom>
                Number of Points: {params.points}
              </Typography>
              <Slider
                value={params.points}
                onChange={(_, value) => setParams({ ...params, points: value })}
                min={10}
                max={200}
                step={10}
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

            <Box sx={{ mb: 4 }}>
              <Typography gutterBottom>
                Noise Level: {params.noise}
              </Typography>
              <Slider
                value={params.noise}
                onChange={(_, value) => setParams({ ...params, noise: value })}
                min={0}
                max={50}
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

            <Box sx={{ display: 'flex', gap: 2 }}>
              <StyledButton
                variant="contained"
                startIcon={<RestartAltIcon />}
                onClick={generateData}
                fullWidth
              >
                Generate New Data
              </StyledButton>
            </Box>
          </StyledPaper>

          <StyledPaper sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
            {regression && (
              <>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Slope: {regression.slope.toFixed(4)}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Intercept: {regression.intercept.toFixed(4)}
                </Typography>
                <Typography variant="body2">
                  R²: {regression.score(data.map(p => p.x), data.map(p => p.y)).toFixed(4)}
                </Typography>
              </>
            )}
          </StyledPaper>
        </Grid>

        <Grid item xs={12} md={9}>
          <StyledPaper>
            <svg
              ref={svgRef}
              style={{
                width: '100%',
                height: '600px',
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

export default LinearRegression;