
document.addEventListener("DOMContentLoaded", () => {
    fetch("/api/launches")
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          console.error("Expected array but got:", data);
          return;
        }
        populateFilters(data);
        buildCharts(data);
      })
      .catch(err => console.error("Fetch failed", err));
  });
  
  function populateFilters(data) {
    const yearSelect = document.getElementById("yearSelect");
    const companySelect = document.getElementById("companySelect");
  
    const years = new Set();
    const companies = new Set();
  
    data.forEach(d => {
      if (d.launch_year) years.add(d.launch_year);
      if (d.agency) companies.add(d.agency);
    });
  
    [...years].sort().forEach(year => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });
  
    [...companies].sort().forEach(company => {
      const option = document.createElement("option");
      option.value = company;
      option.textContent = company;
      companySelect.appendChild(option);
    });
  
    yearSelect.addEventListener("change", () => filterAndPlot(data));
    companySelect.addEventListener("change", () => filterAndPlot(data));
  }
  
  function filterAndPlot(data) {
    const year = document.getElementById("yearSelect").value;
    const agency = document.getElementById("companySelect").value;
  
    const filtered = data.filter(d => {
      const matchYear = year === "All" || d.launch_year == year;
      const matchAgency = agency === "All" || d.agency === agency;
      return matchYear && matchAgency;
    });
  
    buildCharts(filtered);
  }
  
  function buildCharts(data) {
    const launchesPerYear = {};
    const agencyBubble = {};
    let success = 0, failure = 0;
  
    data.forEach(d => {
      const year = d.launch_year;
      const agency = d.agency;
  
      launchesPerYear[year] = (launchesPerYear[year] || 0) + 1;
      agencyBubble[agency] = (agencyBubble[agency] || 0) + 1;
      d.success ? success++ : failure++;
    });
  
    Plotly.newPlot("bar-chart", [{
      x: Object.keys(launchesPerYear),
      y: Object.values(launchesPerYear),
      type: "bar"
    }]);
  
    Plotly.newPlot("pie-chart", [{
      values: [success, failure],
      labels: ["Success", "Failure"],
      type: "pie"
    }]);
  
    Plotly.newPlot("bubble-chart", [{
      x: Object.keys(agencyBubble),
      y: Object.values(agencyBubble),
      mode: "markers",
      marker: {
        size: Object.values(agencyBubble).map(v => v * 10)
      },
      text: Object.keys(agencyBubble)
    }]);
  }
  
