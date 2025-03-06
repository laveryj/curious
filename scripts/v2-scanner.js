document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("camera-feed");
  const canvas = document.getElementById("canvas");
  const popup = document.getElementById("camera-popup");
  const closePopupButton = document.getElementById("close-popup");
  const startScanButton = document.getElementById("start-scan");
  const qrIcon = document.getElementById("qr-icon"); // QR icon
  let ctx = null;
  let scanning = false;

  // Initialize the canvas context if it exists
  if (canvas) {
    ctx = canvas.getContext("2d");
  } else {
    console.error("Canvas element is missing!");
    return;
  }

  // Function to start the QR code scanner
  const startScanner = async () => {
    scanning = true;

    // Hide QR icon if it exists
    if (qrIcon) {
      qrIcon.style.display = "none";
    }

    // Show the camera popup
    popup.style.display = "flex";

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera access is not supported in this browser or environment.");
      popup.style.display = "none";
      if (qrIcon) {
        qrIcon.style.display = "block"; // Show the icon again if there's an error
      }
      return;
    }

    try {
      // Ask for camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
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
      alert("Failed to access the camera. Please allow access.");
      popup.style.display = "none";
      if (qrIcon) {
        qrIcon.style.display = "block"; // Show the icon again if there's an error
      }
    }
  };

  // Scan QR codes from the video feed
  const scanQRCode = () => {
    if (!scanning) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qrCode = jsQR(imageData.data, canvas.width, canvas.height);

    if (qrCode) {
      scanning = false;
      stopCamera();
      popup.style.display = "none";
      if (qrIcon) {
        qrIcon.style.display = "block"; // Show the icon again after scanning
      }
      window.location.href = qrCode.data; // Redirect to the scanned URL
    } else {
      requestAnimationFrame(scanQRCode); // Continue scanning
    }
  };

  // Stop the camera
  const stopCamera = () => {
    const stream = video.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      video.srcObject = null;
    }

    // Show the QR icon again
    if (qrIcon) {
      qrIcon.style.display = "block";
    }
  };

  // Close the camera popup
  closePopupButton.addEventListener("click", () => {
    scanning = false;
    stopCamera();
    popup.style.display = "none";
  });

  // Add event listeners for both the button and the icon
  if (startScanButton) {
    startScanButton.addEventListener("click", startScanner);
  }

  if (qrIcon) {
    qrIcon.addEventListener("click", startScanner);
  }
});