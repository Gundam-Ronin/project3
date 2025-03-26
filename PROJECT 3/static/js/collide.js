// Purpose: Applies collision force and updates rocket positions
// (Optional file to modularize physics behavior in your D3 force sim)

function applyCollisionForce(simulation, radiusAccessor) {
  simulation.force("collision", d3.forceCollide().radius(radiusAccessor));
}

function updateRocketPositions(svg, data) {
  const color = d => d.success ? "#4CAF50" : "#F44336";

  const rockets = svg.selectAll("circle")
    .data(data, d => d.source_id || d.mission_name);

  rockets.enter()
    .append("circle")
    .attr("r", d => d.success ? 10 : 5)
    .attr("fill", color)
    .merge(rockets)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y);

  rockets.exit().remove();
}
