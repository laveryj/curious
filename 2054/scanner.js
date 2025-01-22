let video = document.getElementById("camera-feed");
let canvas = document.getElementById("canvas");
let popup = document.getElementById("camera-popup");
let closePopupButton = document.getElementById("close-popup");
let startScanButton = document.getElementById("start-scan");
let ctx = canvas.getContext("2d");
let scanning = false;

// Start the QR code scanner
startScanButton.addEventListener("click", async () => {
  scanning = true;

  // Show the pop-up
  popup.style.display = "flex";

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
  const tracks = stream.getTracks();

  tracks.forEach(track => track.stop());
  video.srcObject = null;
}

// Close the pop-up
closePopupButton.addEventListener("click", () => {
  scanning = false;
  stopCamera();
  popup.style.display = "none";
});