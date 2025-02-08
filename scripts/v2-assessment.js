let selectedAnimal = "";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM fully loaded and script running.");

  const animalSelect = document.getElementById("animal-select");
  const assessmentContainer = document.getElementById("assessment-container");
  const startButton = document.getElementById("start-button");
  const auditorName = document.getElementById("auditor-name");
  const auditorRole = document.getElementById("auditor-role");
  const auditorForm = document.getElementById("auditor-form");

  if (!auditorForm) {
    console.error("❌ ERROR: #auditor-form not found! Check HTML structure.");
    return;
  }

  // Load animals list
  try {
    console.log("Fetching questions from JSON...");
    const response = await fetch("./assets/data/assessment.json");
    const data = await response.json();
    const animals = data.animals;
    questions = data.questions[0].questions;

    console.log("✅ Questions loaded successfully:", questions);

    animals.forEach(animal => {
      const option = document.createElement("option");
      option.value = animal;
      option.textContent = animal;
      animalSelect.appendChild(option);
    });
  } catch (error) {
    console.error("❌ ERROR: Failed to load questions:", error);
  }

  startButton.addEventListener("click", () => {
    console.log("▶ Start button clicked.");

    if (!auditorName.value || !auditorRole.value || !animalSelect.value) {
      alert("⚠ Please enter your name, role, and select an animal.");
      return;
    }

    selectedAnimal = animalSelect.value; // Store selected animal

    currentQuestionIndex = 0;
    responses = [];

    console.log(`✅ Assessment started for ${selectedAnimal}. Hiding auditor form.`);

    // Hide auditor form
    auditorForm.style.display = "none";

    // Ensure the container is visible
    assessmentContainer.style.display = "block";
    assessmentContainer.innerHTML = "";

    // Load the first question
    loadQuestion();
  });
});

function loadQuestion() {
  const assessmentContainer = document.getElementById("assessment-container");

  // Remove old question before adding a new one
  assessmentContainer.innerHTML = "";

  if (currentQuestionIndex >= questions.length) {
    console.log("✅ No more questions. Showing results...");
    showResults();
    return;
  }

  const question = questions[currentQuestionIndex];
  console.log("📌 Displaying question:", question);

  // Create a new question block
  const questionBlock = document.createElement("div");
  questionBlock.classList.add("question-block");
  questionBlock.innerHTML = `
    <h3>${selectedAnimal}</h3>
    <p>${currentQuestionIndex + 1}. ${question.question}</p>
    <div class="options">
      <button class="option-btn" data-answer="No">❌</button>
      <button class="option-btn" data-answer="Yes">✅</button>
      <button class="option-btn" data-answer="N/A">n/a</button>
      <button class="option-btn" data-answer="N/W">n/w</button>
    </div>
    <br>
    <textarea id="notes" placeholder="Notes"></textarea>
    <br>
    <br>
    <button id="next-button">Next</button>
  `;

  assessmentContainer.appendChild(questionBlock);

  // Attach event listeners
  document.querySelectorAll(".option-btn").forEach(button => {
    button.addEventListener("click", (event) => {
      selectAnswer(event.target.getAttribute("data-answer"));
    });
  });

  document.getElementById("next-button").addEventListener("click", nextQuestion);
}

function selectAnswer(answer) {
  console.log(`✅ Answer selected: ${answer}`);
  const notes = document.getElementById("notes").value || "";
  responses[currentQuestionIndex] = {
    question: questions[currentQuestionIndex].question,
    answer,
    notes
  };
}

function nextQuestion() {
  if (!responses[currentQuestionIndex]) {
    alert("Please select an answer");
    return;
  }

  console.log("➡ Proceeding to next question...");
  currentQuestionIndex++;

  // Small delay to ensure updates apply before loading the next question
  setTimeout(loadQuestion, 50);
}

function showResults() {
  console.log("🎉 Assessment completed. Displaying results...");
  const assessmentContainer = document.getElementById("assessment-container");
  assessmentContainer.innerHTML = "<h4>Assessment Completed!</h4>";

  // responses.forEach((response, index) => {
  //   assessmentContainer.innerHTML += `
  //     <p>${index + 1}. ${response.question} - <strong>${response.answer}</strong><br>Notes: ${response.notes || "None"}</p>
  //   `;
  // });

  // Add Export button
  const exportButton = document.createElement("button");
  exportButton.textContent = "Export Results";
  exportButton.addEventListener("click", exportResults);
  assessmentContainer.appendChild(exportButton);
}

async function exportResults() {
  console.log("📤 Exporting results...");
  const { jsPDF } = window.jspdf;
  const zip = new JSZip();

  // Generate PDF
  const doc = new jsPDF();
  let csvContent = "Question,Answer,Notes\n";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Animal Welfare Assessment Results", 20, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  let yPos = 40;

  responses.forEach((res, index) => {
    doc.text(`${index + 1}. ${res.question}`, 20, yPos);
    yPos += 7;
    doc.text(`Answer: ${res.answer}`, 25, yPos);
    yPos += 5;
    doc.text(`Notes: ${res.notes || "None"}`, 25, yPos);
    yPos += 10;
    csvContent += `"${res.question.replace(/"/g, '""')}","${res.answer}","${res.notes.replace(/"/g, '""')}"\n`;
  });

  // Convert PDF to Blob
  const pdfBlob = doc.output("blob");
  zip.file("assessment_results.pdf", pdfBlob);

  // Convert CSV to Blob
  const csvBlob = new Blob([csvContent], { type: "text/csv" });
  zip.file("assessment_results.csv", csvBlob);

  // Generate Zip and trigger download
  zip.generateAsync({ type: "blob" }).then((zipBlob) => {
    const zipUrl = URL.createObjectURL(zipBlob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = zipUrl;
    downloadAnchor.download = "assessment_results.zip";
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(zipUrl);
  });
}