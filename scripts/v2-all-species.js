document.addEventListener("DOMContentLoaded", () => {
  const speciesListContainer = document.getElementById("species-list");
  const dataUrl = "./assets/data/data.json";

  fetch(dataUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const allObjects = [];
      const uniqueObjectIds = new Set(); // To track unique object IDs

      // Flatten objects from exhibits where "exhibitMode" is "standard"
      data.exhibits.forEach((exhibit) => {
        if (exhibit.exhibitMode === "standard") { // Correctly matches "exhibitMode"
          if (exhibit.objects && Array.isArray(exhibit.objects)) { // Ensure objects exist and are an array
            exhibit.objects.forEach((object) => {
              if (!uniqueObjectIds.has(object.objectID)) { // Correctly deduplicate based on "objectID"
                uniqueObjectIds.add(object.objectID);
                allObjects.push(object);
              }
            });
          } else {
            console.warn(`Exhibit ${exhibit.exhibitID} has no valid objects array.`); // Debugging info
          }
        }
      });

      // Check if there are any objects to display
      if (allObjects.length === 0) {
        speciesListContainer.innerHTML = `<p>No objects available to display.</p>`;
        return;
      }

      // Render objects as cards
      allObjects.forEach((object) => {
        const card = document.createElement("div");
        card.classList.add("object-card");
        card.innerHTML = `
          <img src="${object.ImageURL || 'placeholder.png'}" alt="${object.commonName || 'Unknown Object'}">
          <h3>${object.commonName || 'Unnamed Object'}</h3>
        `;
        speciesListContainer.appendChild(card);
      });
    })
    .catch((error) => {
      console.error("Error loading object data:", error);
      speciesListContainer.innerHTML = `<p>Failed to load object list. Please try again later.</p>`;
    });
});
