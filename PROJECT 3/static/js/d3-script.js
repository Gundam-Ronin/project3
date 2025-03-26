// d3-script.js

document.addEventListener("DOMContentLoaded", async function () {
    const API_URL = "/api/launches";

    let allData = [];

    // Fetch data from your Flask API
    try {
        const response = await fetch(API_URL);
        allData = await response.json();
    } catch (error) {
        console.error("Failed to fetch data from API:", error);
        return;
    }

    console.log("🚀 Launch data loaded:", allData);

    // Extract unique agencies and years for dropdowns
    const agencies = [...new Set(allData.map(d => d.agency).filter(Boolean))];
    const years = [...new Set(allData.map(d => d.launch_year).filter(Boolean))].sort();

    populateDropdown("#agencyFilter", ["All", ...agencies]);
    populateDropdown("#yearFilter", ["All", ...years]);

    document.getElementById("applyFilters").addEventListener("click", () => {
        const agency = document.getElementById("agencyFilter").value;
        const year = document.getElementById("yearFilter").value;
        const filtered = filterData(allData, agency, year);
        updateVisuals(filtered);
    });

    document.getElementById("resetFilters").addEventListener("click", () => {
        document.getElementById("agencyFilter").value = "All";
        document.getElementById("yearFilter").value = "All";
        updateVisuals(allData);
    });

    updateVisuals(allData);
});

// Helper to populate dropdown
function populateDropdown(selector, values) {
    const dropdown = document.querySelector(selector);
    dropdown.innerHTML = "";
    values.forEach(val => {
        const option = document.createElement("option");
        option.value = val;
        option.text = val;
        dropdown.appendChild(option);
    });
}

// Filter based on dropdowns
function filterData(data, agency, year) {
    return data.filter(d => {
        return (agency === "All" || d.agency === agency) &&
               (year === "All" || d.launch_year == year);
    });
}

// Update all visualizations
function updateVisuals(data) {
    renderRocketLaunch(data);
    renderBubbleChart(data);
    renderBarChart(data);
}

// Rocket launch animation (circles rising)
function renderRocketLaunch(data) {
    d3.select("#rocketLaunch").html(""); // clear previous

    const width = 800;
    const height = 120;

    const svg = d3.select("#rocketLaunch")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", (_, i) => 30 + i * 25)
        .attr("cy", height)
        .attr("r", 8)
        .attr("fill", "red")
        .transition()
        .duration(2000)
        .attr("cy", 20);
}

// Force Bubble Chart
function renderBubbleChart(data) {
    d3.select("#bubbleChart").html("");

    const width = 800;
    const height = 400;

    const svg = d3.select("#bubbleChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const nodes = data.map(d => ({
        radius: 5 + Math.random() * 10,
        x: Math.random() * width,
        y: Math.random() * height
    }));

    const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(2))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(d => d.radius))
        .on("tick", ticked);

    function ticked() {
        const u = svg.selectAll("circle")
            .data(nodes);

        u.enter()
            .append("circle")
            .attr("r", d => d.radius)
            .attr("fill", "tomato")
            .merge(u)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        u.exit().remove();
    }
}

// Bar chart (Launches per year)
function renderBarChart(data) {
    d3.select("#barChart").html("");

    const width = 800;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    const grouped = d3.rollups(
        data,
        v => v.length,
        d => d.launch_year
    ).sort(([a], [b]) => a - b);

    const x = d3.scaleBand()
        .domain(grouped.map(d => d[0]))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(grouped, d => d[1])])
        .nice()
        .range([height - margin.bottom, margin.top]);

    const svg = d3.select("#barChart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    svg.selectAll("rect")
        .data(grouped)
        .enter()
        .append("rect")
        .attr("x", d => x(d[0]))
        .attr("y", d => y(d[1]))
        .attr("height", d => y(0) - y(d[1]))
        .attr("width", x.bandwidth())
        .attr("fill", "orange");

    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));
}
