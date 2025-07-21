// ... existing code ...
<div className="flex items-center gap-2">
  <button
    className="h-9 px-4 bg-gray-800 text-gray-200 rounded-md border border-gray-700 hover:bg-gray-700 transition-colors"
    onClick={async () => {
      try {
        const response = await fetch("/api/update-data", {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Failed to update data");
        }

        // Refresh the page to show updated data
        window.location.reload();
      } catch (error) {
        console.error("Error updating data:", error);
        alert("Failed to update data. Please try again.");
      }
    }}
  >
    Update Data
  </button>
  <button
    className="h-9 px-4 text-gray-400 rounded-md hover:bg-gray-800 transition-colors"
    disabled
  >
    Coming soon...
  </button>
</div>;
// ... existing code ...
