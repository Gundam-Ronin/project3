async function renderAll() {
  const response = await fetch("/api/launches");
  const data = await response.json();

  renderCollideChart(data);
  renderBarChart(data);
  setupDropdowns(data);
}

function setupDropdowns(data) {
  const agencySet = new Set(data.map(d => d.agency).filter(Boolean));
  const yearSet = new Set(data.map(d => d.launch_year).filter(Boolean));

  const agencyFilter = document.getElementById("agency-filter");
  const yearFilter = document.getElementById("year-filter");

  agencySet.forEach(agency => {
    const option = document.createElement("option");
    option.value = agency;
    option.text = agency;
    agencyFilter.add(option);
  });

  yearSet.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.text = year;
    yearFilter.add(option);
  });

  document.getElementById("apply-filters").addEventListener("click", () => {
    const selectedAgency = agencyFilter.value;
    const selectedYear = yearFilter.value;

    const filtered = data.filter(d => {
      return (selectedAgency === "All" || d.agency === selectedAgency) &&
             (selectedYear === "All" || d.launch_year == selectedYear);
    });

    renderCollideChart(filtered);
    renderBarChart(filtered);
  });

  document.getElementById("reset-filters").addEventListener("click", () => {
    agencyFilter.value = "All";
    yearFilter.value = "All";
    renderCollideChart(data);
    renderBarChart(data);
  });
}

renderAll();
