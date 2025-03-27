let launchData = [];

function buildMetadata(company) {
  const launches = launchData.filter(d => d.company === company);
  const total = launches.length;
  const successes = launches.filter(d => d.mission_status.toLowerCase().includes("success")).length;
  const years = launches.map(d => d.launch_year);
  const mostRecent = Math.max(...years);

  const panel = d3.select("#metadata-panel");
  panel.html("");
  panel.append("p").text(`Total Launches: ${total}`);
  panel.append("p").text(`Successful Launches: ${successes}`);
  panel.append("p").text(`Most Recent Year: ${mostRecent}`);
}

function buildCharts(company) {
  const launches = launchData.filter(d => d.company === company);

  const countsByYear = d3.rollup(
    launches,
    v => v.length,
    d => d.launch_year
  );

  const years = Array.from(countsByYear.keys()).sort();
  const values = years.map(year => countsByYear.get(year));

  const barTrace = {
    x: values,
    y: years.map(y => `Year ${y}`),
    type: "bar",
    orientation: "h"
  };

  Plotly.newPlot("bar", [barTrace], {
    title: `Launches Per Year (${company})`,
    margin: { t: 40, l: 80 }
  });

  const bubbleTrace = {
    x: launches.map(d => d.launch_year),
    y: launches.map((_, i) => i + 1),
    text: launches.map(d => d.mission_status),
    mode: "markers",
    marker: {
      size: launches.map((_, i) => i + 1),
      color: launches.map(d => d.launch_year),
      colorscale: "Viridis"
    }
  };

  Plotly.newPlot("bubble", [bubbleTrace], {
    title: "Launch Activity",
    xaxis: { title: "Launch Year" },
    yaxis: { title: "Count Index" }
  });
}

function init() {
  d3.json("/api/launches").then(data => {
    const companies = [...new Set(data.map(d => d.company))];
    const dropdown = d3.select("#selCompany");

    companies.forEach(company => {
      dropdown.append("option").text(company).property("value", company);
    });

    const first = companies[0];
    buildBarChart(data, first);
    buildBubbleChart(data, first);
    buildPieChart(data, first);   // ✅ new
    showMetadata(data, first);
  });
}

function optionChanged(company) {
  d3.json("/api/launches").then(data => {
    buildBarChart(data, company);
    buildBubbleChart(data, company);
    buildPieChart(data, company);   // ✅ new
    showMetadata(data, company);
  });
}

function optionChanged(company) {
  buildMetadata(company);
  buildCharts(company);
}

function init() {
  d3.json("/api/launches").then(data => {
    launchData = data;

    const dropdown = d3.select("#selCompany");
    const companies = Array.from(new Set(data.map(d => d.company))).sort();

    companies.forEach(c => {
      dropdown.append("option").text(c).property("value", c);
    });

    const first = companies[0];
    buildMetadata(first);
    buildCharts(first);
  });
}

init();
