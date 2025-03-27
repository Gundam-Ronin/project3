function renderBarChart(data) {
  console.log("data =", data);  // 🐞 Debug: confirm data loaded for bar chart

  const svg = d3.select("#bar-chart");
  svg.selectAll("*").remove();

  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = { top: 30, right: 40, bottom: 40, left: 60 };

  // Group by year and outcome (success/failure)
  const launchesByYearOutcome = d3.rollup(
    data,
    v => ({
      success: v.filter(d => d.success === true).length,
      failure: v.filter(d => d.success === false).length
    }),
    d => +d.launch_year
  );

  const years = Array.from(launchesByYearOutcome.keys()).sort((a, b) => a - b);
  const successCounts = years.map(y => launchesByYearOutcome.get(y).success);
  const failureCounts = years.map(y => launchesByYearOutcome.get(y).failure);

  const x = d3.scaleBand()
    .domain(years)
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(successCounts.map((s, i) => s + failureCounts[i]))])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // Success bars
  svg.selectAll(".bar-success")
    .data(years)
    .enter()
    .append("rect")
    .attr("x", d => x(d))
    .attr("y", d => y(launchesByYearOutcome.get(d).success))
    .attr("height", d => y(0) - y(launchesByYearOutcome.get(d).success))
    .attr("width", x.bandwidth() / 2)
    .attr("fill", "#4CAF50");

  // Failure bars
  svg.selectAll(".bar-failure")
    .data(years)
    .enter()
    .append("rect")
    .attr("x", d => x(d) + x.bandwidth() / 2)
    .attr("y", d => y(launchesByYearOutcome.get(d).failure))
    .attr("height", d => y(0) - y(launchesByYearOutcome.get(d).failure))
    .attr("width", x.bandwidth() / 2)
    .attr("fill", "#F44336");

  // Axes
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

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
