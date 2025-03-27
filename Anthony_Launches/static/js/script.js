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
    if (d.company) companies.add(d.company);
  });

  // Populate year filter
  [...years].sort().forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  });

  // Populate company filter
  [...companies].sort().forEach(company => {
    const option = document.createElement("option");
    option.value = company;
    option.textContent = company;
    companySelect.appendChild(option);
  });

  // Add event listeners for filters
  yearSelect.addEventListener("change", () => filterAndPlot(data));
  companySelect.addEventListener("change", () => filterAndPlot(data));
}

function filterAndPlot(data) {
  const year = document.getElementById("yearSelect").value;
  const company = document.getElementById("companySelect").value;

  const filtered = data.filter(d => {
    const matchYear = year === "All" || d.launch_year == year;
    const matchCompany = company === "All" || d.company === company;
    return matchYear && matchCompany;
  });

  buildCharts(filtered);
}

function buildCharts(data) {
  const launchesPerYear = {};
  const companyBubble = {};
  let success = 0, failure = 0;

  data.forEach(d => {
    const year = d.launch_year;
    const company = d.company;

    launchesPerYear[year] = (launchesPerYear[year] || 0) + 1;
    companyBubble[company] = (companyBubble[company] || 0) + 1;

    // Check the value of mission_status instead of d.success
    if (d.mission_status && d.mission_status.toLowerCase() === "success") {
      success++;
    } else {
      failure++;
    }
  });

  // Plot the bar chart for Launches Per Year
  Plotly.newPlot("bar-chart", [{
    x: Object.keys(launchesPerYear),
    y: Object.values(launchesPerYear),
    type: "bar"
  }], {
    width: 1000, // Set larger width
    height: 700 // Set larger height
  });

  // Plot the pie chart for Success vs Failure
  Plotly.newPlot("pie-chart", [{
    values: [success, failure],
    labels: ["Success", "Failure"],
    type: "pie"
  }], {
    width: 1000, // Set larger width
    height: 700 // Set larger height
  });

  // Plot the bubble chart for Launch Density by Location
  const locationBubble = {};

  data.forEach(d => {
    const location = d.location;
    if (location) {
      locationBubble[location] = (locationBubble[location] || 0) + 1;
    }
  });

  Plotly.newPlot("bubble-chart", [{
    x: Object.keys(locationBubble),
    y: Object.values(locationBubble),
    mode: "markers",
    marker: {
      size: Object.values(locationBubble).map(v => v * 10)
    },
    text: Object.keys(locationBubble)
  }], {
    width: 1000, // Set larger width
    height: 900 // Set larger height
  });
}
