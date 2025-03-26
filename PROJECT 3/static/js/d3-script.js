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

    agencySelect.selectAll("option:not(:first-child)").remove();
    yearSelect.selectAll("option:not(:first-child)").remove();

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

    return data.filter(d => {
      const agencyMatch = agency === "All" || d.agency === agency;
      const yearMatch = year === "All" || d.launch_year === parseInt(year);
      return agencyMatch && yearMatch;
    });
  }

  function resetFilters() {
    document.getElementById("agency-filter").value = "All";
    document.getElementById("year-filter").value = "All";
  }

  function renderAll(data) {
    renderRocketLaunch(data);
    renderCollideChart(data);
    renderTreeChart(data);
  }

  function renderRocketLaunch(data) {
    const svg = d3.select("#rocket-launch");
    svg.selectAll("*").remove();

    const rocket = svg.append("text")
      .attr("x", 10)
      .attr("y", 100)
      .attr("font-size", "32px")
      .text("🚀 Rocket Launch Ready");

    rocket.transition()
      .duration(2000)
      .attr("x", 700)
      .attr("y", 30)
      .text("🚀 Launched!");
  }

  function renderTreeChart(data) {
    d3.select("#tree-chart").selectAll("*").remove();

    const hierarchyData = d3.group(data, d => d.agency, d => d.launch_year);
    const root = d3.hierarchy({ values: Array.from(hierarchyData.entries()) }, d => d.values)
      .sum(d => Array.isArray(d) ? 0 : 1);

    const treeLayout = d3.tree().size([800, 400]);
    treeLayout(root);

    const svg = d3.select("#tree-chart");
    svg.selectAll("*").remove();

    svg.selectAll("line")
      .data(root.links())
      .enter()
      .append("line")
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .attr("stroke", "#ccc");

    svg.selectAll("circle")
      .data(root.descendants())
      .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 5)
      .attr("fill", "steelblue");

    svg.selectAll("text")
      .data(root.descendants())
      .enter()
      .append("text")
      .attr("x", d => d.x + 5)
      .attr("y", d => d.y - 5)
      .text(d => d.data[0] || "")
      .style("font-size", "10px");
  }
});
