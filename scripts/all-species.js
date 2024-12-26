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
        
        // Flatten all species from all exhibits into one list
        data.exhibits.forEach((exhibit) => {
          allSpecies.push(...exhibit.species);
        });
  
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