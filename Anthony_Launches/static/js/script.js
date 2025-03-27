document.addEventListener("DOMContentLoaded", function () {
  const companySelect = document.getElementById("companySelect");
  const yearSelect = document.getElementById("yearSelect");

  fetch("/api/launches")
    .then((res) => res.json())
    .then((data) => {
      populateFilters(data);
      plotCharts(data);
    });

  function populateFilters(data) {
    const companies = new Set();
    const years = new Set();

    data.forEach((launch) => {
      if (launch.agency) companies.add(launch.agency);
      if (launch.launch_year) years.add(launch.launch_year);
    });

    [...companies].sort().forEach((company) => {
      const opt = document.createElement("option");
      opt.value = company;
      opt.textContent = company;
      companySelect.appendChild(opt);
    });

    [...years].sort().forEach((year) => {
      const opt = document.createElement("option");
      opt.value = year;
      opt.textContent = year;
      yearSelect.appendChild(opt);
    });
  }

  function plotCharts(data) {
    let filtered = data;

    function updateCharts() {
      const selectedCompany = companySelect.value;
      const selectedYear = yearSelect.value;

      filtered = data.filter((launch) => {
        const matchCompany =
          selectedCompany === "All" || launch.agency === selectedCompany;
        const matchYear =
          selectedYear === "All" || launch.launch_year == selectedYear;
        return matchCompany && matchYear;
      });

      renderBarChart(filtered);
      renderPieChart(filtered);
      renderBubbleChart(filtered);
    }

    companySelect.addEventListener("change", updateCharts);
    yearSelect.addEventListener("change", updateCharts);

    updateCharts(); // initial render
  }

  function renderBarChart(data) {
    const yearCounts = {};
    data.forEach((d) => {
      if (d.launch_year) {
        yearCounts[d.launch_year] = (yearCounts[d.launch_year] || 0) + 1;
      }
    });

    const years = Object.keys(yearCounts).sort();
    const counts = years.map((y) => yearCounts[y]);

    const trace = {
      x: years,
      y: counts,
      type: "bar",
      marker: { color: "steelblue" },
    };

    Plotly.newPlot("bar-chart", [trace], {
      margin: { t: 30 },
      xaxis: { title: "Launch Year" },
      yaxis: { title: "# of Launches" },
    });
  }

  function renderPieChart(data) {
    const successCount = data.filter((d) => d.success === true).length;
    const failCount = data.filter((d) => d.success === false).length;

    const trace = {
      labels: ["Success", "Failure"],
      values: [successCount, failCount],
      type: "pie",
      marker: {
        colors: ["green", "red"],
      },
    };

    Plotly.newPlot("pie-chart", [trace], {
      margin: { t: 30 },
    });
  }

  function renderBubbleChart(data) {
    const agencyCounts = {};

    data.forEach((d) => {
      if (d.agency) {
        agencyCounts[d.agency] = (agencyCounts[d.agency] || 0) + 1;
      }
    });

    const agencies = Object.keys(agencyCounts);
    const counts = agencies.map((agency) => agencyCounts[agency]);

    const trace = {
      x: agencies,
      y: counts,
      text: agencies,
      mode: "markers",
      marker: {
        size: counts.map((count) => count * 3),
        sizemode: "area",
      },
    };

    Plotly.newPlot("bubble-chart", [trace], {
      margin: { t: 30 },
      xaxis: { title: "Agency" },
      yaxis: { title: "Launches" },
    });
  }
});
