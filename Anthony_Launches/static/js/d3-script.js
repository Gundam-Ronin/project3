let launchData = [];

function buildMetadata(company) {
  const launches = launchData.filter(d => d.company === company);
  const total = launches.length;
  const successes = launches.filter(d => d.mission_status.toLowerCase().includes("success")).length;
  const failures = total - successes;
  const years = launches.map(d => d.launch_year);
  const mostRecent = Math.max(...years);

  const panel = d3.select("#metadata-panel");
  panel.html("");
  panel.append("p").text(`Total Launches: ${total}`);
  panel.append("p").text(`Successful Launches: ${successes}`);
  panel.append("p").text(`Failed Launches: ${failures}`);
  panel.append("p").text(`Most Recent Year: ${mostRecent}`);
}

function buildBarChart(company) {
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
}

function buildBubbleChart(company) {
  const launches = launchData.filter(d => d.company === company);

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

function buildPieChart(company) {
  const launches = launchData.filter(d => d.company === company);
  const success = launches.filter(d => d.mission_status.toLowerCase().includes("success")).length;
  const fail = launches.length - success;

  const pieTrace = {
    labels: ["Success", "Failure"],
    values: [success, fail],
    type: "pie"
  };

  Plotly.newPlot("pie", [pieTrace], {
    title: `Mission Outcome for ${company}`
  });
}

function optionChanged(company) {
  buildMetadata(company);
  buildBarChart(company);
  buildBubbleChart(company);
  buildPieChart(company); // ✅ step 5 pie
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
    buildBarChart(first);
    buildBubbleChart(first);
    buildPieChart(first);
  });
}

init();
