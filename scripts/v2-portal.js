document.addEventListener("DOMContentLoaded", () => {
    const configUrl = "./assets/data/config.json"; // Path to the config.json file
    const dataUrl = "./assets/data/data.json"; // Path to the data.json file
    const exhibitSelect = document.getElementById("exhibit-select");
    const generateQrButton = document.getElementById("generate-qr");
    const generateAllQrButton = document.getElementById("generate-all-qr");
    const qrCodeCanvas = document.getElementById("qr-code");
    const downloadQrButton = document.getElementById("download-qr");
    const viewAllSpeciesButton = document.getElementById("view-all-species");
    const viewAnalyticsButton = document.getElementById("view-analytics");
    const logoutButton = document.getElementById("logout-button");

    // Load site information from config.json
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
        });

    // Load exhibit data from data.json
    fetch(dataUrl)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            populateExhibitTable(data.exhibits);
            populateExhibitDropdown(data.exhibits);
        })
        .catch((error) => {
            console.error("Error loading exhibit data:", error);
        });

    // Populate site info section
    function populateSiteInfo(config) {
        const siteInfoContent = document.getElementById("site-info-content");
        if (siteInfoContent) {
            siteInfoContent.innerHTML = `
                <table>
                    <tr><td><strong>Site ID:</strong></td><td>${config.siteid}</td></tr> <!-- Updated key -->
                    <tr><td><strong>Site Name:</strong></td><td>${config.siteName}</td></tr>
                    <tr><td><strong>Company:</strong></td><td>${config.company}</td></tr>
                    <tr><td><strong>Pricing Tier:</strong></td><td>${config.subscription}</td></tr> <!-- Updated key -->
                    <tr><td><strong>Address:</strong></td><td>${config.address || "Not provided"}</td></tr>
                    <tr><td><strong>Contact:</strong></td><td>${config.contact || "Not provided"}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${config.email}</td></tr>
                    <tr><td><strong>Phone:</strong></td><td>${config.phone}</td></tr>
                    <tr><td><strong>Language:</strong></td><td>${config.language}</td></tr>
                </table>
            `;
        } else {
            console.error("Site Info section not found in the document.");
        }
    }

    // Populate exhibits table
    function populateExhibitTable(exhibits) {
        const tableBody = document.getElementById("exhibits-table-body");
        if (!tableBody) {
            console.error("Exhibits table body not found in the document.");
            return;
        }
        tableBody.innerHTML = exhibits
            .map((exhibit) => `
                <tr>
                    <td>${exhibit.exhibitID}</td> <!-- Updated key -->
                    <td><a href="./index.html?exhibit-id=${exhibit.exhibitID}" style="text-decoration: none; color: inherit;">${exhibit.exhibitName}</a></td> <!-- Updated key -->
                    <td>${exhibit.objects ? exhibit.objects.length : 0}</td>
                </tr>
            `)
            .join("");
    }

    // Populate dropdown with exhibits
    function populateExhibitDropdown(exhibits) {
        exhibits.forEach((exhibit) => {
            const option = document.createElement("option");
            option.value = exhibit.exhibitID; <!-- Updated key -->
            option.textContent = exhibit.exhibitName; <!-- Updated key -->
            exhibitSelect.appendChild(option);
        });
        exhibitSelect.disabled = false;
    }

    // Enable QR button when exhibit selected
    if (exhibitSelect && generateQrButton) {
        exhibitSelect.addEventListener("change", () => {
            generateQrButton.disabled = exhibitSelect.value === "";
        });
    }

    // Generate QR code for selected exhibit
    if (generateQrButton) {
        generateQrButton.addEventListener("click", () => {
            const exhibitId = exhibitSelect.value;
            const selectedOption = exhibitSelect.options[exhibitSelect.selectedIndex];
            const exhibitName = selectedOption.text;

            const url = `${window.location.href.replace(/\/[^\/]*$/, '/') + 'index.html?exhibit-id='}${exhibitId}`;
            console.log("Generating QR code for:", url);

            const qr = new QRious({
                element: qrCodeCanvas,
                value: url,
                size: 200,
            });

            downloadQrButton.style.display = "block";
            downloadQrButton.onclick = () => {
                const dataUrl = qrCodeCanvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = dataUrl;
                link.download = `Curious-QRCode-${exhibitId}-${exhibitName.replace(/ /g, "_")}.png`;
                link.click();
            };
        });
    }

    // Generate QR codes for all exhibits
    if (generateAllQrButton) {
        generateAllQrButton.addEventListener("click", () => {
            fetch(dataUrl)
                .then((response) => response.json())
                .then((data) => {
                    const zip = new JSZip();
                    const exhibitPromises = data.exhibits.map((exhibit) => {
                        return new Promise((resolve) => {
                            const qrCanvas = document.createElement("canvas");
                            new QRious({
                                element: qrCanvas,
                                value: `${window.location.href.replace(/\/[^\/]*$/, '/') + 'index.html?exhibit-id='}${exhibit.exhibitID}`, <!-- Updated key -->
                                size: 200,
                            });

                            qrCanvas.toBlob((blob) => {
                                zip.file(
                                    `Curious-QRCode-${exhibit.exhibitID}-${exhibit.exhibitName.replace(/ /g, "_")}.png`, <!-- Updated key -->
                                    blob
                                );
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
    }

    // Open species list page
    if (viewAllSpeciesButton) {
        viewAllSpeciesButton.addEventListener("click", () => {
            window.location.href = "./all-species.html";
        });
    }

        // Open species list page
        if (viewAnalyticsButton) {
            viewAnalyticsButton.addEventListener("click", () => {
                window.location.href = "./analytics.html";
            });
        }

        
        // Add event listener for the logout button
        logoutButton.addEventListener("click", () => {
            console.log("Logging out...");
            sessionStorage.clear();
            localStorage.clear();
            console.log("Session storage cleared:", sessionStorage);
            console.log("Local storage cleared:", localStorage);
            window.location.href = "./portal.html";
        });

});