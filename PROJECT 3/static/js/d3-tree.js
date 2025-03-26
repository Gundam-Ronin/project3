document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/launches")
    .then(response => response.json())
    .then(data => {
      setupDropdowns(data);
      renderCharts(data);

      document.getElementById("apply-filters").addEventListener("click", () => {
        const filtered = applyFilters(data);
        renderCharts(filtered);
      });

      document.getElementById("reset-filters").addEventListener("click", () => {
        resetFilters(data);
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
      .text(d => d)
      .attr("value", d => d);

    yearSelect.selectAll("option.year")
      .data(years)
      .enter()
      .append("option")
      .attr("class", "year")
      .text(d => d)
      .attr("value", d => d);
  }
});
