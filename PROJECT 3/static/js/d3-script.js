// Determine base URL (for local vs deployed)
const BASE_URL = window.location.hostname.includes("render.com")
  ? "https://project3-qk90.onrender.com"
  : "";

// Fetch and load data
function loadLaunchData() {
  fetch(`${BASE_URL}/api/launches`)
    .then(response => response.json())
    .then(data => {
      console.log("Fetched data:", data); // Debugging
      populateFilters(data);
      drawBubbleChart(data);
      launchRocketAnimation(data);
    })
    .catch(error => console.error("Error fetching launch data:", error));
}

function populateFilters(data) {
  const agencySet = new Set(data.map(d => d.agency));
  const yearSet = new Set(data.map(d => d.launch_year));

  const agencySelect = d3.select("#agency-filter");
  agencySet.forEach(agency => {
    agencySelect.append("option").text(agency).attr("value", agency);
  });

  const yearSelect = d3.select("#year-filter");
  yearSet.forEach(year => {
    yearSelect.append("option").text(year).attr("value", year);
  });
}

function applyFilters() {
  const agency = d3.select("#agency-filter").property("value");
  const year = d3.select("#year-filter").property("value");

  fetch(`${BASE_URL}/api/launches`)
    .then(response => response.json())
    .then(data => {
      let filtered = data;
      if (agency !== "All") {
        filtered = filtered.filter(d => d.agency === agency);
      }
      if (year !== "All") {
        filtered = filtered.filter(d => d.launch_year == year);
      }
      drawBubbleChart(filtered);
      launchRocketAnimation(filtered);
    });
}

function resetFilters() {
  d3.select("#agency-filter").property("value", "All");
  d3.select("#year-filter").property("value", "All");
  loadLaunchData();
}

// BUBBLE CHART
function drawBubbleChart(data) {
  const svg = d3.select("#bubble-chart");
  svg.selectAll("*").remove();

  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const simulation = d3.forceSimulation(data)
    .force("charge", d3.forceManyBody().strength(5))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => (d.success ? 10 : 5)))
    .on("tick", ticked);

  const color = d => d.success ? "#4CAF50" : "#F44336";

  const circles = svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("r", d => d.success ? 10 : 5)
    .attr("fill", d => color(d))
    .append("title")
    .text(d => d.mission_name);

  function ticked() {
    svg.selectAll("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }
}

// ROCKET ANIMATION
function launchRocketAnimation(data) {
  const svg = d3.select("#rocket-launch");
  svg.selectAll("*").remove();

  const rocketData = data.slice(0, 5); // Display only first 5 for effect

  const rockets = svg.selectAll("circle")
    .data(rocketData)
    .enter()
    .append("circle")
    .attr("cx", (d, i) => 100 + i * 150)
    .attr("cy", 200)
    .attr("r", 10)
    .attr("fill", d => d.success ? "limegreen" : "red");

  rockets.transition()
    .duration(3000)
    .attr("cy", 20);
}

loadLaunchData();
