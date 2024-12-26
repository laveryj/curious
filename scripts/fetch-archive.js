document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const exhibitId = urlParams.get("exhibit-id");
  const speciesId = urlParams.get("species-id"); // Fixed species-id parameter
  const dataUrl = "./assets/data/data.json";
  const configUrl = "./assets/data/config.json";

  console.log("URL Parameters:", { exhibitId, speciesId }); // Debug: Check URL parameters
  console.log("Fetching data from:", dataUrl); // Debug: Confirm the path to the JSON file

  // Fetch site name from config and update the header
  fetch(configUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((config) => {
      const siteName = config.siteName || "Curious";
      console.log("Fetched site name:", siteName);
      updateSiteName(siteName);
    })
    .catch((error) => {
      console.error("Error loading site name:", error);
      updateSiteName("Curious"); // Fallback name
    });

  if (!exhibitId) {
    console.log("No exhibit ID provided in the URL."); // Debug
    updateTitleAndContent("No Exhibit Selected", "Please scan an exhibit QR code to start.");
    return;
  }

  fetch(dataUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Fetched Data:", data); // Debug: Log the entire data.json
      if (speciesId) {
        handleSpeciesView(data, exhibitId, speciesId);
      } else {
        handleExhibitView(data, exhibitId);
      }
    })
    .catch((error) => {
      console.error("Error loading data:", error);
      updateTitleAndContent("Error", "Failed to load exhibit data. Please try again later.");
    });
});

function updateSiteName(siteName) {
  const siteNameElement = document.getElementById("site-name");
  if (siteNameElement) {
    siteNameElement.textContent = `Welcome to ${siteName}`;
  }
  document.title = siteName;
}

function handleExhibitView(data, exhibitId) {
  const exhibitData = data.exhibits.find((exhibit) => exhibit["exhibit-id"] == exhibitId);

  console.log("Matching Exhibit Data:", exhibitData); // Debug log

  if (exhibitData) {
    updateTitleAndContent(`Species in the ${exhibitData["exhibit-name"]}`);
    renderExhibit(exhibitData.species, exhibitId);
  } else {
    console.error(`No exhibit found with ID: ${exhibitId}`);
    updateTitleAndContent("Exhibit Not Found", `No exhibit found with ID: ${exhibitId}.`);
  }
}

function handleSpeciesView(data, exhibitId, speciesId) {
  const exhibitData = data.exhibits.find((exhibit) => exhibit["exhibit-id"] == exhibitId);

  if (exhibitData) {
    const speciesData = exhibitData.species.find((species) => species["species-id"] == speciesId);

    if (speciesData) {
      updateTitleAndContent("Species Factfile");
      renderSpecies(speciesData);
    } else {
      console.error(`Species with ID ${speciesId} not found.`);
      updateTitleAndContent("Species Not Found", `No species found with ID: ${speciesId}.`);
    }
  } else {
    console.error(`Exhibit with ID ${exhibitId} not found.`);
    updateTitleAndContent("Exhibit Not Found", `No exhibit found with ID: ${exhibitId}.`);
  }
}

function updateTitleAndContent(title, content = "") {
  const titleElement = document.getElementById("exhibit-title");
  if (titleElement) {
    titleElement.textContent = title;
  }
  document.title = title;

  if (content) {
    document.querySelector("#content").innerHTML = `<p>${content}</p>`;
  }
}

function renderExhibit(species, exhibitId) {
  console.log("Rendering exhibit. Exhibit ID:", exhibitId); // Debug log
  const content = document.querySelector("#content");

  if (!species || species.length === 0) {
    content.innerHTML = `<p>No species found in this exhibit.</p>`;
    return;
  }

  content.innerHTML = ""; // Clear previous content
  species.forEach((item) => {
    console.log("Species item:", item); // Debug each species item
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <a href="index.html?exhibit-id=${exhibitId}&species-id=${item["species-id"]}" style="text-decoration: none; color: inherit;">
        <img src="${item.imageURL || "placeholder.png"}" alt="${item.commonName}">
        <h3>${item.commonName} (<em>${item.scientificName}</em>)</h3>
        <p>${item.shortDescription}</p>
      </a>
    `;
    content.appendChild(card);
  });

  // Reapply the theme to include newly created cards
  fetch("./assets/data/config.json")
    .then((response) => response.json())
    .then((config) => {
      console.log("Reapplying theme for cards");
      applyTheme(config.theme);
    })
    .catch((error) => {
      console.error("Error reapplying theme:", error);
    });
}

function renderSpecies(species) {
  console.log("Rendering species:", species); // Debug: Log species being rendered
  const content = document.querySelector("#content");
  content.innerHTML = `
    <div class="card">
      <img src="${species.imageURL || "placeholder.png"}" alt="${species.commonName}">
      <h2>${species.commonName} (<em>${species.scientificName}</em>)</h2>
      <p>${species.longDescription}</p>
      <p><b>Did you know? </b>${species.funFact}</p>
      <p><strong>Conservation Status:</strong> ${species.conservationStatus}</p>
    </div>
  `;

  // Reapply the theme to include the newly created card
  fetch("./assets/data/config.json")
    .then((response) => response.json())
    .then((config) => {
      console.log("Reapplying theme for species card");
      applyTheme(config.theme);
    })
    .catch((error) => {
      console.error("Error reapplying theme:", error);
    });
}