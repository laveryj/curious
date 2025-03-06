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
      const allSpecies = [];
      const uniqueSpeciesIds = new Set(); // To track unique species IDs
      
      // Flatten species from exhibits where "exhibit-mode" is "standard"
      data.exhibits.forEach((exhibit) => {
        if (exhibit["exhibit-mode"] === "standard") {
          exhibit.species.forEach((species) => {
            if (!uniqueSpeciesIds.has(species["species-id"])) {
              uniqueSpeciesIds.add(species["species-id"]);
              allSpecies.push(species);
            }
          });
        }
      });

      // Check if there are any species to display
      if (allSpecies.length === 0) {
        speciesListContainer.innerHTML = `<p>No species available to display.</p>`;
        return;
      }

      // Render species as cards
      allSpecies.forEach((species) => {
        const card = document.createElement("div");
        card.classList.add("species-card");
        card.innerHTML = `
          <img src="${species.imageURL || 'placeholder.png'}" alt="${species.commonName}">
          <h3>${species.commonName}</h3>
        `;
        speciesListContainer.appendChild(card);
      });
    })
    .catch((error) => {
      console.error("Error loading species data:", error);
      speciesListContainer.innerHTML = `<p>Failed to load species list. Please try again later.</p>`;
    });
});