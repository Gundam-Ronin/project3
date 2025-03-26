// static/js/d3-tree.js
function renderTreeChart(data) {
  d3.select("#tree-chart").selectAll("*").remove();

  const svg = d3.select("#tree-chart");
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  // Build hierarchy data structure
  const nested = d3.group(data, d => d.agency, d => d.rocket);
  const root = d3.hierarchy({ values: Array.from(nested.entries()) }, d => {
    if (Array.isArray(d[1])) {
      return d[1];
    } else {
      return d[1] instanceof Map ? Array.from(d[1].entries()) : [];
    }
  });

  const treeLayout = d3.tree().size([height, width - 160]);
  treeLayout(root);

  const g = svg.append("g").attr("transform", "translate(80,0)");

  g.selectAll(".link")
    .data(root.links())
    .enter().append("line")
    .attr("class", "link")
    .attr("x1", d => d.source.y)
    .attr("y1", d => d.source.x)
    .attr("x2", d => d.target.y)
    .attr("y2", d => d.target.x)
    .attr("stroke", "#ccc");

  const node = g.selectAll(".node")
    .data(root.descendants())
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.y},${d.x})`);

  node.append("circle")
    .attr("r", 4)
    .attr("fill", "#333");

  node.append("text")
    .attr("dy", 3)
    .attr("x", d => d.children ? -8 : 8)
    .style("text-anchor", d => d.children ? "end" : "start")
    .text(d => d.data[0]);
}
