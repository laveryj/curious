const URL = "./assets/capture/model3/";
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
    if (content) {
      content.innerHTML = ""; // Clear species card content
    }
    labelContainer.innerHTML = ""; // Clear previous prediction results

    // Display the uploaded image using FileReader
    const imgElement = document.getElementById("uploaded-image");
    const reader = new FileReader();

    reader.onload = async function (e) {
      // imgElement.src = e.target.result;
      // imgElement.style.display = "block";

      // Predict using the loaded model
      const image = new Image();
      image.src = e.target.result;
      image.onload = async () => {
        const predictions = await model.predict(image);

        let hasHighConfidencePrediction = false;

        // Original prediction check
        // predictions.forEach((result) => {
        //   if (result.probability > 0.95) {
        //     hasHighConfidencePrediction = true;

        //     const div = document.createElement("div");
        //     div.textContent = `This is a ${result.className}`;

        //     // Add inline styles to center the result
        //     div.style.margin = "20px auto";
        //     div.style.padding = "5px";
        //     div.style.border = "2px solid #d35c18";
        //     div.style.borderRadius = "5px";
        //     div.style.backgroundColor = "#FFD7B5";
        //     div.style.color = "#d35c18";
        //     div.style.fontSize = "20px";
        //     div.style.fontWeight = "bold";
        //     div.style.maxWidth = "300px";
        //     div.style.textAlign = "center";

        //     labelContainer.appendChild(div);
        //   }
        // });

        // Show a message if no predictions have a probability greater than 95%
        if (!hasHighConfidencePrediction) {
          const div = document.createElement("div");
          div.textContent = "No matches found. Try uploading a clearer image.";

          // Add inline styles to format the message
          div.style.margin = "20px auto";
          div.style.padding = "5px";
          div.style.border = "2px solid #D83B01";
          div.style.borderRadius = "5px";
          div.style.backgroundColor = "#FFD1C1";
          div.style.color = "#D83B01";
          div.style.fontSize = "18px";
          div.style.fontWeight = "bold";
          div.style.maxWidth = "300px";
          div.style.textAlign = "center";

          labelContainer.appendChild(div);
        }

        // DEVELOPMENT: List the top three predictions by percentage match
        const topThreePredictions = predictions
          .sort((a, b) => b.probability - a.probability)
          .slice(0, 3);

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

        devContainer.textContent = "Development: Top 3 Matches";
        labelContainer.appendChild(devContainer);

        topThreePredictions.forEach((prediction, index) => {
          const predictionDiv = document.createElement("div");
          predictionDiv.textContent = `${index + 1}. ${prediction.className}: ${(prediction.probability * 100).toFixed(2)}%`;

          // Add inline styles for top predictions
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

        // Get the top prediction and fetch species information
        const topPrediction = topThreePredictions[0];
        if (topPrediction && topPrediction.probability > 0.95) {
          const speciesId = topPrediction.className; // Assuming className is the species ID
          console.log(`Top Prediction Species ID: ${speciesId}`); // Debugging log

          // Fetch species data and render the species card
          fetch("./assets/data/data.json")
            .then((response) => {
              if (!response.ok) {
                throw new Error(`Failed to fetch species data. Status: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              // Search for species by commonName in the data
              const speciesData = data.exhibits
                .flatMap((exhibit) => exhibit.objects) // Flatten all objects from all exhibits
                .find((object) => object.commonName.toLowerCase() === topPrediction.className.toLowerCase()); // Match by commonName

              if (speciesData) {
                renderSpecies(speciesData); // Render the species card
              } else {
                console.error(`Species with commonName "${topPrediction.className}" not found in data.json`);
              }
            })
            .catch((error) => {
              console.error("Error fetching species data:", error);
            });
        } else {
          console.log("No prediction met the 95% threshold for rendering species info.");
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