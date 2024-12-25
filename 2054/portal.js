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

  //Function to download QR Codes
    document.addEventListener("DOMContentLoaded", () => {
      const configUrl = "./data.json"; // Path to the data.json file
      const exhibitSelect = document.getElementById("exhibit-select");
      const generateQrButton = document.getElementById("generate-qr");
      const generateAllQrButton = document.getElementById("generate-all-qr");
      const qrCodeCanvas = document.getElementById("qr-code");
      const downloadQrButton = document.getElementById("download-qr");

      // Load exhibits from the data.json file
      fetch(configUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          populateExhibits(data.exhibits);
        })
        .catch((error) => {
          console.error("Error loading exhibits:", error);
        });

      function populateExhibits(exhibits) {
        exhibits.forEach((exhibit) => {
          const option = document.createElement("option");
          option.value = exhibit["exhibit-id"];
          option.textContent = exhibit["exhibit-name"];
          exhibitSelect.appendChild(option);
        });

        exhibitSelect.disabled = false;
      }

      // Enable button only when an exhibit is selected
      exhibitSelect.addEventListener("change", () => {
        generateQrButton.disabled = exhibitSelect.value === "";
      });

      // Generate QR code for the selected exhibit
      generateQrButton.addEventListener("click", () => {
        const exhibitId = exhibitSelect.value;
        if (!exhibitId) {
          alert("Please select an exhibit.");
          return;
        }

        // Define the URL for the selected exhibit
        const url = `${window.location.origin}/2054/index.html?exhibit-id=${exhibitId}`;
        console.log("Generating QR code for:", url);

        // Create QR code
        const qr = new QRious({
          element: qrCodeCanvas,
          value: url,
          size: 200,
        });

        // Show the download button
        downloadQrButton.style.display = "block";
      });

      // Allow downloading the QR code as an image
      downloadQrButton.addEventListener("click", () => {
      const exhibitId = exhibitSelect.value; // Get the selected exhibit ID
      const selectedOption = exhibitSelect.options[exhibitSelect.selectedIndex]; // Get the selected option
      const exhibitName = selectedOption.text; // Extract the exhibit name

      const dataUrl = qrCodeCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Curious-QRCode-${exhibitId}-${exhibitName.replace(/ /g, "_")}.png`; // Dynamically name the file
      link.click();
      });

      // Generate QR codes for all exhibits and create a zip file
      generateAllQrButton.addEventListener("click", () => {
        fetch(configUrl)
          .then((response) => response.json())
          .then((data) => {
            const zip = new JSZip();
            const exhibitPromises = data.exhibits.map((exhibit) => {
              return new Promise((resolve) => {
                const qrCanvas = document.createElement("canvas");
                new QRious({
                  element: qrCanvas,
                  value: `${window.location.origin}/2054/index.html?exhibit-id=${exhibit["exhibit-id"]}`,
                  size: 200,
                });

                qrCanvas.toBlob((blob) => {
                    zip.file(`Curious-QRCode-${exhibit["exhibit-id"]}-${exhibit["exhibit-name"].replace(/ /g, "_")}.png`, blob);
                    resolve();
                });
              });
            });

            Promise.all(exhibitPromises).then(() => {
              zip.generateAsync({ type: "blob" }).then((content) => {
                saveAs(content, "Curious-QRCodes.zip");
              });
            });
          })
          .catch((error) => {
            console.error("Error generating QR codes:", error);
          });
      });
    });