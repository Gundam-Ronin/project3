function renderCollideChart(data) {
  const svg = d3.select("#bubble-chart");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  svg.selectAll("*").remove(); // Clear old content

  const radiusScale = d3.scaleSqrt()
    .domain([0, d3.max(data, d => +d.payload_mass_kg || 0)])
    .range([5, 40]);

  const simulation = d3.forceSimulation(data)
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("collide", d3.forceCollide(d => radiusScale(+d.payload_mass_kg || 0) + 2))
    .stop();

  for (let i = 0; i < 300; ++i) simulation.tick();

  svg.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => radiusScale(+d.payload_mass_kg || 0))
    .attr("fill", d => d.success === true ? "#4caf50" : "#f44336")
    .attr("stroke", "#333")
    .attr("stroke-width", 1)
    .append("title")
    .text(d => `${d.mission_name}\nPayload: ${d.payload_mass_kg} kg\nSuccess: ${d.success}`);
}
