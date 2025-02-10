let selectedAnimal = "";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM fully loaded and script running.");

  const introContainer = document.getElementById("instructions-page");
  const auditorContainer = document.getElementById("auditor-form");
  const assessmentContainer = document.getElementById("assessment-container");
  const getStartedButton = document.getElementById("get-started-button");
  const startButton = document.getElementById("start-button");
  const animalSelect = document.getElementById("animal-select");
  const auditorName = document.getElementById("auditor-name");
  const auditorRole = document.getElementById("auditor-role");
  const auditorForm = document.getElementById("auditor-form");

  if (!auditorForm) {
    console.error("❌ ERROR: #auditor-form not found! Check HTML structure.");
    return;
  }

  // Show the intro page first, hide others
  introContainer.style.display = "block";
  auditorContainer.style.display = "none";
  assessmentContainer.style.display = "none";

  getStartedButton.addEventListener("click", () => {
    introContainer.style.display = "none";
    auditorContainer.style.display = "block";
  });

  // Load animals list
  try {
    console.log("Fetching questions from JSON...");
    const response = await fetch("./assets/data/assessment.json");
    const data = await response.json();
    const animals = data.animals;
    // Flatten all questions from all sections into a single array
    questions = data.questions.flatMap(section => section.questions);

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
    startTime = new Date();

    console.log(`✅ Assessment started for ${selectedAnimal}. Hiding auditor form.`);

    // Hide auditor form
    auditorContainer.style.display = "none";
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
  responses[currentQuestionIndex] = {
    question: questions[currentQuestionIndex].question,
    answer
  };
}

function nextQuestion() {
  const notesField = document.getElementById("notes");
  const selectedAnswer = responses[currentQuestionIndex]?.answer; // Check if an answer was selected

  if (!selectedAnswer) {
    alert("Please select an answer before proceeding.");
    return;
  }

  // Capture notes at the time "Next" is pressed
  const notes = notesField.value || "";
  responses[currentQuestionIndex].notes = notes;

  console.log("➡ Proceeding to next question...");
  currentQuestionIndex++;

  // Small delay to ensure updates apply before loading the next question
  setTimeout(loadQuestion, 50);
}

function showResults() {
  console.log("🎉 Assessment completed. Displaying results...");
  const assessmentContainer = document.getElementById("assessment-container");
  assessmentContainer.innerHTML = "<h4>Assessment Completed 🎉</h4>";

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

function exportResults() {
  console.log("📤 Exporting results...");
  const { jsPDF } = window.jspdf;
  const zip = new JSZip();

  const doc = new jsPDF();
  let csvContent = "Question,Answer,Notes\n";
  let totalPossible = 0;
  let totalAchieved = 0;
  let welfareIssues = [];
  const endTime = new Date();
  const pageHeight = 280; // Limit before adding a new page

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Animal Welfare Assessment`, 15, 20);
  doc.setFontSize(12);
  doc.text(`${selectedAnimal}`, 15, 30);

  doc.setFont("helvetica", "normal");
  doc.setFont("helvetica", "bold");
  doc.text(`Name:`, 15, 45);
  doc.setFont("helvetica", "normal");
  doc.text(`${document.getElementById("auditor-name").value} - ${document.getElementById("auditor-role").value}`, 30, 45);

  doc.setFont("helvetica", "bold");
  doc.text(`Date:`, 15, 50);
  doc.setFont("helvetica", "normal");
  doc.text(`${new Date().toLocaleDateString()}`, 27, 50);

  doc.setFont("helvetica", "bold");
  doc.text(`Start time:`, 15, 55);
  doc.setFont("helvetica", "normal");
  doc.text(`${startTime ? startTime.toLocaleTimeString() : "N/A"}`, 37, 55);

  doc.setFont("helvetica", "bold");
  doc.text(`End time:`, 15, 60);
  doc.setFont("helvetica", "normal");
  doc.text(`${endTime.toLocaleTimeString()}`, 35, 60);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Results`, 15, 75);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  let yPos = 85;

  responses.forEach((res, index) => {
    doc.setFont("helvetica", "bold");

    // Add a new page if needed
    if (yPos > pageHeight) {
      doc.addPage();
      yPos = 20; // Reset position for the new page
    }

    // Wrap question text
    let wrappedQuestion = doc.splitTextToSize(`${index + 1}. ${res.question}`, 170);
    doc.text(wrappedQuestion, 15, yPos);
    yPos += wrappedQuestion.length * 7;

    doc.setFont("helvetica", "normal");

    // Wrap answer text
    let wrappedAnswer = doc.splitTextToSize(`Answer: ${res.answer}`, 160);
    doc.text(wrappedAnswer, 20, yPos);
    yPos += wrappedAnswer.length * 7;

    // Wrap notes text
    let wrappedNotes = doc.splitTextToSize(`Notes: ${res.notes || "None"}`, 160);
    doc.text(wrappedNotes, 20, yPos);
    yPos += wrappedNotes.length * 7 + 5;

    csvContent += `"${res.question.replace(/"/g, '""')}","${res.answer}","${res.notes.replace(/"/g, '""')}"\n`;

    if (res.answer === "Yes") {
      totalAchieved++;
      totalPossible++;
    } else if (res.answer === "No") {
      totalPossible++;
      welfareIssues.push(res.question);
    }
  });
  
  let welfareScore = totalPossible > 0 ? ((totalAchieved / totalPossible) * 100).toFixed(2) : "N/A";
  doc.setFont("helvetica", "bold");
  
  if (yPos > pageHeight) {
    doc.addPage();
    yPos = 20;
  }
  
  // Welfare Score Section
  doc.text(`Welfare Score:`, 15, yPos + 10);
  doc.setFont("helvetica", "normal");
  doc.text(`${welfareScore}%`, 47, yPos + 10);
  yPos += 30; // Extra space before the action plan
  
  // Welfare Action Plan
  if (welfareIssues.length > 0) {
    if (yPos > pageHeight) {
      doc.addPage();
      yPos = 20;
    }
  
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14); // Increase font size for the action plan title
    doc.text("Welfare Action Plan", 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12); // Reset to normal font size for the content
    yPos += 12;
    
    doc.text("The following questions were answered 'no' and need addressing:", 15, yPos);
    yPos += 10;
  
    welfareIssues.forEach(issue => {
      if (yPos > pageHeight) {
        doc.addPage();
        yPos = 20;
      }
  
      let wrappedIssue = doc.splitTextToSize(`- ${issue}`, 160);
      doc.text(wrappedIssue, 20, yPos);
      yPos += wrappedIssue.length * 7;
    });
  }

  // Generate PDF Blob first
  const pdfBlob = doc.output("blob");

  // Generate a Blob URL for preview
  const pdfBlobUrl = URL.createObjectURL(pdfBlob);

  // Open the PDF in a new tab
  // window.open(pdfBlobUrl, "_blank");

  // Proceed with ZIP generation and download
  zip.file("assessment_results.pdf", pdfBlob);
  const csvBlob = new Blob([csvContent], { type: "text/csv" });
  zip.file("assessment_results.csv", csvBlob);

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