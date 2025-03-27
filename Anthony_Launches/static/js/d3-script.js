document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/launches")
    .then(response => response.json())
    .then(data => renderAll(data))
    .catch(error => console.error("Data load error:", error));
});

function renderAll(data) {
  const cleanData = data.filter(d =>
    d.launch_year !== null &&
    d.company !== null &&
    d.mission_status !== null
  );

  renderPlotlyBarChart(cleanData);
  renderPlotlyBubbleChart(cleanData);
  renderPlotlySankey(cleanData);
}

function renderPlotlyBarChart(data) {
  const grouped = d3.rollup(
    data,
    v => ({
      success: v.filter(d => d.mission_status.toLowerCase().includes("success")).length,
      failure: v.filter(d => !d.mission_status.toLowerCase().includes("success")).length
    }),
    d => +d.launch_year
  );

  const years = Array.from(grouped.keys()).sort();
  const success = years.map(y => grouped.get(y).success);
  const failure = years.map(y => grouped.get(y).failure);

  const trace1 = { x: years, y: success, name: 'Success', type: 'bar', marker: { color: '#4CAF50' } };
  const trace2 = { x: years, y: failure, name: 'Failure', type: 'bar', marker: { color: '#F44336' } };

  Plotly.newPlot("bar-chart", [trace1, trace2], {
    barmode: 'group',
    title: 'Launches by Year',
    xaxis: { title: 'Year' },
    yaxis: { title: 'Number of Launches' }
  });
}

function renderPlotlyBubbleChart(data) {
  const grouped = d3.rollup(
    data,
    v => ({
      count: v.length,
      successRate: v.filter(d => d.mission_status.toLowerCase().includes("success")).length / v.length
    }),
    d => d.company,
    d => +d.launch_year
  );

  const bubbles = [];
  Array.from(grouped.entries()).forEach(([company, years]) => {
    Array.from(years.entries()).forEach(([year, stat]) => {
      bubbles.push({
        x: year,
        y: company,
        text: `${company} (${year}) Success Rate: ${(stat.successRate * 100).toFixed(1)}%`,
        marker: {
          size: stat.count * 4,
          color: stat.successRate,
          colorscale: "Viridis",
          showscale: true
        }
      });
    });
  });

  Plotly.newPlot("bubble-chart", [{
    type: "scatter",
    mode: "markers",
    x: bubbles.map(b => b.x),
    y: bubbles.map(b => b.y),
    text: bubbles.map(b => b.text),
    marker: bubbles.map(b => b.marker)
  }], {
    title: "Launches by Company and Year",
    xaxis: { title: "Year" },
    yaxis: { title: "Company" }
  });
}

function renderPlotlySankey(data) {
  const companies = Array.from(new Set(data.map(d => d.company)));
  const statuses = Array.from(new Set(data.map(d => d.mission_status)));
  const labels = [...companies, ...statuses];
  const index = label => labels.indexOf(label);

  const linkMap = new Map();
  data.forEach(d => {
    const key = `${d.company}→${d.mission_status}`;
    linkMap.set(key, (linkMap.get(key) || 0) + 1);
  });

  const links = Array.from(linkMap.entries()).map(([k, v]) => {
    const [source, target] = k.split("→");
    return { source: index(source), target: index(target), value: v };
  });

  Plotly.newPlot("sankey-chart", [{
    type: "sankey",
    orientation: "h",
    node: {
      pad: 15,
      thickness: 20,
      line: { color: "black", width: 0.5 },
      label: labels
    },
    link: {
      source: links.map(l => l.source),
      target: links.map(l => l.target),
      value: links.map(l => l.value)
    }
  }], {
    title: "Company to Mission Outcome Flow"
  });
}