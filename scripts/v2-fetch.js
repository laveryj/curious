async function handleNotices(exhibitId) {
  const noticesUrl = "./assets/data/notices.json"; // Path to notices.json
  const dataUrl = "./assets/data/data.json"; // Path to exhibit data JSON

  if (!exhibitId) {
    console.warn("No Exhibit ID provided in the URL.");
    return false;
  }

  try {
    const dataResponse = await fetch(dataUrl);
    if (!dataResponse.ok) {
      throw new Error(`Failed to load exhibit data: ${dataResponse.status}`);
    }
    const exhibitData = await dataResponse.json();

    const exhibit = exhibitData.exhibits.find((item) => item.exhibitID == exhibitId);
    if (!exhibit) {
      window.location.href = "./notice.html?notice=not-found";
      return true;
    }

    const exhibitStatus = exhibit.exhibitStatus || "unknown";
    if (exhibitStatus !== "active") {
      const noticesResponse = await fetch(noticesUrl);
      if (!noticesResponse.ok) {
        throw new Error(`Failed to load notices.json: ${noticesResponse.status}`);
      }
      const notices = await noticesResponse.json();

      if (notices[exhibitStatus]) {
        window.location.href = `./notice.html?notice=${exhibitStatus}`;
        return true;
      } else {
        window.location.href = "./notice.html?notice=general";
        return true;
      }
    }
  } catch (error) {
    console.error("Error in handleNotices:", error);
    window.location.href = "./notice.html?notice=error";
    return true;
  }

  return false;
}

