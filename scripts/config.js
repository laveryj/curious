document.addEventListener("DOMContentLoaded", () => {
  const configUrl = "./assets/data/config.json"; // Path to the config.json file

  fetch(configUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((config) => {
      applyTheme(config.theme);
      displaySiteInfo(config);
      document.body.classList.remove("hidden"); // Show the page after content is loaded
    })
    .catch((error) => {
      console.error("Error loading configuration:", error);
      document.body.classList.remove("hidden"); // Show the page even if there’s an error
    });
});

function displaySiteInfo(config) {
  const talkTimesTable = document.getElementById("talk-times-table");
  const experiencesTable = document.getElementById("experiences-table");

  // Populate Talk Times
  if (config.talkTimes && config.talkTimes.length > 0) {
    talkTimesTable.innerHTML = `
      <thead>
        <tr>
        </tr>
      </thead>
      <tbody>
        ${config.talkTimes
          .map(
            (talk) =>
              `<tr>
                <td>${talk.name}</td>
                <td>${talk.time}</td>
              </tr>`
          )
          .join("")}
      </tbody>
    `;
  } else {
    talkTimesTable.innerHTML = `<p>No talk times available.</p>`;
  }

  // Populate Experiences
  if (config.experiences && config.experiences.length > 0) {
    experiencesTable.innerHTML = `
      <thead>
        <tr>
        </tr>
      </thead>
      <tbody>
        ${config.experiences
          .map(
            (experience) =>
              `<tr>
                <td>${experience.name}</td>
                <td>${experience.price}</td>
              </tr>`
          )
          .join("")}
      </tbody>
    `;
  } else {
    experiencesTable.innerHTML = `<p>No experiences available.</p>`;
  }
}

function applyTheme(theme) {
  if (!theme) {
    console.error("Theme data is missing in config.json.");
    return;
  }

  // Apply background color
  document.body.style.backgroundColor = theme.backgroundColor;

  // Apply header color
  const header = document.querySelector("header");
  if (header) {
    header.style.backgroundColor = theme.headerColor;
  }

  // Apply logo
  const logo = document.getElementById("site-logo");
  if (logo && theme.logoPath) {
    logo.src = theme.logoPath;
    logo.style.display = "block"; // Ensure the logo is visible
  }

  // Apply text color
  document.body.style.color = theme.textColor;

  // Apply link color
  const links = document.querySelectorAll("a");
  links.forEach((link) => {
    link.style.color = theme.linkColor;
  });

  // Apply card color
  const cards = document.querySelectorAll(".card");
  cards.forEach((card) => {
    card.style.backgroundColor = theme.cardColor;
  });

  // Apply footer color (match header)
  const footer = document.querySelector("footer");
  if (footer) {
    footer.style.backgroundColor = theme.headerColor;
  }

  // Apply button styles
  const buttons = document.querySelectorAll(".action-button, button");
  buttons.forEach((button) => {
    button.style.backgroundColor = theme.headerColor; // Match button background to header
    button.style.color = theme.buttonTextColor; // Set button text color
    button.style.border = `1px solid ${theme.headerColor}`; // Optional: Border matches header
    button.style.borderRadius = "8px"; // Rounded corners
    button.style.padding = "10px 20px"; // Add some padding
    button.style.fontSize = "1rem"; // Match font size
    button.style.cursor = "pointer"; // Pointer cursor
    button.style.transition = "background-color 0.3s ease, transform 0.2s ease"; // Smooth hover effect

    // Add hover and active effects
    button.addEventListener("mouseover", () => {
      button.style.filter = "brightness(1.1)"; // Slightly brighter on hover
      button.style.transform = "scale(1.05)"; // Slightly larger
    });

    button.addEventListener("mouseout", () => {
      button.style.filter = "brightness(1.0)";
      button.style.transform = "scale(1.0)";
    });

    button.addEventListener("mousedown", () => {
      button.style.transform = "scale(0.98)"; // Slightly smaller on click
    });

    button.addEventListener("mouseup", () => {
      button.style.transform = "scale(1.0)";
    });
  });

  console.log("Theme applied:", theme); // Debug: Log the applied theme
}