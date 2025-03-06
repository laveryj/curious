document.addEventListener("DOMContentLoaded", () => {
    // List of known site IDs to check
    const siteIds = ["2054", "0000", "0001", "0002", "4000"]; // Add all site IDs here

    console.log("Starting authentication process...");

    function tryNextSite(index, enteredUsername, enteredPassword) {
        if (index >= siteIds.length) {
            console.warn("No matching site found for this username.");
            document.getElementById("login-error").style.display = "block";
            return;
        }

        const siteid = siteIds[index];
        const configUrl = `/${siteid}/assets/data/config.json`;

        console.log(`Checking site: ${siteid}, fetching: ${configUrl}`);

        fetch(configUrl)
            .then((response) => {
                if (!response.ok) {
                    console.warn(`Site ${siteid} config not found, skipping...`);
                    tryNextSite(index + 1, enteredUsername, enteredPassword);
                    return;
                }
                return response.json();
            })
            .then((config) => {
                if (!config) return;

                console.log(`Checking credentials for site ${siteid}`);
                if (enteredUsername === config.user) {
                    if (enteredPassword === config.password) {
                        console.log(`Login successful for site ${siteid}. Redirecting...`);
                        sessionStorage.setItem("authToken", "authenticated");
                        sessionStorage.setItem("authSiteId", siteid);
                        window.location.href = `/${siteid}/portal.html`;
                    } else {
                        console.warn(`Incorrect password for site ${siteid}`);
                        document.getElementById("login-error").style.display = "block";
                    }
                } else {
                    console.log(`Username not found in site ${siteid}, checking next site...`);
                    tryNextSite(index + 1, enteredUsername, enteredPassword);
                }
            })
            .catch((error) => {
                console.error(`Error checking site ${siteid}:`, error);
                tryNextSite(index + 1, enteredUsername, enteredPassword);
            });
    }

    document.querySelector("form").addEventListener("submit", (event) => {
        event.preventDefault();

        const enteredUsername = document.getElementById("username").value;
        const enteredPassword = document.getElementById("password").value;

        console.log("User entered:", enteredUsername);
        console.log("Starting site scan...");

        tryNextSite(0, enteredUsername, enteredPassword);
    });
});