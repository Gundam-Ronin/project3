fetch("/api/launches")
  .then(res => res.json())
  .then(data => {
    const years = data.map(d => d.launch_year);
    const agencies = data.map(d => d.agency);
    
    // Bar Chart: Launches per year
    const barData = [{
      x: years,
      type: 'histogram'
    }];
    Plotly.newPlot('bar', barData, {title: 'Launches per Year'});

    // Bubble Chart: Year vs Success (or Failure)
    const bubbleData = [{
      x: years,
      y: data.map(d => d.success ? 1 : 0),
      mode: 'markers',
      marker: { size: 12 },
      text: data.map(d => d.mission_name),
    }];
    Plotly.newPlot('bubble', bubbleData, {title: 'Launch Success Over Time'});

    // Line/Custom: Total launches per agency
    const agencyCounts = {};
    agencies.forEach(a => agencyCounts[a] = (agencyCounts[a] || 0) + 1);
    const lineData = [{
      x: Object.keys(agencyCounts),
      y: Object.values(agencyCounts),
      type: 'scatter',
    }];
    Plotly.newPlot('line', lineData, {title: 'Total Launches by Agency'});
  });
