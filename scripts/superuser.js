document.addEventListener("DOMContentLoaded", () => {
  const configUrl = "/assets/data/su-config.json"; // Ensure the correct path
  const loginContainer = document.getElementById("login-container");
  const portalContent = document.getElementById("portal-content");
  const loginButton = document.getElementById("login-button");
  const loginError = document.getElementById("login-error");

  // Fetch the configuration and authenticate
  fetch(configUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load config.json: ${response.status}`);
      }
      return response.json();
    })
    .then((config) => {
      setupAuthentication(config.user, config.password);
      loadSiteInfo();
    })
    .catch((error) => {
      console.error("Error loading configuration:", error);
    });

  function setupAuthentication(username, password) {
    loginContainer.style.display = "flex";
    portalContent.style.display = "none";

    loginButton.addEventListener("click", () => {
      const enteredUsername = document.getElementById("username").value.trim();
      const enteredPassword = document.getElementById("password").value.trim();

      if (enteredUsername === username && enteredPassword === password) {
        loginContainer.style.display = "none";
        portalContent.style.display = "block";
      } else {
        loginError.style.display = "block";
      }
    });
  }

  async function loadSiteInfo() {
    const siteInfoContent = document.querySelector(".su-site-info-content");

    try {
      const response = await fetch("/assets/data/site-list.json");
      if (!response.ok) {
        throw new Error(`Failed to fetch sites list: ${response.status}`);
      }

      const data = await response.json();
      const siteDetails = await Promise.all(
        data.sites.map(async (siteId) => {
          try {
            const configResponse = await fetch(`/${siteId}/assets/data/config.json`);
            if (!configResponse.ok) {
              throw new Error(`Failed to fetch config for site ${siteId}`);
            }
            const config = await configResponse.json();
            return {
              siteId,
              name: config.siteName || "Unknown",
              address: config.address || "Unknown",
              contact: config.contact || "Unknown",
              email: config.email || "Unknown",
              phone: config.phone || "Unknown",
              status: config.status || "Unknown",
              company: config.company || "Unknown",
              databaseid: config.databaseid || "Unknown",
              tier: config.tier || "Unknown",
            };
          } catch (error) {
            console.error(`Error loading config for site ${siteId}:`, error);
            return {
              siteId,
              name: "Error loading site",
              address: "-",
              contact: "-",
              email: "-",
              phone: "-",
              status: "-",
              company: "-",
              databaseid: "-",
              tier: "-",
            };
          }
        })
      );

      const tableHTML = `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Site</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Tier</th>
              <th>Status</th>
              <th>DB</th>
            </tr>
          </thead>
          <tbody>
            ${siteDetails
              .map(
                (site) => `
                  <tr>
                    <td>${site.siteId}</td>
                    <td><a href="/${site.siteId}/portal.html">${site.name} / ${site.company}</a></td>
                    <td>${site.contact}</td>
                    <td>${site.email}</td>
                    <td>${site.address}</td>
                    <td>${site.phone}</td>
                    <td>${site.tier}</td>
                    <td>${site.status}</td>
                    <td><a href="${site.databaseid}" target="_blank">DB link</a></td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      `;

      siteInfoContent.innerHTML = tableHTML;
    } catch (error) {
      console.error("Error loading site information:", error);
      siteInfoContent.innerHTML = "<p>Failed to load site information.</p>";
    }
  }
});