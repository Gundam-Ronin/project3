let allLaunchData = [];

async function fetchLaunchData() {
  const response = await fetch('/api/launches');
  const data = await response.json();
  allLaunchData = data;
  populateFilters(data);
  updateCharts(data);
}

function populateFilters(data) {
  const years = [...new Set(data.map(d => d.launch_year))].sort();
  const agencies = [...new Set(data.map(d => d.agency))].sort();

  years.forEach(year => {
    document.getElementById('yearDropdown').innerHTML += `<option value="${year}">${year}</option>`;
  });

  agencies.forEach(agency => {
    document.getElementById('agencyDropdown').innerHTML += `<option value="${agency}">${agency}</option>`;
  });
}

function filterData() {
  const selectedYear = document.getElementById('yearDropdown').value;
  const selectedAgency = document.getElementById('agencyDropdown').value;

  return allLaunchData.filter(d =>
    (selectedYear === 'all' || d.launch_year == selectedYear) &&
    (selectedAgency === 'all' || d.agency === selectedAgency)
  );
}

function updateCharts() {
  const filtered = filterData();

  // 1. Bar Chart – Launches per Year
  const yearCounts = {};
  filtered.forEach(d => {
    yearCounts[d.launch_year] = (yearCounts[d.launch_year] || 0) + 1;
  });

  const barData = [{
    x: Object.keys(yearCounts),
    y: Object.values(yearCounts),
    type: 'bar',
    marker: { color: 'rgb(26, 118, 255)' }
  }];

  Plotly.newPlot('barChart', barData, {
    title: 'Launches per Year',
    xaxis: { title: 'Year' },
    yaxis: { title: 'Number of Launches' }
  });

  // 2. Bubble Chart – Payload vs Year
  const bubbleData = [{
    x: filtered.map(d => d.launch_year),
    y: filtered.map(d => d.payload_mass_kg || 0),
    text: filtered.map(d => d.mission_name),
    mode: 'markers',
    marker: {
      size: filtered.map(d => d.payload_mass_kg || 0),
      sizemode: 'area',
      sizeref: 2.0 * Math.max(...filtered.map(d => d.payload_mass_kg || 1)) / (100**2),
      color: filtered.map(d => d.agency),
      showscale: true
    }
  }];

  Plotly.newPlot('bubbleChart', bubbleData, {
    title: 'Payload Mass vs Launch Year',
    xaxis: { title: 'Launch Year' },
    yaxis: { title: 'Payload Mass (kg)' }
  });

  // 3. Pie Chart – Launch Success Rate
  const successCount = filtered.filter(d => d.success === true).length;
  const failureCount = filtered.filter(d => d.success === false).length;

  const pieData = [{
    labels: ['Success', 'Failure'],
    values: [successCount, failureCount],
    type: 'pie',
    textinfo: 'label+percent',
    hole: 0.4
  }];

  Plotly.newPlot('pieChart', pieData, {
    title: 'Launch Outcome Breakdown'
  });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('yearDropdown').addEventListener('change', updateCharts);
  document.getElementById('agencyDropdown').addEventListener('change', updateCharts);
  fetchLaunchData();
});
