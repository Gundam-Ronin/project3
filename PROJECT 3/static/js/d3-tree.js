document.addEventListener("DOMContentLoaded", () => {
  fetch("/api/launches")
    .then(response => response.json())
    .then(data => {
      try {
        setupDropdowns(data);
        renderCharts(data);
      } catch (err) {
        console.error("Error in renderCharts:", err);
      }

      document.getElementById("apply-filters").addEventListener("click", () => {
        const filtered = applyFilters(data);
        try {
          renderCharts(filtered);
        } catch (err) {
          console.error("Error in renderCharts with filters:", err);
        }
      });

      document.getElementById("reset-filters").addEventListener("click", () => {
        document.getElementById("agency-filter").value = "All";
        document.getElementById("year-filter").value = "All";
        try {
          renderCharts(data);
        } catch (err) {
          console.error("Error in resetCharts:", err);
        }
      });
    })
    .catch(error => {
      console.error("Failed to fetch /api/launches:", error);
    });
});


