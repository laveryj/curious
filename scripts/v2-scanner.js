document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("camera-feed");
  const canvas = document.getElementById("canvas");
  const popup = document.getElementById("camera-popup");
  const closePopupButton = document.getElementById("close-popup");
  const startScanButton = document.getElementById("start-scan");
  const ctx = canvas.getContext("2d");
  let scanning = false;

  // Start the QR code scanner
  startScanButton.addEventListener("click", async () => {
      scanning = true;

      // Show the pop-up
      popup.style.display = "flex";

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          alert("Camera access is not supported in this browser or environment.");
          popup.style.display = "none";
          return;
      }

      try {
          // Ask for camera access
          const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "environment" }
          });

          video.srcObject = stream;

          // Start processing video frames
          video.addEventListener("play", () => {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              scanQRCode();
          });
      } catch (err) {
          console.error("Error accessing camera:", err);
          alert("Failed to access the camera. Please check permissions or try a different browser.");
          popup.style.display = "none";
      }
  });

  // Scan QR codes from the video feed
  function scanQRCode() {
      if (!scanning) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, canvas.width, canvas.height);

      if (qrCode) {
          scanning = false;
          stopCamera();
          popup.style.display = "none";
          window.location.href = qrCode.data; // Redirect to the scanned URL
      } else {
          requestAnimationFrame(scanQRCode); // Continue scanning
      }
  }

  // Stop the camera
  function stopCamera() {
      const stream = video.srcObject;
      if (stream) {
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
          video.srcObject = null;
      }
  }

  // Close the pop-up
  closePopupButton.addEventListener("click", () => {
      scanning = false;
      stopCamera();
      popup.style.display = "none";
  });
});