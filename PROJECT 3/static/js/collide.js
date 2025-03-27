function renderCollideChart(data) {
  const svg = d3.select("#bubble-chart");
  svg.selectAll("*").remove();

  const width = +svg.attr("width");
  const height = +svg.attr("height");

  // Color: Success = Green, Failure = Red
  const colorScale = d3.scaleOrdinal()
    .domain(["Success", "Failure"])
    .range(["#4CAF50", "#F44336"]);

  // Radius based on payload mass (fallback = 1000)
  const radiusScale = d3.scaleSqrt()
    .domain([0, 10000])
    .range([5, 30]);

  // Filter out broken entries
  const filteredData = data.filter(d => d.payload_mass_kg !== null);

  const simulation = d3.forceSimulation(filteredData)
    .force("charge", d3.forceManyBody().strength(1))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide(d => radiusScale(d.payload_mass_kg || 1000) + 1))
    .on("tick", ticked);

  const node = svg.selectAll("circle")
    .data(filteredData)
    .enter()
    .append("circle")
    .attr("r", d => radiusScale(d.payload_mass_kg || 1000))
    .attr("fill", d => d.success ? colorScale("Success") : colorScale("Failure"))
    .attr("stroke", "#333")
    .attr("stroke-width", 0.5)
    .append("title")
    .text(d => `${d.mission_name || "Unknown"} (${d.launch_year || "N/A"})`);

  function ticked() {
    svg.selectAll("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }
}
