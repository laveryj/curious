document.addEventListener("DOMContentLoaded", () => {
    const loginContainer = document.getElementById("login-container");
    const portalContent = document.getElementById("portal-content");
    const loginButton = document.getElementById("login-button");
    const loginError = document.getElementById("login-error");

    const usernameField = document.getElementById("username");
    const passwordField = document.getElementById("password");

    // Hardcoded credentials
    const SUPERUSER_CREDENTIALS = {
        username: "",
        password: "", // Replace with a secure password
    };

    // Show login screen initially
    loginContainer.style.display = "block";

    loginButton.addEventListener("click", () => {
        const username = usernameField.value.trim();
        const password = passwordField.value.trim();

        if (
            username === SUPERUSER_CREDENTIALS.username &&
            password === SUPERUSER_CREDENTIALS.password
        ) {
            // Authentication successful
            loginContainer.style.display = "none";
            portalContent.style.display = "block";

            // Load site list
            loadSiteList();
        } else {
            // Authentication failed
            loginError.style.display = "block";
        }
    });

    document.addEventListener("DOMContentLoaded", () => {
        const loginContainer = document.getElementById("login-container");
        const portalContent = document.getElementById("portal-content");
        const loginButton = document.getElementById("login-button");
        const loginError = document.getElementById("login-error");
    
        const usernameField = document.getElementById("username");
        const passwordField = document.getElementById("password");
    
        // Hardcoded credentials
        const SUPERUSER_CREDENTIALS = {
            username: "",
            password: "", // Replace with a secure password
        };
    
        // Show login screen initially
        loginContainer.style.display = "block";
    
        loginButton.addEventListener("click", () => {
            const username = usernameField.value.trim();
            const password = passwordField.value.trim();
    
            if (
                username === SUPERUSER_CREDENTIALS.username &&
                password === SUPERUSER_CREDENTIALS.password
            ) {
                // Authentication successful
                loginContainer.style.display = "none";
                portalContent.style.display = "block";
    
                // Load site list
                loadSiteList();
            } else {
                // Authentication failed
                loginError.style.display = "block";
            }
        });
    
        // Function to load the site list into the table
        async function loadSiteInfo() {
            const siteInfoContent = document.getElementById("site-info-content");
          
            try {
              const response = await fetch("/assets/data/site-list.json");
              if (!response.ok) {
                throw new Error(`Failed to fetch sites list: ${response.status}`);
              }
          
              const data = await response.json();
              const siteList = data.sites
                .map(
                  (siteId) => `
                  <div>
                    <strong>Site ID:</strong> ${siteId}
                    <br>
                    <a href="/${siteId}/portal.html">Go to Site Portal</a>
                  </div>
                `
                )
                .join("<br>");
          
              siteInfoContent.innerHTML = siteList;
            } catch (error) {
              console.error("Error loading site information:", error);
              siteInfoContent.innerHTML = "<p>Failed to load site information.</p>";
            }
        }
});