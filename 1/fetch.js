document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const exhibitId = urlParams.get("id");
  const speciesId = urlParams.get("species");
  const dataUrl = "./data.json";

  console.log("URL Parameters:", { exhibitId, speciesId }); // Debug: Check URL parameters
  console.log("Fetching data from:", dataUrl); // Debug: Confirm the path to the JSON file

  if (!exhibitId) {
    console.error("No exhibit ID provided."); // Debug: Log missing exhibit ID
    const titleElement = document.getElementById("title");
    if (titleElement) {
      titleElement.textContent = "No Exhibit Selected";
    }
    document.querySelector("#content").innerHTML = `<p>Please scan an exhibit QR code to start.</p>`;
    return;
  }

  fetch(dataUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Data fetched successfully:", data); // Debug: Log fetched data

      if (speciesId) {
        // Load species-specific data
        const exhibitData = data.exhibits.find(exhibit => exhibit.id == exhibitId);
        if (exhibitData) {
          const speciesData = exhibitData.species.find(species => species.id == speciesId);

          console.log("Species data found:", speciesData); // Debug: Log species data

          if (speciesData) {
            renderSpecies(speciesData);
          } else {
            console.error(`Species with ID ${speciesId} not found.`); // Debug: Log missing species
            const titleElement = document.getElementById("title");
            if (titleElement) {
              titleElement.textContent = "Species Not Found";
            }
            document.querySelector("#content").innerHTML = `<p>No species found in this exhibit (Error species ID: ${speciesId})</p>`;
          }
        } else {
          console.error(`Exhibit with ID ${exhibitId} not found.`); // Debug: Log missing exhibit
          const titleElement = document.getElementById("title");
          if (titleElement) {
            titleElement.textContent = "Exhibit Not Found";
          }
          document.querySelector("#content").innerHTML = `<p>No exhibit found with ID: ${exhibitId}.</p>`;
        }
      } else {
        // Load exhibit data
        const exhibitData = data.exhibits.find(exhibit => exhibit.id == exhibitId);

        console.log("Exhibit data found:", exhibitData); // Debug: Log exhibit data

        if (exhibitData) {
          const titleElement = document.getElementById("title");
          if (titleElement) {
            titleElement.textContent = exhibitData.name;
          } else {
            console.error('Title element not found on the page.');
          }
          renderExhibit(exhibitData.species, exhibitId); // Pass exhibitId dynamically
        } else {
          console.error(`Exhibit with ID ${exhibitId} not found.`); // Debug: Log missing exhibit
          const titleElement = document.getElementById("title");
          if (titleElement) {
            titleElement.textContent = "Exhibit Not Found";
          }
          document.querySelector("#content").innerHTML = `<p>No exhibit found with ID: ${exhibitId}.</p>`;
        }
      }
    })
    .catch(error => {
      console.error("Error loading data:", error); // Debug: Log any fetch errors
      document.querySelector("#content").innerHTML = `<p>Failed to load data. Please try again later.</p>`;
    });
});

function renderExhibit(species, exhibitId) {
  console.log("Rendering exhibit with species:", species); // Debug: Log species being rendered
  const content = document.querySelector("#content");

  if (!species || species.length === 0) {
    console.warn("No species found in this exhibit."); // Debug: Log empty species list
    content.innerHTML = `<p>No species found in this exhibit.</p>`;
    return;
  }

  species.forEach(item => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <a href="index.html?id=${exhibitId}&species=${item.id}" style="text-decoration: none; color: inherit;">
        <img src="${item.imageURL || 'placeholder.png'}" alt="${item.commonName}">
        <h3>${item.commonName} (<em>${item.scientificName}</em>)</h3>
        <p>${item.shortDescription}</p>
      </a>
    `;
    content.appendChild(card);
  });
}

function renderSpecies(species) {
  console.log("Rendering species:", species); // Debug: Log species being rendered
  const content = document.querySelector("#content");
  content.innerHTML = `
    <div class="card">
      <img src="${species.imageURL || 'placeholder.png'}" alt="${species.commonName}">
      <h2>${species.commonName} (<em>${species.scientificName}</em>)</h2>
      <p>${species.longDescription}</p>
      <p><strong>Conservation Status:</strong> ${species.conservationStatus}</p>
    </div>
  `;
}