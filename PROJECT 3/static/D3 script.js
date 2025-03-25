// Enhanced D3 Visualization with Force Layout + Collide

let allData = [];

function populateDropdowns(data) {
  const agencies = Array.from(new Set(data.map(d => d.agency))).sort();
  const years = Array.from(new Set(data.map(d => d.year))).sort();

  agencies.forEach(agency => {
    d3.select("#agency-filter")
      .append("option")
      .attr("value", agency)
      .text(agency);
  });

  years.forEach(year => {
    d3.select("#year-filter")
      .append("option")
      .attr("value", year)
      .text(year);
  });
}

function applyFilters() {
  const agency = d3.select("#agency-filter").node().value;
  const year = d3.select("#year-filter").node().value;

  const filtered = allData.filter(d => {
    return (!agency || d.agency === agency) && (!year || d.year == year);
  });
  updateChart(filtered);
  renderForceLaunches(filtered);
}

function updateChart(data) {
  d3.select("#chart").html("");

  const margin = { top: 20, right: 20, bottom: 60, left: 60 },
    width = 900 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(data.map(d => d.year))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain([...new Set(data.map(d => d.agency))])
    .range(d3.schemeSet2);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg.append("g").call(d3.axisLeft(y).tickFormat(d => d + "%"));

  svg.selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.year))
    .attr("y", d => y((d.success_count / d.total) * 100))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y((d.success_count / d.total) * 100))
    .attr("fill", d => color(d.agency))
    .append("title")
    .text(d => `${d.agency} ${d.year}: ${(d.success_count / d.total * 100).toFixed(1)}% success`);
}

function renderForceLaunches(data) {
  const width = 1000, height = 300;
  const svg = d3.select("#rocketChart").html("")
    .attr("width", width)
    .attr("height", height);

  const nodes = data.map(d => ({
    ...d,
    radius: 10,
    x: Math.random() * width,
    y: Math.random() * height
  }));

  const simulation = d3.forceSimulation(nodes)
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("collide", d3.forceCollide().radius(d => d.radius + 2))
    .on("tick", () => {
      const circles = svg.selectAll("circle")
        .data(nodes, d => d.source_id);

      circles.enter()
        .append("circle")
        .attr("r", d => d.radius)
        .attr("fill", d => d.success ? "green" : "red")
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .merge(circles)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      circles.exit().remove();
    });
}

// Load initial data
fetch("/api/stats")
  .then(res => res.json())
  .then(data => {
    data.forEach(d => d.success_rate = (d.success_count / d.total) * 100);
    allData = data;
    populateDropdowns(data);
    updateChart(data);
    fetch("/api/launches")
      .then(res => res.json())
      .then(launches => renderForceLaunches(launches));
  });
