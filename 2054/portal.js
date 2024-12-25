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

  // Function to display list of exhibits
  document.addEventListener("DOMContentLoaded", () => {
    const dataUrl = "./data.json"; // Path to the data.json file
  
    // Fetch exhibit data
    fetch(dataUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        populateExhibitTable(data.exhibits);
      })
      .catch((error) => {
        console.error("Error loading exhibit data:", error);
        const tableBody = document.getElementById("exhibits-table-body");
        if (tableBody) {
          tableBody.innerHTML = `<tr><td colspan="3">Failed to load exhibits. Please try again later.</td></tr>`;
        }
      });
  });
  
  function populateExhibitTable(exhibits) {
    const tableBody = document.getElementById("exhibits-table-body");
  
    if (!tableBody) {
      console.error("Exhibits table body not found in the document.");
      return;
    }
  
    // Clear existing content
    tableBody.innerHTML = "";
  
    if (!exhibits || exhibits.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="3">No exhibits found for this site.</td></tr>`;
      return;
    }
  
    // Create table rows for each exhibit
    exhibits.forEach((exhibit) => {
      const row = document.createElement("tr");
  
      // Exhibit ID
      const idCell = document.createElement("td");
      idCell.textContent = exhibit["exhibit-id"];
      row.appendChild(idCell);
  
      // Exhibit Name (clickable link)
      const nameCell = document.createElement("td");
      const exhibitLink = document.createElement("a");
      exhibitLink.href = `index.html?exhibit-id=${exhibit["exhibit-id"]}`;
      exhibitLink.textContent = exhibit["exhibit-name"];
      exhibitLink.style.textDecoration = "none";
      exhibitLink.style.color = "inherit";
      nameCell.appendChild(exhibitLink);
      row.appendChild(nameCell);
  
      // Active Species (count)
      const speciesCountCell = document.createElement("td");
      speciesCountCell.textContent = exhibit.species ? exhibit.species.length : 0;
      row.appendChild(speciesCountCell);
  
      tableBody.appendChild(row);
    });
  }