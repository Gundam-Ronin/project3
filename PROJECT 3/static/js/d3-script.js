function renderBarChart(data) {
  console.log("📊 Bar chart data =", data);

  const svg = d3.select("#bar-chart");
  svg.selectAll("*").remove();

  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = { top: 40, right: 30, bottom: 40, left: 60 };

  // Transform mission_status → success boolean
  data.forEach(d => {
    d.success = d.mission_status && d.mission_status.toLowerCase().includes("success");
  });

  // Group by year and outcome
  const launchesByYear = d3.rollup(
    data,
    v => ({
      success: v.filter(d => d.success).length,
      failure: v.filter(d => !d.success).length
    }),
    d => +d.launch_year
  );

  const years = Array.from(launchesByYear.keys()).sort((a, b) => a - b);
  const successCounts = years.map(y => launchesByYear.get(y).success);
  const failureCounts = years.map(y => launchesByYear.get(y).failure);

  const x = d3.scaleBand()
    .domain(years)
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(successCounts.map((s, i) => s + failureCounts[i]))])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Draw Success bars
  svg.selectAll(".bar-success")
    .data(years)
    .enter()
    .append("rect")
    .attr("x", d => x(d))
    .attr("y", d => y(launchesByYear.get(d).success))
    .attr("height", d => y(0) - y(launchesByYear.get(d).success))
    .attr("width", x.bandwidth() / 2)
    .attr("fill", "#4CAF50");

  // Draw Failure bars
  svg.selectAll(".bar-failure")
    .data(years)
    .enter()
    .append("rect")
    .attr("x", d => x(d) + x.bandwidth() / 2)
    .attr("y", d => y(launchesByYear.get(d).failure))
    .attr("height", d => y(0) - y(launchesByYear.get(d).failure))
    .attr("width", x.bandwidth() / 2)
    .attr("fill", "#F44336");

  // X Axis
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  // Y Axis
  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // Legend
  const legend = svg.append("g").attr("transform", `translate(${width - 150}, ${margin.top})`);
  legend.append("rect").attr("width", 15).attr("height", 15).attr("fill", "#4CAF50");
  legend.append("text").text("Success").attr("x", 20).attr("y", 12);
  legend.append("rect").attr("width", 15).attr("height", 15).attr("y", 20).attr("fill", "#F44336");
  legend.append("text").text("Failure").attr("x", 20).attr("y", 32);
}
