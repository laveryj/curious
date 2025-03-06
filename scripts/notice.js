document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const noticeType = urlParams.get("notice") || "inactive"; // Default to "inactive"
    const noticesUrl = "./assets/data/notices.json";
  
    try {
      const response = await fetch(noticesUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch notices.json: ${response.status}`);
      }
  
      const notices = await response.json();
      const notice = notices[noticeType] || notices["inactive"]; // Fallback to "inactive" if not found
  
      const contentElement = document.getElementById("content");
  
      if (notice) {
        // Update title
        document.title = notice.title || "Notice";
        document.getElementById("exhibit-title").textContent = notice.title || "Notice";
  
        // Render styled notice content
        contentElement.innerHTML = `
          <br>
          <div class="notice-container ${noticeType === 'overdue' ? 'notice-overdue' : ''}">
            <h2 class="notice-title">${notice.title || "Notice"}</h2>
            <p class="notice-message">${notice.message || "No message available."}</p>
          </div>
          ${
            noticeType !== "overdue"
              ? `<br><button id="scan-another" class="scan-another-button">Scan another exhibit QR code</button>`
              : ""
          }
        `;
  
        // Add event listener for "Scan another exhibit code!" button
        const scanButton = document.getElementById("scan-another");
        if (scanButton) {
          scanButton.addEventListener("click", startScanner); // Attach the scanner activation function
        }
      }
    } catch (error) {
      console.error("Error loading notices:", error);
  
      // Display fallback "inactive" notice in case of an error
      document.title = "Exhibit Inactive";
      document.getElementById("exhibit-title").textContent = "Exhibit Inactive";
  
      contentElement.innerHTML = `
        <div class="notice-container">
          <h2 class="notice-title">Exhibit Inactive</h2>
          <p class="notice-message">This exhibit is currently inactive. Please check back later.</p>
        </div>
        <button id="scan-another" class="scan-another-button">Scan another exhibit code!</button>
      `;
  
      // Add event listener for fallback button
      const scanButton = document.getElementById("scan-another");
      if (scanButton) {
        scanButton.addEventListener("click", startScanner);
      }
    }
  });
  
  // Function to start the scanner
  const startScanner = async () => {
    const popup = document.getElementById("camera-popup");
    const video = document.getElementById("camera-feed");
    const canvas = document.getElementById("canvas");
  
    if (!popup || !video || !canvas) {
      alert("Scanner is not set up correctly. Please contact support.");
      return;
    }
  
    // Show the camera popup
    popup.style.display = "flex";
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.srcObject = stream;
  
      video.addEventListener("play", () => {
        const ctx = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
  
        const scanQRCode = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, canvas.width, canvas.height);
  
          if (qrCode) {
            window.location.href = qrCode.data; // Redirect to the scanned URL
          } else {
            requestAnimationFrame(scanQRCode);
          }
        };
  
        scanQRCode();
      });
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Failed to access the camera. Please allow access.");
      popup.style.display = "none";
    }
  };