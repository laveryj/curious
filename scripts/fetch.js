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

// Function to pull in site name
function updateSiteName(siteName) {
  const siteNameElement = document.getElementById("site-name");
  if (siteNameElement) {
    siteNameElement.textContent = `Welcome to ${siteName}`;
  }
  document.title = siteName;
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

// Function for deciding which data to show, depending on exhibitMode
function handleExhibitView(data, exhibitId) {
  const exhibitData = data.exhibits.find((exhibit) => exhibit["exhibit-id"] == exhibitId);

  console.log("Matching Exhibit Data:", exhibitData); // Debug log

  if (exhibitData) {
    const exhibitMode = exhibitData["exhibit-mode"];

    switch (exhibitMode) {
      case "audio":
        updateTitleAndContent(`Audio Guide`);
        renderAudio(exhibitData);
        break;

      case "video":
        updateTitleAndContent(`Watch: ${exhibitData["exhibit-name"]}`);
        renderVideo(exhibitData); // Call a function to render video content
        break;

      case "blog":
        updateTitleAndContent(`Blog: ${exhibitData["exhibit-name"]}`);
        renderBlog(exhibitData); // Call a function to render blog content
        break;

      default:
        updateTitleAndContent(`Explore: ${exhibitData["exhibit-name"]}`);
        renderExhibit(exhibitData.species, exhibitId);
    }
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
      updateTitleAndContent("Object Not Found", `No objects found with ID: ${speciesId}.`);
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

  // Clear previous content
  content.innerHTML = "";

  // Add a message at the top
  const topMessage = document.createElement("p");
  topMessage.classList.add("exhibit-message");
  topMessage.innerHTML = "<h4>Tap a species card below...</h4>";
  content.appendChild(topMessage);

  if (!species || species.length === 0) {
    content.innerHTML += `<p>There are no objects assigned to this exhibit.</p>`;
    return;
  }

  // Render species cards
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
  image.src = species.imageURL || "placeholder.png";
  image.alt = species.commonName;
  image.classList.add("species-image");
  image.style.cursor = "pointer"; // Indicate the image is clickable
  image.addEventListener("click", () => openImageModal(species.imageURL || "placeholder.png"));
  speciesContainer.appendChild(image);

// Add species details
const details = document.createElement("div");
details.classList.add("species-details");

let detailsHTML = `
  <h2>${species.commonName}</h2>
  <h3><i>${species.scientificName}</i></h3>
  <br>
  <p><b>Conservation Status:</b> ${species.conservationStatus || "Not Evaluated"}</p>
  <p>${species.longDescription || "Detailed information is not available."}</p>
  <p><b>Did you know?</b> ${species.funFact || "No fun fact available."}</p>
`;

// Add animal-specific details if they are provided
if (species.nickname) {
  detailsHTML += `<p><b>Animal Name:</b> ${species.nickname}</p>`;
}
if (species.personalityProfile) {
  detailsHTML += `<p><b>Personality Profile:</b> ${species.personalityProfile}</p>`;
}
if (species.age) {
  detailsHTML += `<p><b>Age:</b> ${species.age}</p>`;
}
if (species.size) {
  detailsHTML += `<p><b>Size:</b> ${species.size}</p>`;
}
if (species.weight) {
  detailsHTML += `<p><b>Weight:</b> ${species.weight}</p>`;
}

// Set the HTML to the container
details.innerHTML = detailsHTML;

// Append the details to the container
content.appendChild(details);


  // Add external links
  if (species.URL) {
    const learnMoreButton = document.createElement("a");
    learnMoreButton.href = species.externalURL;
    learnMoreButton.textContent = "Learn More";
    learnMoreButton.classList.add("action-button");
    learnMoreButton.target = "_blank"; // Open link in a new tab
    details.appendChild(learnMoreButton);
  }

  if (species.fishBaseURL) {
    const fishBaseButton = document.createElement("a");
    fishBaseButton.href = species.fishBaseURL;
    fishBaseButton.textContent = "Learn more on FishBase";
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

  // Add modal container to the page
  // if (!document.getElementById("image-modal")) {
  //   const modal = document.createElement("div");
  //   modal.id = "image-modal";
  //   modal.style.display = "none";
  //   modal.style.position = "fixed";
  //   modal.style.top = "0";
  //   modal.style.left = "0";
  //   modal.style.width = "100%";
  //   modal.style.height = "100%";
  //   modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  //   modal.style.zIndex = "1000";
  //   modal.style.justifyContent = "center";
  //   modal.style.alignItems = "center";

  //   const modalImage = document.createElement("img");
  //   modalImage.id = "modal-image";
  //   modalImage.style.maxWidth = "90%";
  //   modalImage.style.maxHeight = "90%";
  //   modalImage.style.borderRadius = "10px";

  //   const closeModal = document.createElement("span");
  //   closeModal.textContent = "✖";
  //   closeModal.style.position = "absolute";
  //   closeModal.style.top = "20px";
  //   closeModal.style.right = "20px";
  //   closeModal.style.color = "white";
  //   closeModal.style.fontSize = "30px";
  //   closeModal.style.cursor = "pointer";

  //   closeModal.addEventListener("click", () => {
  //     modal.style.display = "none";
  //   });

  //   modal.appendChild(modalImage);
  //   modal.appendChild(closeModal);
  //   document.body.appendChild(modal);
  // }
}

// Function to open the image in a modal
// function openImageModal(imageUrl) {
//   const modal = document.getElementById("image-modal");
//   const modalImage = document.getElementById("modal-image");

//   modalImage.src = imageUrl;
//   modal.style.display = "flex";
// }

function renderAudio(exhibit) {
  const content = document.querySelector("#content");

  // Extract the audioURL and longDescription from the first species in the array
  const audioURL = exhibit.species.length > 0 ? exhibit.species[0].audioURL : "";
  const longDescription = exhibit.species.length > 0 ? exhibit.species[0].longDescription : "";

  // Clear existing content
  content.innerHTML = "";

  // Add exhibit name
  const title = document.createElement("h2");
  title.textContent = `You're listening to the audio guide for: "${exhibit["exhibit-name"]}"`;
  content.appendChild(title);

  // Add the audio controls container
  const audioContainer = document.querySelector("#audio-container");
  audioContainer.style.display = "block"; // Ensure it's visible
  content.appendChild(audioContainer); // Move it inside the content container

  // Add the description below the audio container
  const description = document.createElement("p");
  description.textContent = longDescription || "We recommend using headphones to get the most out of this audio guide.";
  description.style.marginTop = "20px"; // Optional: Add some spacing
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
  const speciesId = urlParams.get("species-id");

  // Show the back button only if species-id is present
  const backButtonContainer = document.getElementById("back-button-container");
  if (speciesId) {
    backButtonContainer.style.display = "block";
  }
}
);

// function renderBlog(blog) {
//   console.log("Rendering blog:", blog); // Debug: Log blog being rendered
//   const content = document.querySelector("#content");

//   // Clear the existing content
//   content.innerHTML = "";

//   // Create a container for blog content
//   const blogContainer = document.createElement("div");
//   blogContainer.classList.add("blog-container");

//   // Add blog details
//   const details = document.createElement("div");
//   details.classList.add("blog-details");
//   details.innerHTML = `
//     <h2>${blog.title}</h2>
//     <p><b>By:</b> ${blog.author || "Anonymous"}</p>
//     <p><b>Published on:</b> ${blog.publishedDate || "Unknown"}</p>
//     <br>
//     <p>${blog.content || "This blog is currently unavailable."}</p>
//   `;

//   // Add external links
//   if (blog.readMoreURL) {
//     const readMoreButton = document.createElement("a");
//     readMoreButton.href = blog.readMoreURL;
//     readMoreButton.textContent = "Read More";
//     readMoreButton.classList.add("action-button");
//     readMoreButton.target = "_blank"; // Open link in a new tab
//     details.appendChild(readMoreButton);
//   }

//   // Append the details to the container
//   blogContainer.appendChild(details);

//   // Add the container to the content
//   content.appendChild(blogContainer);

//   // Reapply the theme
//   fetch("./assets/data/config.json")
//     .then((response) => response.json())
//     .then((config) => {
//       console.log("Reapplying theme for blog content");
//       applyTheme(config.theme);
//     })
//     .catch((error) => {
//       console.error("Error reapplying theme:", error);
//     });
// }

// function handleBlogView(data, blogId) {
//   const blogData = data.blogs.find((blog, index) => index == blogId); // Or use a unique `blogId` field if available

//   if (blogData) {
//     renderBlog(blogData);
//   } else {
//     console.error(`No blog found with ID: ${blogId}`);
//     updateTitleAndContent("Blog Not Found", `No blog found with ID: ${blogId}.`);
//   }
// }

// document.addEventListener("DOMContentLoaded", () => {
//   fetch("./assets/data/blogs.json")
//     .then((response) => response.json())
//     .then((data) => {
//       // Example of rendering the first blog
//       handleBlogView(data, 0); // Pass the first blog (index 0)
//     })
//     .catch((error) => {
//       console.error("Error fetching data:", error);
//     });
// });


// function renderVideo(exhibit) {
//   const content = document.querySelector("#content");

//   // Extract the videoURL and longDescription from the first species in the array
//   const videoURL = exhibit.species.length > 0 ? exhibit.species[0].videoURL : "";
//   const longDescription = exhibit.species.length > 0 ? exhibit.species[0].longDescription : "";

//   // Clear existing content
//   content.innerHTML = "";

//   // Add exhibit name
//   const title = document.createElement("h2");
//   title.textContent = `You're watching: "${exhibit["exhibit-name"]}"`;
//   content.appendChild(title);

//   // Add the video controls container
//   const videoContainer = document.querySelector("#video-container");
//   videoContainer.style.display = "block"; // Ensure it's visible
//   content.appendChild(videoContainer); // Move it inside the content container

//   // Add the description below the video container
//   const description = document.createElement("p");
//   description.textContent = longDescription || "Enjoy this video about the exhibit.";
//   description.style.marginTop = "20px"; // Optional: Add some spacing
//   content.appendChild(description);

//   // Video functionality
//   const videoPlayer = document.querySelector("#video-player");
//   const videoSource = document.querySelector("#video-source");
//   const videoStatus = document.querySelector("#video-status");

//   if (videoURL) {
//     videoSource.src = videoURL;
//     videoPlayer.load(); // Reload video with the new source

//     // Update status when the video is playing
//     videoPlayer.addEventListener("play", () => {
//       videoStatus.textContent = "Now playing...";
//     });

//     // Update status when the video is paused
//     videoPlayer.addEventListener("pause", () => {
//       videoStatus.textContent = "Paused";
//     });

//     // Update status when the video ends
//     videoPlayer.addEventListener("ended", () => {
//       videoStatus.textContent = "Video ended.";
//     });
//   } else {
//     videoContainer.style.display = "none";
//     description.textContent = "No video available for this exhibit.";
//   }
// }

// // Function to extract exhibit ID from the URL query string
// function getExhibitIdFromURL() {
//   const params = new URLSearchParams(window.location.search);
//   return params.get("exhibit-id");
// }

// document.addEventListener("DOMContentLoaded", () => {
//   const exhibitId = getExhibitIdFromURL(); // Use the function here
//   fetch(`./assets/data/data.json?nocache=${new Date().getTime()}`)
//     .then((response) => response.json())
//     .then((data) => {
//       handleExhibitView(data, exhibitId);
//     })
//     .catch((error) => {
//       console.error("Error fetching data:", error);
//     });
// });