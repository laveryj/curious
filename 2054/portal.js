// Script to load site data into portal.html from the config.json file

document.addEventListener("DOMContentLoaded", () => {
    const configUrl = "./config.json"; // Path to the config.json file
  
    // Fetch the site configuration details
    fetch(configUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((config) => {
        populateSiteInfo(config);
      })
      .catch((error) => {
        console.error("Error loading site information:", error);
        const siteInfoContent = document.getElementById("site-info-content");
        if (siteInfoContent) {
          siteInfoContent.innerHTML = `<p>Failed to load site information. Please try again later.</p>`;
        }
      });
  });
  
  // Function to populate the Site Info section in a simple table
  function populateSiteInfo(config) {
    const siteInfoContent = document.getElementById("site-info-content");
  
    if (siteInfoContent) {
      siteInfoContent.innerHTML = `
        <table>
          <tr><td><strong>Site ID:</strong></td><td>${config.siteid}</td></tr>
          <tr><td><strong>Site Name:</strong></td><td>${config.siteName}</td></tr>
          <tr><td><strong>Company:</strong></td><td>${config.company}</td></tr>
          <tr><td><strong>Pricing Tier:</strong></td><td>${config.tier}</td></tr>
          <tr><td><strong>Address:</strong></td><td>${config.address || 'Not provided'}</td></tr>
          <tr><td><strong>Contact:</strong></td><td>${config.contactName || 'Not provided'}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${config.email}</td></tr>
          <tr><td><strong>Phone:</strong></td><td>${config.phone}</td></tr>
          <tr><td><strong>Language:</strong></td><td>${config.language}</td></tr>
        </table>
      `;
    } else {
      console.error("Site Info section not found in the document.");
    }
  }