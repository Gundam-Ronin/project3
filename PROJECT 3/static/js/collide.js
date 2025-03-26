// collide.js — Force Collide Chart using Canvas

function renderCollideChart(data) {
  const canvas = document.getElementById("bubble-canvas");
  const width = canvas.width;
  const height = canvas.height;
  const context = canvas.getContext("2d");
  const color = d3.scaleOrdinal(d3.schemeTableau10);

  const nodes = data.map(d => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.sqrt(d.payload_mass_kg || 1),
    group: d.agency || "Unknown"
  }));

  const simulation = d3.forceSimulation(nodes)
    .force("x", d3.forceX(width / 2).strength(0.01))
    .force("y", d3.forceY(height / 2).strength(0.01))
    .force("collide", d3.forceCollide().radius(d => d.r + 2).iterations(3))
    .on("tick", ticked);

  function ticked() {
    context.clearRect(0, 0, width, height);
    for (let d of nodes) {
      context.beginPath();
      context.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
      context.fillStyle = color(d.group);
      context.fill();
    }
  }

  canvas.addEventListener("pointermove", function (event) {
    const [x, y] = d3.pointer(event);
    nodes[0].fx = x;
    nodes[0].fy = y;
  });
}
