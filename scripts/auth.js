document.addEventListener("DOMContentLoaded", () => {
    const configUrl = "./config.json"; // Path to the config.json file
  
    fetch(configUrl)
      .then((response) => response.json())
      .then((config) => {
        handleAuthentication(config.user, config.password);
      })
      .catch((error) => {
        console.error("Error loading configuration:", error);
      });
  
    function handleAuthentication(username, password) {
      const loginContainer = document.getElementById("login-container");
      const portalContent = document.getElementById("portal-content");
      const loginButton = document.getElementById("login-button");
      const loginError = document.getElementById("login-error");
  
      loginContainer.style.display = "flex";
      portalContent.style.display = "none";
  
      loginButton.addEventListener("click", () => {
        const enteredUsername = document.getElementById("username").value;
        const enteredPassword = document.getElementById("password").value;
  
        if (enteredUsername === username && enteredPassword === password) {
          loginContainer.style.display = "none";
          portalContent.style.display = "block";
        } else {
          loginError.style.display = "block";
        }
      });
    }
  });