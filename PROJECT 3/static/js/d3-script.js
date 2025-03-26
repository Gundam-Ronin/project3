function applyFilters(data) {
  const agency = document.getElementById("agency-filter").value;
  const year = document.getElementById("year-filter").value;

  return data.filter(d => {
    const matchAgency = agency === "All" || d.agency === agency;
    const matchYear = year === "All" || String(d.launch_year) === String(year);
    return matchAgency && matchYear;
  });
}

function resetFilters(data) {
  document.getElementById("agency-filter").value = "All";
  document.getElementById("year-filter").value = "All";
  renderCharts(data);
}

function renderAll(data) {
  renderCollideChart(data);
}

function renderCharts(data) {
  try {
    renderAll(data);
    renderBarChart(data);
  } catch (err) {
    console.error("Error in renderCharts:", err);
  }
}

function renderBarChart(data) {
  const svg = d3.select("#bar-chart");
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  svg.selectAll("*").remove();

  const yearCounts = d3.rollup(
    data,
    v => v.length,
    d => d.launch_year
  );

  const x = d3.scaleBand()
    .domain(Array.from(yearCounts.keys()))
    .range([40, width - 20])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(yearCounts.values())])
    .range([height - 40, 20]);

  svg.append("g")
    .selectAll("rect")
    .data(Array.from(yearCounts.entries()))
    .enter()
    .append("rect")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => height - 40 - y(d[1]))
    .attr("fill", "#1976d2");

  svg.append("g")
    .attr("transform", `translate(0,${height - 40})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("transform", `translate(40,0)`)
    .call(d3.axisLeft(y));
}
