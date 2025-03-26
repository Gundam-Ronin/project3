// static/js/d3-script.js

document.addEventListener("DOMContentLoaded", () => {
  const agencyFilter = document.getElementById("agency-filter");
  const yearFilter = document.getElementById("year-filter");
  const applyFiltersBtn = document.getElementById("apply-filters");
  const resetFiltersBtn = document.getElementById("reset-filters");

  let allLaunches = [];

  fetch("/api/launches")
    .then(res => res.json())
    .then(data => {
      allLaunches = data;
      populateFilters(data);
      updateCharts(data);
    });

  function populateFilters(data) {
    const agencies = Array.from(new Set(data.map(d => d.agency))).sort();
    const years = Array.from(new Set(data.map(d => d.launch_year))).sort();

    agencies.forEach(agency => {
      const opt = document.createElement("option");
      opt.value = agency;
      opt.textContent = agency;
      agencyFilter.appendChild(opt);
    });

    years.forEach(year => {
      const opt = document.createElement("option");
      opt.value = year;
      opt.textContent = year;
      yearFilter.appendChild(opt);
    });
  }

  function updateCharts(filteredData) {
    drawRocketAnimation();
    drawBubbleChart(filteredData);
    drawBarChart(filteredData);
  }

  applyFiltersBtn.addEventListener("click", () => {
    const selectedAgency = agencyFilter.value;
    const selectedYear = yearFilter.value;

    const filtered = allLaunches.filter(d => {
      return (selectedAgency === "All" || d.agency === selectedAgency) &&
             (selectedYear === "All" || d.launch_year.toString() === selectedYear);
    });

    updateCharts(filtered);
  });

  resetFiltersBtn.addEventListener("click", () => {
    agencyFilter.value = "All";
    yearFilter.value = "All";
    updateCharts(allLaunches);
  });

  function drawRocketAnimation() {
    const svg = d3.select("#rocket-launch");
    svg.selectAll("*").remove();

    svg.append("text")
      .attr("x", 100)
      .attr("y", 100)
      .text("🚀 Rocket Launch Ready")
      .attr("font-size", "24px");
  }

  function drawBubbleChart(data) {
    const svg = d3.select("#bubble-chart");
    svg.selectAll("*").remove();

    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const scale = d3.scaleSqrt()
      .domain([0, d3.max(data, d => d.payload_mass_kg || 1)])
      .range([5, 40]);

    const simulation = d3.forceSimulation(data)
      .force("charge", d3.forceManyBody().strength(5))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => scale(d.payload_mass_kg || 1) + 2))
      .on("tick", ticked);

    const node = svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("r", d => scale(d.payload_mass_kg || 1))
      .attr("fill", d => d.success ? "green" : "red")
      .attr("opacity", 0.7);

    function ticked() {
      node.attr("cx", d => d.x)
          .attr("cy", d => d.y);
    }
  }

  function drawBarChart(data) {
    const svg = d3.select("#bar-chart");
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 60 },
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const launchesByYear = d3.rollups(data, v => v.length, d => d.launch_year)
      .sort((a, b) => d3.ascending(a[0], b[0]));

    const x = d3.scaleBand()
      .domain(launchesByYear.map(d => d[0]))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(launchesByYear, d => d[1])])
      .nice()
      .range([height, 0]);

    g.append("g")
      .call(d3.axisLeft(y));

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    g.selectAll("rect")
      .data(launchesByYear)
      .enter()
      .append("rect")
      .attr("x", d => x(d[0]))
      .attr("y", d => y(d[1]))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d[1]))
      .attr("fill", "steelblue");
  }
});
