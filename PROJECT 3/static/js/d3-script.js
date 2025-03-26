document.addEventListener("DOMContentLoaded", () => {
    fetch("/api/launches")
        .then(response => response.json())
        .then(data => {
            setupDropdowns(data);
            renderCharts(data);

            document.getElementById("apply-filters").addEventListener("click", () => {
                const filtered = applyFilters(data);
                renderCharts(filtered);
            });

            document.getElementById("reset-filters").addEventListener("click", () => {
                resetFilters(data);
            });
        });

    function setupDropdowns(data) {
        const agencySelect = d3.select("#agency-filter");
        const yearSelect = d3.select("#year-filter");

        const agencies = Array.from(new Set(data.map(d => d.agency))).sort();
        const years = Array.from(new Set(data.map(d => d.launch_year))).sort((a, b) => a - b);

        agencySelect.selectAll("option:not(:first-child)").remove();
        yearSelect.selectAll("option:not(:first-child)").remove();

        agencySelect.selectAll("option.agency")
            .data(agencies)
            .enter()
            .append("option")
            .attr("class", "agency")
            .attr("value", d => d)
            .text(d => d);

        yearSelect.selectAll("option.year")
            .data(years)
            .enter()
            .append("option")
            .attr("class", "year")
            .attr("value", d => d)
            .text(d => d);
    }

    function applyFilters(data) {
        const agency = document.getElementById("agency-filter").value;
        const year = document.getElementById("year-filter").value;

        return data.filter(d => {
            const agencyMatch = agency === "All" || d.agency === agency;
            const yearMatch = year === "All" || d.launch_year === parseInt(year);
            return agencyMatch && yearMatch;
        });
    }

    function resetFilters(data) {
        document.getElementById("agency-filter").value = "All";
        document.getElementById("year-filter").value = "All";
        renderCharts(data);
    }

    function renderCharts(data) {
        renderBarChart(data);
        renderBubbleChart(data);
        renderRocketLaunch(data);
    }

    function renderBarChart(data) {
        d3.select("#bar-chart").selectAll("*").remove();
        const svg = d3.select("#bar-chart");
        const width = +svg.attr("width");
        const height = +svg.attr("height");

        const yearCounts = d3.rollup(data, v => v.length, d => d.launch_year);
        const sorted = Array.from(yearCounts.entries()).sort((a, b) => a[0] - b[0]);

        const x = d3.scaleBand()
            .domain(sorted.map(d => d[0]))
            .range([40, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain
