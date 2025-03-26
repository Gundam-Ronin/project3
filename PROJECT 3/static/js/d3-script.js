document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/launches")
    .then(response => response.json())
    .then(data => {
      renderAll(data);
    })
    .catch(error => console.error("Data load error:", error));
});

function renderAll(data) {
  renderCollideChart(data);  // Bubble chart (from collide.js)
  renderBarChart(data);      // Now defined below
}

// 📊 Bar Chart: Launches per Year
function renderBarChart(data) {
  const svg = d3.select("#bar-chart");
  svg.selectAll("*").remove();

  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };

  // Count launches per year
  const launchesByYear = d3.rollup(
    data,
    v => v.length,
    d => d.launch_year
  );

  const years = Array.from(launchesByYear.keys()).sort();
  const counts = years.map(year => launchesByYear.get(year));

  const x = d3.scaleBand()
    .domain(years)
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(counts)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg.append("g")
    .selectAll("rect")
    .data(years)
    .enter()
    .append("rect")
    .attr("x", d => x(d))
    .attr("y", d => y(launchesByYear.get(d)))
    .attr("height", d => y(0) - y(launchesByYear.get(d)))
    .attr("width", x.bandwidth())
    .attr("fill", "#4CAF50");

  // X Axis
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x));

  // Y Axis
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));
}
