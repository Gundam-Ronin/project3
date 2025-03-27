// Initial load and populate dropdown
function init() {
    d3.json("/api/launches").then(data => {
      const companies = [...new Set(data.map(d => d.company))];
      const dropdown = d3.select("#selDataset");
  
      companies.forEach(company => {
        dropdown.append("option").text(company).property("value", company);
      });
  
      const first = companies[0];
      buildBarChart(data, first);
      buildBubbleChart(data, first);
      showMetadata(data, first);
    });
  }
  
  // Bar Chart: Launches per year for selected company
  function buildBarChart(data, selectedCompany) {
    const filtered = data.filter(d => d.company === selectedCompany);
  
    const yearCounts = d3.rollups(
      filtered,
      v => v.length,
      d => d.launch_year
    ).sort((a, b) => a[0] - b[0]);
  
    const years = yearCounts.map(d => d[0]);
    const counts = yearCounts.map(d => d[1]);
  
    const trace = {
      x: years,
      y: counts,
      type: "bar"
    };
  
    const layout = {
      title: `Launches per Year for ${selectedCompany}`,
      xaxis: { title: "Year" },
      yaxis: { title: "Launch Count" }
    };
  
    Plotly.newPlot("bar", [trace], layout);
  }
  
  // Bubble Chart: Shows each launch
  function buildBubbleChart(data, selectedCompany) {
    const filtered = data.filter(d => d.company === selectedCompany);
  
    const trace = {
      x: filtered.map(d => d.launch_year),
      y: filtered.map((_, i) => i + 1), // Position on y-axis
      text: filtered.map(d => d.mission_status),
      mode: "markers",
      marker: {
        size: filtered.map((_, i) => 15),
        color: filtered.map(d => d.launch_year),
        colorscale: "Viridis"
      }
    };
  
    const layout = {
      title: `Mission Status Bubble Chart for ${selectedCompany}`,
      xaxis: { title: "Launch Year" },
      yaxis: { title: "Launch Index" }
    };
  
    Plotly.newPlot("bubble", [trace], layout);

  }
  
// Pie Chart: Success vs Failure
function buildPieChart(data, selectedCompany) {
  const filtered = data.filter(d => d.company === selectedCompany);
  const total = filtered.length;
  const success = filtered.filter(d => d.mission_status === "Success").length;
  const failure = total - success;

  const trace = {
    values: [success, failure],
    labels: ["Success", "Failure"],
    type: "pie",
    marker: {
      colors: ["#00cc96", "#ef553b"]
    },
    textinfo: "label+percent",
    hole: 0.3
  };

  const layout = {
    title: `Mission Outcomes for ${selectedCompany}`,
    height: 400,
    width: 400
  };

  Plotly.newPlot("pie", [trace], layout);
}



  // Metadata panel
  function showMetadata(data, selectedCompany) {
    const panel = d3.select("#sample-metadata");
    panel.html("");
  
    const filtered = data.filter(d => d.company === selectedCompany);
    const total = filtered.length;
    const success = filtered.filter(d => d.mission_status === "Success").length;
    const fail = total - success;
  
    panel.append("p").text(`Total Launches: ${total}`);
    panel.append("p").text(`Successes: ${success}`);
    panel.append("p").text(`Failures: ${fail}`);
  }
  
  // When dropdown changes
  function optionChanged(newCompany) {
    d3.json("/api/launches").then(data => {
      buildBarChart(data, newCompany);
      buildBubbleChart(data, newCompany);
      showMetadata(data, newCompany);
    });
  }
  
  init();
  