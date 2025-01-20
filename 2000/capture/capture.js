const URL = "https://teachablemachine.withgoogle.com/models/e_riFlq1S/";

let model, webcam, labelContainer, maxPredictions;

async function init() {
    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        // Load the model
        model = await teachablemachine.image.load(modelURL, metadataURL); // Correct reference
        maxPredictions = model.getTotalClasses();

        // Initialize webcam
        const flip = true; // Flip for mirrored view
        webcam = new teachablemachine.image.Webcam(200, 200, flip);
        await webcam.setup();
        await webcam.play();
        window.requestAnimationFrame(loop);

        // Display webcam and label containers
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        labelContainer = document.getElementById("label-container");
        for (let i = 0; i < maxPredictions; i++) {
            labelContainer.appendChild(document.createElement("div"));
        }
    } catch (error) {
        console.error("Error initializing model or webcam:", error);
    }
}

async function loop() {
    webcam.update(); // Update webcam frame
    await predict(); // Run prediction
    window.requestAnimationFrame(loop);
}

async function predict() {
    const predictions = await model.predict(webcam.canvas);
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            predictions[i].className + ": " + predictions[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
}