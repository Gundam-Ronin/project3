document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/launches")
    .then(response => response.json())
    .then(data => {
      setupDropdowns(data);
      renderAll(data);

      document.getElementById("apply-filters").addEventListener("click", () => {
        const filtered = applyFilters(data);
        renderAll(filtered);
      });

      document.getElementById("reset-filters").addEventListener("click", () => {
        resetFilters();
        renderAll(data);
      });
    });

  function setupDropdowns(data) {
    const agencySelect = d3.select("#agency-filter");
    const yearSelect = d3.select("#year-filter");

    const agencies = Array.from(new Set(data.map(d => d.agency))).sort();
    const years = Array.from(new Set(data.map(d => d.launch_year))).sort((a, b) => a - b);

    agencySelect.selectAll("option.agency").remove();
    yearSelect.selectAll("option.year").remove();

    agencySelect.selectAll("option.agency")
      .data(agencies)
      .enter()
      .append("option")
      .attr("class", "agency")
      .attr("value", d => d)
      .text(d => d);

    yearSelect.selectAll("option.year")
      .data(years)
      .enter()
      .append("option")
      .attr("class", "year")
      .attr("value", d => d)
      .text(d => d);
  }

  function applyFilters(data) {
    const agency = document.getElementById("agency-filter").value;
    const year = document.getElementById("year-filter").value;
    return data.filter(d =>
      (agency === "All" || d.agency === agency) &&
      (year === "All" || d.launch_year === parseInt(year))
    );
  }

  function resetFilters() {
    document.getElementById("agency-filter").value = "All";
    document.getElementById("year-filter").value = "All";
  }

  function renderAll(data) {
    renderRocketLaunch(data);
    renderBubbleChart(data);
    renderTreeChart(data);
  }

  function renderRocketLaunch(data) {
    const svg = d3.select("#rocket-launch");
    svg.selectAll("*").remove();

    const rocket = svg.append("text")
      .attr("x", 10)
      .attr("y", 60)
      .attr("font-size", "28px")
      .text("🚀 Preparing Launch...");

    rocket.transition()
      .duration(3000)
      .attr("x", 700)
      .text("🚀 Liftoff!");
  }

  function renderBubbleChart(data) {
    const svg = d3.select("#bubble-chart");
    svg.selectAll("*").remove();
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const radius = d3.scaleSqrt()
      .domain([0, d3.max(data, d => d.payload_mass_kg || 1)])
      .range([5, 40]);

    const color = d3.scaleOrdinal()
      .domain(["True", "False"])
      .range(["green", "red"]);

    const simulation = d3.forceSimulation(data)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => radius(d.payload_mass_kg || 1) + 2))
      .on("tick", ticked);

    const nodes = svg.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("r", d => radius(d.payload_mass_kg || 1))
      .attr("fill", d => color(String(d.success)));

    function ticked() {
      nodes
        .attr("cx", d => d.x = Math.max(radius(d.payload_mass_kg || 1), Math.min(width - radius(d.payload_mass_kg || 1), d.x)))
        .attr("cy", d => d.y = Math.max(radius(d.payload_mass_kg || 1), Math.min(height - radius(d.payload_mass_kg || 1), d.y)));
    }
  }

  function renderTreeChart(data) {
    const svg = d3.select("#tree-chart");
    svg.selectAll("*").remove();
    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const hierarchyData = d3.group(data, d => d.agency, d => d.launch_year);
    const root = d3.hierarchy({ values: Array.from(hierarchyData.entries()) }, d => d.values)
      .sum(d => Array.isArray(d) ? 0 : 1);

    const treeLayout = d3.tree().size([width, height - 40]);
    treeLayout(root);

    svg.selectAll("line")
      .data(root.links())
      .enter()
      .append("line")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .attr("stroke", "#aaa");

    svg.selectAll("circle")
      .data(root.descendants())
      .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 4)
      .attr("fill", "#69b3a2");

    svg.selectAll("text")
      .data(root.descendants())
      .enter()
      .append("text")
      .attr("x", d => d.x + 6)
      .attr("y", d => d.y)
      .text(d => d.data[0] || "")
      .style("font-size", "10px");
  }
});
