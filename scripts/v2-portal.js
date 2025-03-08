document.addEventListener("DOMContentLoaded", () => {
    const configUrl = "./assets/data/config.json"; // Path to the config.json file
    const versionURL = "../assets/data/version.json"; // Path to the data.json file
    const dataUrl = "./assets/data/data.json"; // Path to the data.json file
    const exhibitSelect = document.getElementById("exhibit-select");
    const generateQrButton = document.getElementById("generate-qr");
    const generateAllQrButton = document.getElementById("generate-all-qr");
    const qrCodeCanvas = document.getElementById("qr-code");
    const downloadQrButton = document.getElementById("download-qr");
    const viewAllSpeciesButton = document.getElementById("view-all-species");
    const viewAnalyticsButton = document.getElementById("view-analytics");
    const viewIDDemoButton = document.getElementById("test-capture");
    const logoutButton = document.getElementById("logout-button");
    const captureWelfareAssessment = document.getElementById("welfare-assessment-tool");
    const viewHistoricWelfareAssessments = document.getElementById("welfare-assessment-history");
  

    // Load site information from config.json
fetch(configUrl)
.then((response) => {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
})
.then((config) => {
    // Fetch version.json after loading config
    fetch(versionURL)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((versionData) => {
            // Add version to config and populate site info
            config.version = versionData.version;
            populateSiteInfo(config);
        })
        .catch((error) => {
            console.error("Error loading version information:", error);
            populateSiteInfo(config); // Populate without version if it fails
        });
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
            <tr><td><strong>Site ID:</strong></td><td>${config.siteid}</td></tr>
            <tr><td><strong>Site Name:</strong></td><td>${config.siteName}</td></tr>
            <tr><td><strong>Address:</strong></td><td>${config.address || ""}</td></tr>
            <tr><td><strong>Contact:</strong></td><td>${config.contact || ""}</td></tr>
            <tr><td><strong>Company:</strong></td><td>${config.company}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${config.email}</td></tr>
            <tr><td><strong>Phone:</strong></td><td>${config.phone}</td></tr>
            <tr><td><strong>Language:</strong></td><td>${config.language}</td></tr>
            <tr><td><strong>Subscription:</strong></td><td>${config.subscription}</td></tr>
            <tr><td><strong>Version:</strong></td><td>Curious ${config.version || "Not available"}</td></tr>
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
                    <td><a href="./index.html?EID=${exhibit.exhibitID}" style="text-decoration: none; color: inherit;">${exhibit.exhibitName}</a></td> <!-- Updated key -->
                    <td>${exhibit.objects ? exhibit.objects.length : 0}</td>
                </tr>
            `)
            .join("");
    }

    // Populate dropdown with exhibits
    function populateExhibitDropdown(exhibits) {
        exhibits.forEach((exhibit) => {
            const option = document.createElement("option");
            option.value = exhibit.exhibitID;
            option.textContent = exhibit.exhibitName;
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

            // const url = `${window.location.href.replace(/\/[^\/]*$/, '/') + 'index.html?exhibit-id='}${exhibitId}`;
            const url = `${window.location.href.replace(/\/[^\/]*$/, '/') + 'index.html?EID='}${exhibitId}`;
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
                                // value: `${window.location.href.replace(/\/[^\/]*$/, '/') + 'index.html?exhibit-id='}${exhibit.exhibitID}`, <!-- Updated key -->
                                value: `${window.location.href.replace(/\/[^\/]*$/, '/') + 'index.html?EID='}${exhibit.exhibitID}`,
                                size: 200,
                            });

                            qrCanvas.toBlob((blob) => {
                                zip.file(
                                    `Curious-QRCode-${exhibit.exhibitID}-${exhibit.exhibitName.replace(/ /g, "_")}.png`,
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

    // Open Fish ID demo page
    if (viewIDDemoButton) {
      viewIDDemoButton.addEventListener("click", () => {
          window.location.href = "./capture.html";
      });
  }

      // Open Welfare Assessment history  page
      if (viewHistoricWelfareAssessments) {
        viewHistoricWelfareAssessments.addEventListener("click", () => {
            window.location.href = "./assessment-history.html";
        });
    }

        // Start welfare assessment button
        if (captureWelfareAssessment) {
          captureWelfareAssessment.addEventListener("click", () => {
              window.location.href = "./assessment.html";
          });
      }

        // // Open analytics page
        if (viewAnalyticsButton) {
            viewAnalyticsButton.addEventListener("click", () => {
                window.location.href = "./analytics.html";
            });
        }
        
        // Add event listener for the logout button
        document.getElementById("logout-button").addEventListener("click", () => {
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("authSiteId");
          window.location.href = "/signin.html";
        });

});

// document.addEventListener("DOMContentLoaded", () => {
//   const configPath = "./assets/data/config.json"; // Path to your config.json
//   const viewAnalyticsButton = document.getElementById("view-analytics");

//   if (viewAnalyticsButton) {
//     viewAnalyticsButton.addEventListener("click", () => {
//       // Fetch the subscription tier from config.json
//       fetch(configPath)
//         .then(response => {
//           if (!response.ok) {
//             throw new Error(`Failed to load config.json: ${response.statusText}`);
//           }
//           return response.json();
//         })
//         .then(data => {
//           if (data.subscription === "Monetise") {
//             // Redirect to analytics page if tier is Monetise
//             window.location.href = "./analytics.html";
//           } else {
//             // Show pop-up for non-Monetise tiers
//             alert("This feature is available for premium users. Please upgrade to access the Analytics Dashboard.");
//           }
//         })
//         .catch(error => {
//           console.error("Error loading or parsing config.json:", error);
//           alert("An error occurred while checking your subscription. Please try again later.");
//         });
//     });
//   } else {
//     console.error("Button with ID 'view-analytics' not found.");
//   }
// });

document.addEventListener("DOMContentLoaded", () => {
    const configPath = "./assets/data/config.json"; // Path to your config.json
    const pricingPath = "../assets/data/pricing.json"; // Path to pricing.json
    const viewAnalyticsButton = document.getElementById("view-analytics");
  
    if (viewAnalyticsButton) {
      viewAnalyticsButton.addEventListener("click", () => {
        Promise.all([
          fetch(configPath).then(response => response.json()),
          fetch(pricingPath).then(response => response.json())
        ])
          .then(([configData, pricingData]) => {
            if (configData.subscription === "Monetise") {
              // Redirect to analytics page if tier is Monetise
              window.location.href = "./analytics.html";
            } else {
              // Show modal for non-Monetise tiers
              showUpgradeModal(configData.subscription, pricingData);
            }
          })
          .catch(error => {
            console.error("Error loading config or pricing data:", error);
            showErrorModal("An error occurred while checking your subscription. Please try again later.");
          });
      });
    } else {
      console.error("Button with ID 'view-analytics' not found.");
    }
  
    // Function to show the upgrade modal
    function showUpgradeModal(currentSubscription, pricingData) {
        const tiers = [
          { name: "Discover", price: pricingData.Discover, perVisitor: Math.round((pricingData.Discover / (pricingData.footfall / 12)) * 100) },
          { name: "Engage", price: pricingData.Engage, perVisitor: Math.round((pricingData.Engage / (pricingData.footfall / 12)) * 100) },
          { name: "Monetise", price: pricingData.Monetise, perVisitor: Math.round((pricingData.Monetise / (pricingData.footfall / 12)) * 100) }
        ];
  
      // Determine the index of the user's current tier
      const tierIndex = tiers.findIndex(tier => tier.name.toLowerCase() === currentSubscription.toLowerCase());
      const currentTier = tiers[tierIndex];
      const higherTiers = tiers.slice(tierIndex + 1); // Only tiers above the current subscription
      const shortFootfall = `${Math.round(pricingData.footfall / 1000)}k`; // Convert footfall to "100k" format

      // Build modal content dynamically
      const modal = document.createElement("div");
      modal.id = "upgrade-modal";
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close-button">&times;</span>
          <h2>Upgrade to access the Analytics Dashboard!</h2>
          <p>The analytics dashboard is available on the Monetise plan. See your current subscription and explore upgrades below:</p>
          <div class="pricing-cards-container">
            <!-- Current Tier -->
            <div class="pricing-card current-tier">
            <h3>Current Plan: ${currentTier.name}</h3>
            <b><span>£${currentTier.price}</span>/month</b><br><br>
            <i>${currentTier.perVisitor}p per visitor at ${shortFootfall} annual visitors!</i>
            <ul>
                ${currentTier.name === "Discover" ? `
                  <li><i class="fas fa-check-circle"></i> Basic species profiles</li>
                  <li><i class="fas fa-check-circle"></i> Show talk times & feeds</li>
                  <li><i class="fas fa-check-circle"></i> Interactive site map</li>
                ` : ""}
                ${currentTier.name === "Engage" ? `
                  <li><i class="fas fa-check-circle"></i> All features of Discover</li>
                  <li><i class="fas fa-check-circle"></i> Rich species profiles</li>
                  <li><i class="fas fa-check-circle"></i> Built-in audio guide</li>
                  <li><i class="fas fa-check-circle"></i> Add videos, blogs & quizzes</li>
                  <li><i class="fas fa-check-circle"></i> Meet the Team profiles</li>
                ` : ""}
              </ul>
            </div>

            <!-- Higher Tiers -->
            ${higherTiers
              .map(
                tier => `
                <div class="pricing-card">
                  <h3>${tier.name}</h3>
                  <b><span>£${tier.price}</span>/month</b><br><br>
                  <i>Just ${tier.perVisitor}p per visitor at ${shortFootfall} annual visitors!</i>
                  <ul>
                    ${tier.name === "Engage" ? `
                      <li><i class="fas fa-check-circle"></i> All features of Discover</li>
                      <li><i class="fas fa-check-circle"></i> Rich species profiles</li>
                      <li><i class="fas fa-check-circle"></i> Built-in audio guide</li>
                      <li><i class="fas fa-check-circle"></i> Add videos, blogs & quizzes</li>
                      <li><i class="fas fa-check-circle"></i> Meet the Team profiles</li>
                    ` : ""}
                    ${tier.name === "Monetise" ? `
                      <li><i class="fas fa-check-circle"></i> All features of Engage</li>
                      <li><i class="fas fa-check-circle"></i> Sell access to Curious</li>
                      <li><i class="fas fa-check-circle"></i> Sell annual passes</li>
                      <li><i class="fas fa-check-circle"></i> Sell feeds & experiences</li>
                      <li><i class="fas fa-check-circle"></i> View advanced analytics</li>
                      <li><i class="fas fa-check-circle"></i> Built-in content optimisation</li>
                    ` : ""}
                  </ul>
                  <a href="signup-${tier.name.toLowerCase()}.html" class="button">Upgrade to ${tier.name}</a>
                </div>
              `
              )
              .join("")}
          </div>
        </div>
      `;
      document.body.appendChild(modal);
  
      // Add functionality to close the modal
      const closeButton = modal.querySelector(".close-button");
      closeButton.addEventListener("click", () => {
        modal.remove();
      });
  
      // Add styling for the modal
      const style = document.createElement("style");
      style.innerHTML = `
        #upgrade-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5); /* Darker overlay with opacity */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.35); /* Slightly transparent white background */
  width: 90%; /* Increased width */
  max-width: 1200px; /* Allow for more horizontal space */
  text-align: center;
  position: relative;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  cursor: pointer;
}

.pricing-cards-container {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 20px;
  flex-wrap: nowrap; /* Prevents wrapping of pricing cards */
  overflow-x: auto; /* Allows horizontal scrolling on smaller screens */
}

.pricing-card {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  width: 28%; /* Adjusted width to fit more cards in one row */
  min-width: 250px; /* Ensures cards don’t become too small */
  text-align: left;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.current-tier {
  border: 2px solid #007bff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.pricing-card h3 {
  margin-bottom: 10px;
}

.pricing-card ul {
  list-style: none;
  padding: 0;
}

.pricing-card li {
  margin: 5px 0;
}

.button {
  display: inline-block;
  margin-top: 10px;
  padding: 10px 15px;
  background: #007bff;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
}

.button:hover {
  background: #0056b3;
}
      `;
      document.head.appendChild(style);
    }
  
    // Function to show an error modal
    function showErrorModal(message) {
      const modal = document.createElement("div");
      modal.id = "error-modal";
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close-button">&times;</span>
          <h2>Error</h2>
          <p>${message}</p>
        </div>
      `;
      document.body.appendChild(modal);
  
      const closeButton = modal.querySelector(".close-button");
      closeButton.addEventListener("click", () => {
        modal.remove();
      });
    }
    
  });

  document.addEventListener("DOMContentLoaded", function () {
    const docsList = document.getElementById("docs-list");
  
    fetch("./assets/data/docs.json")
      .then(response => response.json())
      .then(docs => {
        docs.forEach(doc => {
          const listItem = document.createElement("li");
          const link = document.createElement("a");
          link.href = `./assets/docs/${doc.file}`;
          link.textContent = doc.name;
          link.target = "_blank"; // Opens in a new tab
          listItem.appendChild(link);
          docsList.appendChild(listItem);
        });
      })
      .catch(error => {
        console.error("Error loading documents:", error);
        docsList.innerHTML = "<li>Error loading documents</li>";
      });
  });

  // Welfare assessments

  document.addEventListener("DOMContentLoaded", async () => {
    console.log("📡 Fetching assessments...");
    const statusMessage = document.getElementById("status-message");
    const tableBody = document.querySelector("#assessments-table tbody");
    const downloadButton = document.getElementById("download-csv");

    try {
      const response = await fetch("https://get-curio.us/api/view-welfare-assessments/");
      if (!response.ok) throw new Error("Failed to load assessments");

      const { data: assessments } = await response.json();
      
      tableBody.innerHTML = "";
      statusMessage.style.display = "none"; // Hide loading message

      if (assessments.length === 0) {
        statusMessage.textContent = "No assessments available.";
        statusMessage.classList.remove("loading");
        statusMessage.classList.add("error");
        return;
      }

      const groupedAssessments = {};
      const allQuestions = new Set();

      // Group assessments by assessment_id and collect unique questions
      assessments.forEach(assessment => {
        const id = assessment.assessment_id;
        if (!groupedAssessments[id]) {
          groupedAssessments[id] = {
            AssessmentID: id,
            Animal: assessment.animal,
            Auditor: assessment.auditor_name,
            Role: assessment.auditor_role,
            Date: new Date(assessment.start_time).toLocaleDateString(),
            Start: new Date(assessment.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            End: new Date(assessment.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            Questions: {},
            ReportURL: assessment.file_url
          };
        }
        groupedAssessments[id].Questions[assessment.question] = assessment.answer;
        allQuestions.add(assessment.question);
      });

      // Convert Set to sorted array
      const sortedQuestions = Array.from(allQuestions).sort();

      // Create table rows dynamically
      Object.values(groupedAssessments).forEach(assessment => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${assessment.AssessmentID}</td>
          <td>${assessment.Animal}</td>
          <td>${assessment.Auditor}</td>
          <td>${assessment.Role}</td>
          <td>${assessment.Date}</td>
          <td>${assessment.Start}</td>
          <td>${assessment.End}</td>
          <td>${assessment.ReportURL !== "No Report" ? `<a href="${assessment.ReportURL}" target="_blank">View Report</a>` : "No Report"}</td>
        `;
        tableBody.appendChild(row);
      });

      // Show download button
      downloadButton.style.display = "block";
      downloadButton.addEventListener("click", () => downloadCSV(groupedAssessments, sortedQuestions));

    } catch (error) {
      console.error("❌ Error loading assessments:", error);
      statusMessage.textContent = "Error loading assessments. Please try again later.";
      statusMessage.classList.remove("loading");
      statusMessage.classList.add("error");
    }
  });

  function downloadCSV(groupedAssessments, sortedQuestions) {
let csvContent = "data:text/csv;charset=utf-8,";
let headers = ["Assessment ID", "Animal", "Auditor", "Role", "Date", "Start", "End", ...sortedQuestions];

// Convert header array to CSV format (comma-separated)
csvContent += headers.map(h => `"${h}"`).join(",") + "\n";

// Build CSV rows
Object.values(groupedAssessments).forEach(assessment => {
  let row = [
    assessment.AssessmentID,
    assessment.Animal,
    assessment.Auditor,
    assessment.Role,
    assessment.Date,
    assessment.Start,
    assessment.End
  ];

  // Add answers in the correct question order
  sortedQuestions.forEach(question => {
    let answer = assessment.Questions[question] || ""; // Fill empty responses with blank
    row.push(`"${answer}"`); // Enclose text in double quotes
  });

  csvContent += row.join(",") + "\n";
});

// Trigger CSV download
const encodedUri = encodeURI(csvContent);
const link = document.createElement("a");
link.setAttribute("href", encodedUri);
link.setAttribute("download", "Curious-Welfare_assessment_data.csv");
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
}

document.addEventListener("DOMContentLoaded", function () {
  const buttons = document.querySelectorAll(".nav-button");
  const sections = document.querySelectorAll(".content-section");

  buttons.forEach(button => {
    button.addEventListener("click", function (event) {
      event.preventDefault(); // ✅ Stops default behavior

      // Hide all sections
      sections.forEach(section => section.classList.remove("active"));

      // Get the target section and show it
      const targetId = this.getAttribute("data-target");
      document.getElementById(targetId).classList.add("active");
    });
  });

// Scroll to top when the page loads
window.scrollTo(0, 0);
});
