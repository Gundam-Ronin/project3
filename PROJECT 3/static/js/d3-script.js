
let allData = [];

function populateDropdowns(data) {
    const yearSet = new Set();
    const agencySet = new Set();

    data.forEach(d => {
        if (d.launch_year) yearSet.add(d.launch_year);
        if (d.agency) agencySet.add(d.agency);
    });

    const yearFilter = d3.select("#year-filter");
    const agencyFilter = d3.select("#agency-filter");

    yearSet.forEach(year => {
        yearFilter.append("option").attr("value", year).text(year);
    });

    agencySet.forEach(agency => {
        agencyFilter.append("option").attr("value", agency).text(agency);
    });
}

function applyFilters() {
    const selectedYear = d3.select("#year-filter").property("value");
    const selectedAgency = d3.select("#agency-filter").property("value");

    const filteredData = allData.filter(d =>
        (selectedYear === "All" || d.launch_year == selectedYear) &&
        (selectedAgency === "All" || d.agency === selectedAgency)
    );

    updateCharts(filteredData);
}

function updateCharts(data) {
    // Call your actual D3 chart update functions here (rocket, bubble, bar chart)
    drawRocketLaunch(data);
    drawBubbleChart(data);
    drawBarChart(data);
}

// Initial data load
d3.json("/api/launches").then(data => {
    allData = data;
    populateDropdowns(data);
    updateCharts(data);
});

d3.select("#apply-filters").on("click", applyFilters);
d3.select("#reset-filters").on("click", () => {
    d3.select("#agency-filter").property("value", "All");
    d3.select("#year-filter").property("value", "All");
    updateCharts(allData);
});

// Placeholder functions to avoid runtime errors — replace with your own
function drawRocketLaunch(data) { /* Your rocket animation logic */ }
function drawBubbleChart(data) { /* Your bubble chart logic */ }
function drawBarChart(data) { /* Your bar chart logic */ }
