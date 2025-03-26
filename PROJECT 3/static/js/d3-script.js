let launchData = [];

// Populate filters dynamically
function populateFilters(data) {
    const agencySet = new Set(data.map(d => d.agency));
    const yearSet = new Set(data.map(d => d.launch_year));

    const agencySelect = d3.select("#agency-filter");
    const yearSelect = d3.select("#year-filter");

    agencySet.forEach(agency => {
        if (agency) {
            agencySelect.append("option").text(agency).attr("value", agency);
        }
    });

    yearSet.forEach(year => {
        if (year) {
            yearSelect.append("option").text(year).attr("value", year);
        }
    });
}

// Apply filters
function applyFilters() {
    const selectedAgency = d3.select("#agency-filter").property("value");
    const selectedYear = d3.select("#year-filter").property("value");

    let filtered = launchData;
    if (selectedAgency !== "All") {
        filtered = filtered.filter(d => d.agency === selectedAgency);
    }
    if (selectedYear !== "All") {
        filtered = filtered.filter(d => d.launch_year == selectedYear);
    }

    drawBubbleChart(filtered);
}

// Reset filters
function resetFilters() {
    d3.select("#agency-filter").property("value", "All");
    d3.select("#year-filter").property("value", "All");
    drawBubbleChart(launchData);
}

// Bubble chart
function drawBubbleChart(data) {
    const svg = d3.select("#bubble-chart");
    svg.selectAll("*").remove();

    const width = +svg.attr("width");
    const height = +svg.attr("height");

    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.price || 0)])
        .range([5, 40]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const simulation = d3.forceSimulation(data)
        .force("charge", d3.forceManyBody().strength(1))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide(d => radiusScale(d.price || 1)))
        .on("tick", ticked);

    const nodes = svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("r", d => radiusScale(d.price || 1))
        .attr("fill", d => colorScale(d.agency))
        .append("title")
        .text(d => `${d.mission_name} - $${d.price}`);

    function ticked() {
        svg.selectAll("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }
}

// Rocket launch animation (simple indicator)
function rocketAnimation(successfulCount) {
    const svg = d3.select("#rocket-launch");
    svg.selectAll("*").remove();

    svg.append("text")
        .attr("x", 20)
        .attr("y", 100)
        .text(`🚀 ${successfulCount} launches`)
        .style("font-size", "24px");
}

// Fetch data from API
function loadLaunchData() {
    fetch("/api/launches")
        .then(response => response.json())
        .then(data => {
            launchData = data;
            populateFilters(data);
            drawBubbleChart(data);

            const successful = data.filter(d => d.success).length;
            rocketAnimation(successful);
        })
        .catch(err => {
            console.error("Error loading launch data:", err);
        });
}

// Init on page load
document.addEventListener("DOMContentLoaded", loadLaunchData);
