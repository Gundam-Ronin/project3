document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/launches")
    .then(res => res.json())
    .then(data => {
      setupDropdowns(data);
      renderAll(data);

      document.getElementById("apply-filters").addEventListener("click", () => {
        const filtered = applyFilters(data);
        renderAll(filtered);
      });

      document.getElementById("reset-filters").addEventListener("click", () => {
        resetFilters(data);
      });
    });

  function setupDropdowns(data) {
    const agencySet = new Set(data.map(d => d.agency).filter(Boolean));
    const yearSet = new Set(data.map(d => d.launch_year).filter(Boolean));

    const agencySelect = d3.select("#agency-filter");
    const yearSelect = d3.select("#year-filter");

    agencySet.forEach(d => {
      agencySelect.append("option").attr("value", d).text(d);
    });
    Array.from(yearSet).sort().forEach(d => {
      yearSelect.append("option").attr("value", d).text(d);
    });
  }

  function applyFilters(data) {
    const agency = document.getElementById("agency-filter").value;
    const year = document.getElementById("year-filter").value;
    return data.filter(d =>
      (agency === "All" || d.agency === agency) &&
      (year === "All" || +d.launch_year === +year)
    );
  }

  function resetFilters(data) {
    document.getElementById("agency-filter").value = "All";
    document.getElementById("year-filter").value = "All";
    renderAll(data);
  }

  function renderAll(data) {
    renderRocketLaunch(data);
    renderBubbleChart(data);
    renderTreeChart(data);
  }

  function renderRocketLaunch(data) {
    const svg = d3.select("#rocket-launch");
    svg.selectAll("*").remove();

    svg.append("text")
      .attr("x", 20)
      .attr("y", 100)
      .text("🚀 " + data.length + " launches loaded")
      .attr("font-size", 24);
  }

  function renderBubbleChart(data) {
    const svg = d3.select("#bubble-chart");
    svg.selectAll("*").remove();

    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const simulation = d3.forceSimulation(data)
      .force("x", d3.forceX(width / 2).strength(0.05))
      .force("y", d3.forceY(height / 2).strength(0.05))
      .force("collide", d3.forceCollide(d => +d.payload_mass_kg / 1000 + 5 || 10))
      .stop();

    for (let i = 0; i < 120; i++) simulation.tick();

    svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => +d.payload_mass_kg / 1000 + 5 || 10)
      .attr("fill", d => d.success ? "green" : "red")
      .append("title")
      .text(d => d.mission_name + ": " + d.payload_mass_kg + "kg");
  }

  function renderTreeChart(data) {
    const svg = d3.select("#tree-chart");
    svg.selectAll("*").remove();

    const hierarchy = d3.group(data, d => d.agency);
    const root = {
      name: "Launches",
      children: Array.from(hierarchy, ([key, value]) => ({
        name: key,
        children: value.map(d => ({ name: d.mission_name || "Unnamed Mission" }))
      }))
    };

    const treeLayout = d3.tree().size([400, 700]);
    const rootNode = d3.hierarchy(root);
    treeLayout(rootNode);

    const g = svg.append("g").attr("transform", "translate(50,50)");

    g.selectAll("line")
      .data(rootNode.links())
      .enter()
      .append("line")
      .attr("x1", d => d.source.y)
      .attr("y1", d => d.source.x)
      .attr("x2", d => d.target.y)
      .attr("y2", d => d.target.x)
      .attr("stroke", "#999");

    g.selectAll("circle")
      .data(rootNode.descendants())
      .enter()
      .append("circle")
      .attr("cx", d => d.y)
      .attr("cy", d => d.x)
      .attr("r", 5)
      .attr("fill", "#4682b4");

    g.selectAll("text")
      .data(rootNode.descendants())
      .enter()
      .append("text")
      .attr("x", d => d.y + 8)
      .attr("y", d => d.x + 4)
      .text(d => d.data.name)
      .attr("font-size", 12);
  }
});
