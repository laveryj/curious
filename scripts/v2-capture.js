const URL = "/2054/assets/capture/model3/";
let model, labelContainer, modelLoaded = false;

// Load the model
async function loadModel() {
  try {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    modelLoaded = true;

    // Ensure labelContainer is assigned
    labelContainer = document.getElementById("label-container");

    console.log("Model loaded successfully.");
  } catch (error) {
    console.error("Error loading model:", error);
    alert("Failed to load the model. Please check the URL or your connection.");
  }
}

// Process the uploaded image
async function processImage(event) {
  if (!modelLoaded) {
    alert("Model is not ready yet. Please wait a moment.");
    return;
  }

  try {
    const file = event.target.files[0];
    if (!file) return;

    // Display the uploaded image using FileReader
    const imgElement = document.getElementById("uploaded-image");
    const reader = new FileReader();

    reader.onload = async function (e) {
      imgElement.src = e.target.result;
      imgElement.style.display = "block";

      // Predict using the loaded model
      const image = new Image();
      image.src = e.target.result;
      image.onload = async () => {
        const predictions = await model.predict(image);
        labelContainer.innerHTML = ""; // Clear previous results

        predictions.forEach(result => {
          if (result.probability > 0.90) {
const div = document.createElement("div");
div.textContent = `This is a ${result.className}`;

// Add inline styles to center the result
div.style.margin = "20px auto";
div.style.padding = "10px";
div.style.border = "2px solid #BF3300";
div.style.borderRadius = "5px";
div.style.backgroundColor = "#FFD7B5";
div.style.color = "#BF3300";
div.style.fontSize = "20px";
div.style.fontWeight = "bold";
div.style.maxWidth = "300px";
div.style.textAlign = "center";

labelContainer.appendChild(div);
}
        });
      };
    };

    reader.readAsDataURL(file);
  } catch (error) {
    console.error("Error processing the image:", error);
    alert("Failed to process the image.");
  }
}

// Initialize on page load
window.onload = loadModel;