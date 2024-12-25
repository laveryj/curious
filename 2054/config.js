document.addEventListener("DOMContentLoaded", () => {
  const configUrl = "./config.json"; // Path to the config.json file

  fetch(configUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((config) => {
      applyTheme(config.theme);
      document.body.classList.remove("hidden"); // Show the page after theme is applied
    })
    .catch((error) => {
      console.error("Error loading configuration:", error);
      document.body.classList.remove("hidden"); // Show the page even if there’s an error
    });
});

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

  console.log("Theme applied:", theme); // Debug: Log the applied theme
}