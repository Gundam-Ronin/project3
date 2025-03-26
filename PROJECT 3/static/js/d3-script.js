// D3-SCRIPT.JS

// Fetch and render all charts on page load
fetch('/api/launches')
  .then(res => res.json())
  .then(data => {
    window.launchData = data;
    populateFilters(data);
    renderCharts(data);
  });

document.getElementById('apply-filters').addEventListener('click', () => {
  const filtered = applyFilters(window.launchData);
  renderCharts(filtered);
});

document.getElementById('reset-filters').addEventListener('click', () => {
  document.getElementById('agency-filter').value = 'All';
  document.getElementById('year-filter').value = 'All';
  renderCharts(window.launchData);
});

function populateFilters(data) {
  const agencies = [...new Set(data.map(d => d.agency))];
  const years = [...new Set(data.map(d => d.launch_year))].sort();

  const agencySelect = document.getElementById('agency-filter');
  const yearSelect = document.getElementById('year-filter');

  agencies.forEach(agency => {
    const opt = document.createElement('option');
    opt.value = agency;
    opt.textContent = agency;
    agencySelect.appendChild(opt);
  });

  years.forEach(year => {
    const opt = document.createElement('option');
    opt.value = year;
    opt.textContent = year;
    yearSelect.appendChild(opt);
  });
}

function applyFilters(data) {
  const agency = document.getElementById('agency-filter').value;
  const year = document.getElementById('year-filter').value;

  return data.filter(d => {
    return (agency === 'All' || d.agency === agency) &&
           (year === 'All' || d.launch_year === +year);
  });
}

function renderCharts(data) {
  renderRocketChart(data);
  renderBubbleChart(data);
  renderBarChart(data);
}

function renderRocketChart(data) {
  const svg = d3.select('#rocket-launch');
  svg.selectAll('*').remove();

  svg.selectAll('circle')
    .data(data)
    .enter()
    .append('circle')
    .attr('cx', (_, i) => i * 30 + 20)
    .attr('cy', 100)
    .attr('r', 10)
    .attr('fill', d => d.agency === 'NASA' ? 'blue' : 'red')
    .transition()
    .duration(2000)
    .attr('cy', 20);
}

function renderBubbleChart(data) {
  const svg = d3.select('#bubble-chart');
  svg.selectAll('*').remove();

  const nodes = data.map((d, i) => ({
    id: i,
    r: 5 + Math.random() * 10,
    agency: d.agency
  }));

  const simulation = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(5))
    .force('center', d3.forceCenter(400, 200))
    .force('collision', d3.forceCollide().radius(d => d.r + 1))
    .on('tick', ticked);

  const circles = svg.selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('r', d => d.r)
    .attr('fill', d => d.agency === 'NASA' ? 'steelblue' : 'tomato');

  function ticked() {
    circles
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  }
}

function renderBarChart(data) {
  const svg = d3.select('#bar-chart');
  svg.selectAll('*').remove();

  const launchCounts = d3.rollup(
    data,
    v => v.length,
    d => d.launch_year
  );

  const entries = Array.from(launchCounts, ([year, count]) => ({ year, count }));
  entries.sort((a, b) => a.year - b.year);

  const margin = { top: 20, right: 30, bottom: 40, left: 40 },
        width = +svg.attr('width') - margin.left - margin.right,
        height = +svg.attr('height') - margin.top - margin.bottom;

  const x = d3.scaleBand()
    .domain(entries.map(d => d.year))
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(entries, d => d.count)])
    .nice()
    .range([height, 0]);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  g.append('g')
    .call(d3.axisLeft(y));

  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));

  g.selectAll('.bar')
    .data(entries)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.year))
    .attr('y', d => y(d.count))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.count))
    .attr('fill', 'darkorange');
}
