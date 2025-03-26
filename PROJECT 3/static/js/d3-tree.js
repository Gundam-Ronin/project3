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
  
    function resetFilters(data) {
      document.getElementById("agency-filter").value = "All";
      document.getElementById("year-filter").value = "All";
      renderCharts(data);
    }
  
    function renderCharts(data) {
      renderBarChart(data);
      renderBubbleChart(data);
      renderRocketLaunch(data);
    }
  
    function renderBarChart(data) {
      d3.select("#bar-chart").selectAll("*").remove();
      const svg = d3.select("#bar-chart");
      const width = +svg.attr("width");
      const height = +svg.attr("height");
  
      const yearCounts = d3.rollup(data, v => v.length, d => d.launch_year);
      const sorted = Array.from(yearCounts.entries()).sort((a, b) => a[0] - b[0]);
  
      const x = d3.scaleBand()
        .domain(sorted.map(d => d[0]))
        .range([50, width - 20])
        .padding(0.2);
  
      const y = d3.scaleLinear()
        .domain([0, d3.max(sorted, d => d[1])])
        .range([height - 30, 20]);
  
      svg.append("g")
        .attr("transform", `translate(0, ${height - 30})`)
        .call(d3.axisBottom(x).tickFormat(d => d));
  
      svg.append("g")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(y));
  
      svg.selectAll(".bar")
        .data(sorted)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - 30 - y(d[1]))
        .attr("fill", "steelblue");
    }
  
    function renderBubbleChart(data) {
      d3.select("#bubble-chart").selectAll("*").remove();
      const svg = d3.select("#bubble-chart");
      const width = +svg.attr("width");
      const height = +svg.attr("height");
  
      const radius = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.payload_mass_kg || 1)])
        .range([5, 40]);
  
      const simulation = d3.forceSimulation(data)
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("charge", d3.forceManyBody().strength(5))
        .force("collision", d3.forceCollide().radius(d => radius(d.payload_mass_kg || 1) + 2))
        .on("tick", ticked);
  
      const color = d3.scaleOrdinal()
        .domain(["True", "False"])
        .range(["green", "red"]);
  
      const circles = svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", d => radius(d.payload_mass_kg || 1))
        .attr("fill", d => color(String(d.success)));
  
      function ticked() {
        circles
          .attr("cx", d => d.x = Math.max(radius(d.payload_mass_kg || 1), Math.min(width - radius(d.payload_mass_kg || 1), d.x)))
          .attr("cy", d => d.y = Math.max(radius(d.payload_mass_kg || 1), Math.min(height - radius(d.payload_mass_kg || 1), d.y)));
      }
    }
  
    function renderRocketLaunch(data) {
      d3.select("#rocket-launch").selectAll("*").remove();
      const svg = d3.select("#rocket-launch");
      const width = +svg.attr("width");
      const height = +svg.attr("height");
  
      const rocket = svg.append("rect")
        .attr("x", width / 2 - 10)
        .attr("y", height - 40)
        .attr("width", 20)
        .attr("height", 40)
        .attr("fill", "gray");
  
      rocket.transition()
        .duration(4000)
        .attr("y", 0)
        .on("end", () => rocket.remove());
    }
  });
  
