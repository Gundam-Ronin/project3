// collide.js
function renderCollideChart(data) {
  const svg = d3.select("#bubble-chart");
  svg.selectAll("*").remove();

  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const radiusScale = d3.scaleSqrt()
    .domain([0, d3.max(data, d => d.payload_mass_kg || 1)])
    .range([5, 40]);

  const colorScale = d3.scaleOrdinal()
    .domain([true, false])
    .range(["green", "red"]);

  const simulation = d3.forceSimulation(data)
    .force("charge", d3.forceManyBody().strength(2))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide(d => radiusScale(d.payload_mass_kg || 1)))
    .on("tick", ticked);

  const nodes = svg.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("r", d => radiusScale(d.payload_mass_kg || 1))
    .attr("fill", d => colorScale(d.success))
    .attr("stroke", "black")
    .attr("stroke-width", 1.5)
    .append("title")
    .text(d => d.mission_name || "Unknown Mission");

  function ticked() {
    svg.selectAll("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }
}
