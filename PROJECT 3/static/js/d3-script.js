document.addEventListener("DOMContentLoaded", function () {
    fetch("/api/launches")
        .then(res => res.json())
        .then(data => {
            initDropdowns(data);
            drawRocket();
            updateCharts(data);
        });

    document.getElementById("apply-filters").addEventListener("click", () => {
        fetch("/api/launches")
            .then(res => res.json())
            .then(data => {
                const agency = document.getElementById("agency-filter").value;
                const year = document.getElementById("year-filter").value;
                const filtered = data.filter(d =>
                    (agency === "All" || d.agency === agency) &&
                    (year === "All" || d.launch_year == year)
                );
                updateCharts(filtered);
            });
    });

    document.getElementById("reset-filters").addEventListener("click", () => {
        fetch("/api/launches")
            .then(res => res.json())
            .then(data => {
                document.getElementById("agency-filter").value = "All";
                document.getElementById("year-filter").value = "All";
                updateCharts(data);
            });
    });

    function initDropdowns(data) {
        const agencies = Array.from(new Set(data.map(d => d.agency))).sort();
        const years = Array.from(new Set(data.map(d => d.launch_year))).sort();

        const agencySelect = d3.select("#agency-filter");
        const yearSelect = d3.select("#year-filter");

        agencies.forEach(agency => {
            agencySelect.append("option").text(agency).attr("value", agency);
        });

        years.forEach(year => {
            yearSelect.append("option").text(year).attr("value", year);
        });
    }

    function drawRocket() {
        const svg = d3.select("#rocket-launch");
        svg.append("rect").attr("width", 800).attr("height", 200).attr("fill", "#f4f4f4");
        svg.append("text")
            .attr("x", 400)
            .attr("y", 100)
            .attr("text-anchor", "middle")
            .attr("font-size", "30px")
            .text("🚀 Rocket Launch Ready");
    }

    function updateCharts(data) {
        drawBarChart(data);
        drawBubbleChart(data);
    }

    function drawBarChart(data) {
        const svg = d3.select("#bar-chart").html("");
        const width = +svg.attr("width");
        const height = +svg.attr("height");

        const launchesPerYear = d3.rollups(data, v => v.length, d => d.launch_year).sort();
        const x = d3.scaleBand().domain(launchesPerYear.map(d => d[0])).range([40, width - 20]).padding(0.1);
        const y = d3.scaleLinear().domain([0, d3.max(launchesPerYear, d => d[1])]).range([height - 30, 20]);

        svg.selectAll(".bar")
            .data(launchesPerYear)
            .enter()
            .append("rect")
            .attr("x", d => x(d[0]))
            .attr("y", d => y(d[1]))
            .attr("width", x.bandwidth())
            .attr("height", d => height - 30 - y(d[1]))
            .attr("fill", "steelblue");

        svg.append("g").attr("transform", `translate(0,${height - 30})`).call(d3.axisBottom(x));
        svg.append("g").attr("transform", `translate(40,0)`).call(d3.axisLeft(y));
    }

    function drawBubbleChart(data) {
        const svg = d3.select("#bubble-chart").html("");
        const width = +svg.attr("width");
        const height = +svg.attr("height");

        const simulation = d3.forceSimulation(data)
            .force("charge", d3.forceManyBody().strength(5))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(20))
            .on("tick", ticked);

        const color = d => d.success === true ? "green" : d.success === false ? "red" : "gray";

        const node = svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("r", 8)
            .attr("fill", color)
            .append("title")
            .text(d => `${d.mission_name} (${d.launch_year})`);

        function ticked() {
            svg.selectAll("circle")
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        }
    }
});
