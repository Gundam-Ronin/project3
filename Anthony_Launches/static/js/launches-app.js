// Initial load and populate dropdown
function init() {
    d3.json("/api/launches").then(data => {
      const companies = [...new Set(data.map(d => d.company))];
      const dropdown = d3.select("#selCompany");  // ✅ was "#selDataset", match your HTML id
  
      companies.forEach(company => {
        dropdown.append("option").text(company).property("value", company);
      });
  
      const first = companies[0];
      buildBarChart(data, first);
      buildBubbleChart(data, first);
      buildPieChart(data, first);       // ✅ now included
      showMetadata(data, first);
    });
  }
  
  // Bar Chart: Launches per year
  function buildBarChart(data, selectedCompany) {
    const filtered = data.filter(d => d.company === selectedCompany);
  
    const yearCounts = d3.rollups(
      filtered,
      v => v.length,
      d => d.launch_year
    ).sort((a, b) => a[0] - b[0]);
  
    const years = yearCounts.map(d => d[0]);
    const counts = yearCounts.map(d => d[1]);
  
    Plotly.newPlot("bar", [{
      x: years,
      y: counts,
      type: "bar"
    }], {
      title: `Launches per Year for ${selectedCompany}`,
      xaxis: { title: "Year" },
      yaxis: { title: "Launch Count" }
    });
  }
  
  // Bubble Chart
  function buildBubbleChart(data, selectedCompany) {
    const filtered = data.filter(d => d.company === selectedCompany);
  
    Plotly.newPlot("bubble", [{
      x: filtered.map(d => d.launch_year),
      y: filtered.map((_, i) => i + 1),
      text: filtered.map(d => d.mission_status),
      mode: "markers",
      marker: {
        size: filtered.map((_, i) => 15),
        color: filtered.map(d => d.launch_year),
        colorscale: "Viridis"
      }
    }], {
      title: `Mission Status Bubble Chart for ${selectedCompany}`,
      xaxis: { title: "Launch Year" },
      yaxis: { title: "Launch Index" }
    });
  }
  
  // Pie Chart
  function buildPieChart(data, selectedCompany) {
    const filtered = data.filter(d => d.company === selectedCompany);
    const total = filtered.length;
    const success = filtered.filter(d => d.mission_status === "Success").length;
    const failure = total - success;
  
    Plotly.newPlot("pie", [{
      values: [success, failure],
      labels: ["Success", "Failure"],
      type: "pie",
      marker: { colors: ["#00cc96", "#ef553b"] },
      textinfo: "label+percent",
      hole: 0.3
    }], {
      title: `Mission Outcomes for ${selectedCompany}`,
      height: 400,
      width: 400
    });
  }
  
  // Metadata
  function showMetadata(data, selectedCompany) {
    const panel = d3.select("#metadata-panel");
    panel.html("");
  
    const filtered = data.filter(d => d.company === selectedCompany);
    const total = filtered.length;
    const success = filtered.filter(d => d.mission_status === "Success").length;
    const fail = total - success;
  
    panel.append("p").text(`Total Launches: ${total}`);
    panel.append("p").text(`Successes: ${success}`);
    panel.append("p").text(`Failures: ${fail}`);
  }
  
  // Dropdown update handler
  function optionChanged(newCompany) {
    d3.json("/api/launches").then(data => {
      buildBarChart(data, newCompany);
      buildBubbleChart(data, newCompany);
      buildPieChart(data, newCompany);    // ✅ now included
      showMetadata(data, newCompany);
    });
  }
  
  init();
  
