document.addEventListener("DOMContentLoaded", function () {
    fetch("./assets/data/config.json")
      .then(response => response.json())
      .then(data => {
        if (!data || !data.wifi || data.wifi.length === 0) {
            console.log("No Wi-Fi details found.");
            return;
        }

        // Get first Wi-Fi entry
        const wifiInfo = data.wifi[0];

        // Create Wi-Fi dialog
        let dialog = document.createElement("dialog");
        dialog.setAttribute("id", "wifi-dialog");
        dialog.innerHTML = `
          <h2>Wi-Fi Details</h2>
          <div id="wifi-content"></div>
          <button id="close-wifi-dialog">Close</button>
        `;
        document.body.appendChild(dialog);

        const wifiContent = document.getElementById("wifi-content");

        // Populate content
        let hasContent = false;
        if (wifiInfo.instructions) {
            wifiContent.innerHTML += `<p>${wifiInfo.instructions}</p>`;
            hasContent = true;
        }
        if (wifiInfo.ssid && wifiInfo.password) {
            wifiContent.innerHTML += `
              <p><strong>Network:</strong> ${wifiInfo.ssid}</p>
              <p><strong>Password:</strong> ${wifiInfo.password}</p>
              <br>
            `;
            hasContent = true;
        }

        // Ensure there is content before displaying the button
        if (hasContent) {
            const showWifiBtn = document.getElementById("show-wifi-btn");
            showWifiBtn.style.display = "block";

            // Show dialog when the button is clicked
            showWifiBtn.addEventListener("click", () => {
                console.log("Opening Wi-Fi details popup...");
                dialog.showModal();
            });

            // Close button functionality
            document.getElementById("close-wifi-dialog").addEventListener("click", () => {
                console.log("Closing Wi-Fi popup...");
                dialog.close();
            });
        }
      })
      .catch(error => console.error("Error loading Wi-Fi details:", error));
});