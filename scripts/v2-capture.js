const URL = "./assets/capture/model5/";
const MATCH_THRESHOLD = 0.95; // Confidence threshold for matches
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

async function processImage(event) {
  if (!modelLoaded) {
    alert("Model is not ready yet. Please wait a moment.");
    return;
  }

  try {
    const file = event.target.files[0];
    if (!file) return;

    // Clear existing content (species info and other results)
    const content = document.querySelector("#content");
    if (content) content.innerHTML = ""; // Clear species card content
    labelContainer.innerHTML = ""; // Clear previous prediction results

    const reader = new FileReader();
    reader.onload = async function (e) {
      const image = new Image();
      image.src = e.target.result;

      image.onload = async () => {
        const predictions = await model.predict(image);

        // Sort predictions by probability and get the top three
        const topPredictions = predictions.sort((a, b) => b.probability - a.probability).slice(0, 3);
        const topPrediction = topPredictions[0];

        let speciesRendered = false;

        if (topPrediction && topPrediction.probability > MATCH_THRESHOLD) {
          const speciesId = topPrediction.className; // Assuming className is the species ID
          console.log(`Top Prediction Species ID: ${speciesId}`);

          // Fetch species data and render the species card
          try {
            const response = await fetch("./assets/data/data.json");
            if (!response.ok) throw new Error(`Failed to fetch species data. Status: ${response.status}`);

            const data = await response.json();
            const speciesData = data.exhibits
              .flatMap((exhibit) => exhibit.objects) // Flatten all objects from all exhibits
              .find((object) => object.commonName.toLowerCase() === speciesId.toLowerCase());

            if (speciesData) {
              renderSpecies(speciesData); // Render the species card
              speciesRendered = true;
            } else {
              console.error(`Species with commonName "${speciesId}" not found in data.json`);
            }
          } catch (error) {
            console.error("Error fetching species data:", error);
          }
        } else {
          console.log("No prediction met the threshold.");
        }

        // Show "No matches" message and top matches if no species card is rendered
        if (!speciesRendered) {
          const noMatchDiv = document.createElement("div");
          noMatchDiv.textContent = "No matches found. Try uploading a clearer image.";
          noMatchDiv.style.margin = "20px auto";
          noMatchDiv.style.padding = "5px";
          noMatchDiv.style.border = "2px solid #D83B01";
          noMatchDiv.style.borderRadius = "5px";
          noMatchDiv.style.backgroundColor = "#FFD1C1";
          noMatchDiv.style.color = "#D83B01";
          noMatchDiv.style.fontSize = "18px";
          noMatchDiv.style.fontWeight = "bold";
          noMatchDiv.style.maxWidth = "300px";
          noMatchDiv.style.textAlign = "center";

          labelContainer.appendChild(noMatchDiv);

          // Display the top matches in a development box
          const devContainer = document.createElement("div");
          devContainer.style.margin = "20px auto";
          devContainer.style.padding = "10px";
          devContainer.style.border = "2px dashed #333";
          devContainer.style.borderRadius = "5px";
          devContainer.style.backgroundColor = "#F0F0F0";
          devContainer.style.color = "#333";
          devContainer.style.fontSize = "14px";
          devContainer.style.maxWidth = "300px";
          devContainer.style.textAlign = "center";

          devContainer.textContent = "Backend: Top 3 Matches";
          labelContainer.appendChild(devContainer);

          topPredictions.forEach((prediction, index) => {
            const predictionDiv = document.createElement("div");
            predictionDiv.textContent = `${index + 1}. ${prediction.className}: ${(prediction.probability * 100).toFixed(2)}%`;
            predictionDiv.style.margin = "5px 0";
            predictionDiv.style.padding = "5px";
            predictionDiv.style.border = "1px solid #999";
            predictionDiv.style.borderRadius = "3px";
            predictionDiv.style.backgroundColor = "#E9E9E9";
            predictionDiv.style.color = "#555";
            predictionDiv.style.fontSize = "14px";
            predictionDiv.style.fontWeight = "normal";

            devContainer.appendChild(predictionDiv);
          });
        }
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

document.addEventListener("DOMContentLoaded", () => {
  // Add a click event listener to the icon
  const idIcon = document.getElementById("id-icon");
  const imageUpload = document.getElementById("image-upload");

  if (idIcon && imageUpload) {
    idIcon.addEventListener("click", () => {
      // Programmatically trigger the click event on the file input element
      imageUpload.click();
    });
  } else {
    console.error("ID icon or image upload input not found in the DOM.");
  }
});