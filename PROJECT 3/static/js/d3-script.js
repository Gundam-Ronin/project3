// d3-script.js (Updated)
document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/launches")
    .then((res) => res.json())
    .then((data) => {
      if (!data.length) {
        console.error("No data returned from /api/launches");
        return;
      }
      populateDropdowns(data);
      drawBubbleChart(data);
    })
    .catch((err) => console.error("Error fetching launch data:", err));

  document.getElementById("agency-filter").addEventListener("change", applyFilters);
  document.getElementById("year-filter").addEventListener("change", applyFilters);
});

function populateDropdowns(data) {
  const agencies = new Set();
  const years = new Set();

  data.forEach((d) => {
    if (d.agency) agencies.add(d.agency);
    if (d.launch_year) years.add(d.launch_year);
  });

  const agencyDropdown = document.getElementById("agency-filter");
  const yearDropdown = document.getElementById("year-filter");

  agencies.forEach((agency) => {
    const option = document.createElement("option");
    option.value = agency;
    option.textContent = agency;
    agencyDropdown.appendChild(option);
  });

  Array.from(years).sort().forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearDropdown.appendChild(option);
  });
}

function applyFilters() {
  const selectedAgency = document.getElementById("agency-filter").value;
  const selectedYear = document.getElementById("year-filter").value;

  fetch("/api/launches")
    .then((res) => res.json())
    .then((data) => {
      const filtered = data.filter((d) => {
        return (
          (selectedAgency === "All" || d.agency === selectedAgency) &&
          (selectedYear === "All" || d.launch_year == selectedYear)
        );
      });
      drawBubbleChart(filtered);
    })
    .catch((err) => console.error("Error applying filters:", err));
}

function resetFilters() {
  document.getElementById("agency-filter").value = "All";
  document.getElementById("year-filter").value = "All";
  applyFilters();
}

function drawBubbleChart(data) {
  const svg = d3.select("#bubble-chart");
  svg.selectAll("*").remove();
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const radiusScale = d3.scaleSqrt().domain([0, d3.max(data, (d) => +d.price || 1)]).range([4, 40]);
  const nodes = data.map((d) => ({
    r: radiusScale(+d.price || 1),
    agency: d.agency,
    mission: d.mission_name
  }));

  const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(1))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius((d) => d.r + 1))
    .on("tick", ticked);

  const circles = svg.selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", (d) => d.r)
    .attr("fill", "steelblue")
    .append("title")
    .text((d) => `${d.agency}: ${d.mission}`);

  function ticked() {
    svg.selectAll("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y);
  }
}
