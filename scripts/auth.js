document.addEventListener("DOMContentLoaded", () => {
    const configUrl = "./assets/data/config.json"; // Path to the config.json file
  
    fetch(configUrl)
        .then((response) => response.json())
        .then((config) => {
            handleAuthentication(config.user, config.password, config.siteid);
        })
        .catch((error) => {
            console.error("Error loading configuration:", error);
        });
  
    function handleAuthentication(username, password, siteid) {
        const loginError = document.getElementById("login-error");
  
        // Check if user is already logged in
        if (sessionStorage.getItem("authToken")) {
            const savedSiteId = sessionStorage.getItem("authSiteId");
            window.location.href = `/${savedSiteId}/portal.html`;
            return;
        }
  
        document.querySelector("form").addEventListener("submit", (event) => {
            event.preventDefault();
  
            const enteredUsername = document.getElementById("username").value;
            const enteredPassword = document.getElementById("password").value;
  
            if (enteredUsername === username && enteredPassword === password) {
                // Store login state and site ID
                sessionStorage.setItem("authToken", "authenticated");
                sessionStorage.setItem("authSiteId", siteid);
  
                // Redirect to site-specific portal
                window.location.href = `/${siteid}/portal.html`;
            } else {
                loginError.style.display = "block";
            }
        });
    }
  });