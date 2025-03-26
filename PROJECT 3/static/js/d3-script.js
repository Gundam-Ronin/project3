document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/launches")
    .then(response => response.json())
    .then(data => {
      renderAll(data);
    })
    .catch(error => console.error("Data load error:", error));
});

function renderAll(data) {
  renderCollideChart(data);
  renderBarChart(data);
  renderTreeChart(data);
}
