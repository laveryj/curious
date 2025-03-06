document.addEventListener("DOMContentLoaded", () => {
    console.log("🔐 Authentication script loaded");

    const form = document.querySelector("form");
    if (!form) {
        console.warn("⚠️ No login form found.");
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const enteredUsername = document.getElementById("username").value.trim();
        const enteredPassword = document.getElementById("password").value.trim();
        const loginError = document.getElementById("login-error");

        console.log("📝 User entered:", enteredUsername);

        try {
            const response = await fetch("https://get-curio.us/api/auth/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: enteredUsername, password: enteredPassword }),
            });

            if (!response.ok) {
                console.warn("❌ Invalid login");
                loginError.style.display = "block";
                return;
            }

            const data = await response.json();
            console.log("✅ Login successful:", data);

            // Store auth token and site ID
            sessionStorage.setItem("authToken", data.token);
            sessionStorage.setItem("authSiteId", data.siteid);

            // Redirect to the correct portal
            window.location.href = `/${data.siteid}/portal.html`;
        } catch (error) {
            console.error("⚠️ Authentication error:", error);
        }
    });
});