// Main content execution
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const exhibitId = urlParams.get("EID"); // Retrieve Exhibit ID
  const speciesId = urlParams.get("OID"); // Retrieve Species ID

  // Call handleNotices and check if a redirection occurred
  const redirected = await handleNotices(exhibitId);
  if (redirected) return; // Stop further execution if redirected

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
      updateSiteName(siteName); // Change to explore tank?
    })
    .catch((error) => {
      console.error("Error loading site name:", error);
      updateSiteName("Curious"); // Fallback name
    });

  if (!exhibitId) {
    console.log("No exhibit ID provided in the URL."); // Debug
    updateTitleAndContent("Scan a QR code to start", "");
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

// Function to pull in site name
function updateSiteName(siteName) {
  window.siteName = siteName; // Store globally
  const siteNameElement = document.getElementById("site-name");
  if (siteNameElement) {
    siteNameElement.textContent = `Welcome to ${siteName}`;
  }

  // Set the title based on the URL path
  const path = window.location.pathname;
  if (path.endsWith("get-started.html")) {
    document.title = `Get Started | ${siteName} `;
  } else if (path.endsWith("index.html") || path === "/") {
    document.title = `Scan to Start | ${siteName}`;  
  } else if (path.endsWith("all-species.html") || path === "/") {
      document.title = `All Species | ${siteName}`;
  } else {
    document.title = `${siteName}`; // Fallback for other pages
  }
}

// Function to pull in title and content
function updateTitleAndContent(content) {
  // Check if the #content element exists
  const contentElement = document.querySelector("#content");
  
  if (!contentElement) {
    console.error("Error: '#content' element not found in the DOM.");
    return; // Exit the function if the element doesn't exist
  }

  // Safely update the innerHTML if the element exists
  contentElement.innerHTML = `<p>${content}</p>`;
}

function updateTitleAndContent(title, content = "") {
  // Update the page <title>
  document.title = title;
  // document.title = `${siteName} | Scan a code to start`;

  // Update the <h1> element with ID #exhibit-title
  const titleElement = document.getElementById("exhibit-title");
  if (titleElement) {
    titleElement.textContent = title;
  } else {
    console.error("Error: #exhibit-title element not found in the DOM.");
  }

  // Update the #content element, if content is provided
  if (content) {
    const contentElement = document.querySelector("#content");
    if (contentElement) {
      contentElement.innerHTML = `<p>${content}</p>`;
    } else {
      console.error("Error: #content element not found in the DOM.");
    }
  }
}

// Function for deciding which data to show, depending on exhibitMode
function handleExhibitView(data, exhibitId) {
  const exhibitData = data.exhibits.find((exhibit) => exhibit["exhibitID"] == exhibitId);

  console.log("Matching Exhibit Data:", exhibitData); // Debug log

  if (exhibitData) {
    const exhibitMode = exhibitData["exhibitMode"];

    switch (exhibitMode) {
      case "audio":
        // updateTitleAndContent(`Listen: ${exhibitData["exhibitName"]}`);
        updateTitleAndContent(`Audio Guide: ${siteName}`);
        renderAudio(exhibitData);
        break;

      case "video":
        updateTitleAndContent(`Watch: ${exhibitData["exhibitName"]}`);
        renderVideo(exhibitData); // Call a function to render video content
        break;

      case "blog":
        updateTitleAndContent(`Blog: ${exhibitData["exhibitName"]}`);
        renderBlog(exhibitData); // Call a function to render blog content
        break;

      default:
        updateTitleAndContent(`Explore: ${exhibitData["exhibitName"]}`);
        renderExhibit(exhibitData.objects, exhibitId);
    }
  } else {
    console.error(`No exhibit found with ID: ${exhibitId}`);
    updateTitleAndContent("Exhibit Not Found", `No exhibit found with ID: ${exhibitId}.`);
  }
}

function handleSpeciesView(data, exhibitId, speciesId) {
  const exhibitData = data.exhibits.find((exhibit) => exhibit["exhibitID"] == exhibitId);

  if (exhibitData) {
      const speciesData = exhibitData.objects.find((object) => object["objectID"] == speciesId);

      if (speciesData) {
          // Determine if it's an animal or species
          const isAnimal = !!speciesData.nickname; // True if it has a nickname
          const displayName = speciesData.nickname || speciesData.commonName || "Unknown Species";
          const titlePrefix = isAnimal ? "Profile" : "Factfile";

          const title = `${titlePrefix}: ${displayName}`;
          updateTitleAndContent(title); // Update the page title and header
          renderSpecies(speciesData); // Render the species content
      } else {
          console.error(`Species with ID ${speciesId} not found.`);
          updateTitleAndContent("Species Not Found", `No species found with ID: ${speciesId}.`);
      }
  } else {
      console.error(`Exhibit with ID ${exhibitId} not found.`);
      updateTitleAndContent("Exhibit Not Found", `No exhibit found with ID: ${exhibitId}.`);
  }
}


function renderExhibit(objects, exhibitId) {
  console.log("Rendering exhibit. Exhibit ID:", exhibitId); // Debug log
  const content = document.querySelector("#content");

  // Clear previous content
  content.innerHTML = "";

  // Add a message at the top
  const topMessage = document.createElement("p");
  topMessage.classList.add("exhibit-message");
  topMessage.innerHTML = "<h4>Tap a card for more details...</h4>";
  content.appendChild(topMessage);

  if (!objects || objects.length === 0) {
    content.innerHTML += `<p>There are no objects assigned to this exhibit.</p>`;
    return;
  }

  // Sort objects by priority first, then alphabetically by commonName
  objects.sort((a, b) => {
    const aPrioritise = a.prioritise === "TRUE"; // Convert to boolean
    const bPrioritise = b.prioritise === "TRUE"; // Convert to boolean
  
    if (aPrioritise === bPrioritise) {
      return a.commonName.localeCompare(b.commonName); // Alphabetical if prioritise is the same
    }
    return bPrioritise - aPrioritise; // Prioritise objects with prioritise: true
  });

  // Render object cards
  objects.forEach((item) => {
    console.log("Object item:", item); // Debug each object item

    // Determine card content for Species or Animal
    const isAnimal = !!item["nickname"]; // Check if it's an animal based on nickname presence
    const title = isAnimal ? `${item["nickname"]}` : `${item["commonName"]}`;
    const subheading = isAnimal
      ? `(${item["commonName"]}, <em>${item["scientificName"]}</em>)`
      : `(<em>${item["scientificName"]}</em>)`;
      const description = isAnimal
      ? `<p>${item["personalityProfile"] || item["shortDescription"] || ""}</p>`
      : `<p>${item["shortDescription"] || ""}</p>`;

    // Create the card
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <a href="index.html?EID=${exhibitId}&OID=${item["objectID"]}" style="text-decoration: none; color: inherit;">
        <img src="${item["ImageURL"] || "../assets/images/placeholder-image.jpg"}" alt="${item["commonName"]}">
        <h3>${title} ${subheading}</h3>
        ${description}
      </a>
    `;
    content.appendChild(card);
  });

  // Add a message at the bottom
  const bottomMessage = document.createElement("p");
  bottomMessage.classList.add("exhibit-message");
  bottomMessage.innerHTML = "<h4>Keep scanning to learn more!</h4>";
  content.appendChild(bottomMessage);

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

  // Clear the existing content
  content.innerHTML = "";

  // Create a container for species information
  const speciesContainer = document.createElement("div");
  speciesContainer.classList.add("species-info-container");

  // Add the image with a clickable event for the modal
  const image = document.createElement("img");
  image.src = species["ImageURL"] || "../assets/images/placeholder-image.jpg";
  image.alt = species["commonName"];
  image.classList.add("species-image");
  image.style.cursor = "pointer"; // Indicate the image is clickable
  image.addEventListener("click", () => openImageModal(species["ImageURL"] || "../assets/images/placeholder-image.jpg"));
  speciesContainer.appendChild(image);

  // Add species details
  const details = document.createElement("div");
  details.classList.add("species-details");

  // Build the HTML for species details in the specified order
  let detailsHTML = `
  <h2 style="margin-bottom: 5px;">${species.commonName}</h2>
  <h3 style="margin-top: 5; margin-bottom: 10px;"><i>${species.scientificName}</i></h3>
`;

if (species["nickname"]) {
  detailsHTML += `<br><h3 style="margin-bottom: 5px;">Animal Profile:</h3><br>`;
}
if (species["nickname"]) {
  detailsHTML += `<p style="margin: 2px 0;"><b>Name:</b> ${species["nickname"]}</p>`;
}
if (species["age"]) {
  detailsHTML += `<p style="margin: 2px 0;"><b>Age:</b> ${species["age"]}</p>`;
}
if (species["personalityProfile"]) {
  detailsHTML += `<p style="margin: 2px 0;"><b>About:</b> ${species["personalityProfile"]}</p>`;
}
if (species["size"]) {
  detailsHTML += `<p style="margin: 2px 0;"><b>Size:</b> ${species["size"]}</p>`;
}
if (species["weight"]) {
  detailsHTML += `<p style="margin: 2px 0;"><b>Weight:</b> ${species["weight"]}</p>`;
}
if (species["nickname"]) {
  detailsHTML += `<br><br><h3 style="margin-bottom: 5px;">Species Factfile:</h3>`;
}
detailsHTML += `
  <p style="margin: 2px 0;"><br>${species["longDescription"] || "No description has been provided"}</p>
`;
if (species["funFact"]) {
  detailsHTML += `  <p style="margin: 2px 0;"><br><b>Did you know?</b> ${species["funFact"] || "Not provided."}</p>`;
}
detailsHTML += `
  <p style="margin: 2px 0;"><br><b>Conservation Status:</b> ${species["conservationStatus"] || "Not Evaluated"}</p>
  <p style="margin: 2px 0;"><br>${species["conservationInfo"] || ""}<br><br></p>
`;


  // Set the generated HTML
  details.innerHTML = detailsHTML;

// Add external links if they exist
if (species["primaryURL"] && species["primaryURL"].trim() !== "") {
  const learnMoreButton = document.createElement("a");
  learnMoreButton.href = species["primaryURL"];
  learnMoreButton.textContent = species["primaryURLlabel"] || "Learn more";
  learnMoreButton.classList.add("action-button");
  learnMoreButton.target = "_blank"; // Open link in a new tab
  details.appendChild(learnMoreButton);
}

if (species["secondaryURL"] && species["secondaryURL"].trim() !== "") {
  const fishBaseButton = document.createElement("a");
  fishBaseButton.href = species["secondaryURL"];
  fishBaseButton.textContent = species["secondaryURLlabel"] || "Learn more";
  fishBaseButton.classList.add("action-button");
  fishBaseButton.target = "_blank"; // Open link in a new tab
  details.appendChild(fishBaseButton);
}

  // Append the details to the container
  speciesContainer.appendChild(details);

  // Add the container to the content
  content.appendChild(speciesContainer);

  // Reapply the theme
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



function renderAudio(exhibit) {
  const content = document.querySelector("#content");

  // Extract the audioURL and longDescription from the first object in the array
  const audioURL = exhibit.objects.length > 0 ? exhibit.objects[0].AudioURL || exhibit.objects[0].audioURL : "";
  const longDescription = exhibit.objects.length > 0 ? exhibit.objects[0].longDescription : "";

  // Clear existing content
  content.innerHTML = "";

  // Add exhibit name
  const title = document.createElement("h3");
  title.textContent = `You're listening to the audio guide for: "${exhibit.exhibitName}"`;
  content.appendChild(title);

  // Add the audio controls container
  const audioContainer = document.querySelector("#audio-container");
  audioContainer.style.display = "block"; // Ensure it's visible
  content.appendChild(audioContainer); // Move it inside the content container

  // Add the description below the audio container
  const decriptionTitle = document.createElement("strong");
  const description = document.createElement("p");
  decriptionTitle.textContent = "Audio Description:";
  description.textContent = longDescription || "We recommend using headphones to get the most out of this audio guide.";
  description.style.marginTop = "20px"; // Optional: Add some spacing
  content.appendChild(decriptionTitle);
  content.appendChild(description);

  // Audio functionality
  const audioPlayer = document.querySelector("#audio-player");
  const audioSource = document.querySelector("#audio-source");
  const playButton = document.querySelector("#play-audio");
  const pauseButton = document.querySelector("#pause-audio");
  const restartButton = document.querySelector("#restart-audio");
  const audioStatus = document.querySelector("#audio-status");

  if (audioURL) {
    audioSource.src = audioURL;
    audioPlayer.load(); // Reload audio with the new source

    // Play button logic
    playButton.addEventListener("click", () => {
      audioPlayer.play().then(() => {
        audioStatus.textContent = "Now playing...";
        playButton.style.display = "none"; // Hide play button
        pauseButton.style.display = "inline-block"; // Show pause button
        restartButton.style.display = "inline-block"; // Show restart button
      }).catch((error) => {
        console.error("Error playing audio:", error);
        audioStatus.textContent = "Unable to play audio. Please check your browser settings.";
      });
    });

    // Pause button logic
    pauseButton.addEventListener("click", () => {
      if (audioPlayer.paused) {
        audioPlayer.play().then(() => {
          audioStatus.textContent = "Now playing...";
          pauseButton.textContent = "⏸ Pause"; // Update button text
        });
      } else {
        audioPlayer.pause();
        audioStatus.textContent = "Paused";
        pauseButton.textContent = "▶ Resume"; // Update button text
      }
    });

    // Restart button logic
    restartButton.addEventListener("click", () => {
      audioPlayer.currentTime = 0;
      audioPlayer.play().then(() => {
        audioStatus.textContent = "Restarted, now playing...";
        pauseButton.textContent = "⏸ Pause"; // Reset button text
      }).catch((error) => {
        console.error("Error restarting audio:", error);
        audioStatus.textContent = "Unable to restart audio";
      });
    });
  } else {
    audioContainer.style.display = "none";
    description.textContent = "No audio available for this exhibit.";
  }
}

// Function to only show the back button on the species info page
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  // const speciesId = urlParams.get("species-id");
  const speciesId = urlParams.get("OID");

  // Show the back button only if species-id is present
  const backButtonContainer = document.getElementById("back-button-container");
  if (speciesId) {
    backButtonContainer.style.display = "block";
  }
});