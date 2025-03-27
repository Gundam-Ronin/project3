document.addEventListener('DOMContentLoaded', function () {
  // Fetch and display launch data
  fetch('/api/launches')
    .then(response => response.json())
    .then(data => {
      populateDropdown(data);
      renderCharts(data); // Initial render
    });

  // Populate year dropdown
  function populateDropdown(data) {
    const yearDropdown = document.getElementById('yearDropdown');
    if (!yearDropdown) return;

    const years = [...new Set(data.map(d => d.launch_year))].sort();
    yearDropdown.innerHTML = '<option value="All">All Years</option>';
    years.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearDropdown.appendChild(option);
    });

    yearDropdown.addEventListener('change', function () {
      const selectedYear = this.value;
      const filteredData = selectedYear === 'All' 
        ? data 
        : data.filter(d => d.launch_year == selectedYear);
      renderCharts(filteredData);
    });
  }

  // Render all charts
  function renderCharts(data) {
    renderBarChart(data);
    renderBubbleChart(data);
    renderSuccessPie(data);
  }

  function renderBarChart(data) {
    const yearCounts = {};
    data.forEach(d => {
      yearCounts[d.launch_year] = (yearCounts[d.launch_year] || 0) + 1;
    });

    const trace = {
      x: Object.keys(yearCounts),
      y: Object.values(yearCounts),
      type: 'bar'
    };

    Plotly.newPlot('bar', [trace]);
  }

  function renderBubbleChart(data) {
    const trace = {
      x: data.map(d => d.launch_year),
      y: data.map(d => d.success ? 1 : 0),
      text: data.map(d => d.mission_name),
      mode: 'markers',
      marker: {
        size: data.map(d => d.success ? 20 : 10),
        color: data.map(d => d.success ? 'green' : 'red'),
      }
    };

    Plotly.newPlot('bubble', [trace]);
  }

  function renderSuccessPie(data) {
    const successCount = data.filter(d => d.success).length;
    const failureCount = data.length - successCount;

    const trace = {
      labels: ['Success', 'Failure'],
      values: [successCount, failureCount],
      type: 'pie'
    };

    Plotly.newPlot('pie', [trace]);
  }
});
