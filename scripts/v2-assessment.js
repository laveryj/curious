let selectedAnimal = "";
let emailSent = false; // ✅ Track whether the email has been sent
let reportBlob = null; // ✅ Store PDF blob for manual download
let csvBlob = null; // ✅ Store CSV blob for manual download

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
    <textarea id="evidence" placeholder="Evidence"></textarea>
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
  const evidenceField = document.getElementById("evidence");
  const selectedAnswer = responses[currentQuestionIndex]?.answer; // Check if an answer was selected

  if (!selectedAnswer) {
    alert("Please select an answer before proceeding.");
    return;
  }

  // Capture evidence at the time "Next" is pressed
  const evidence = evidenceField.value || "";
  responses[currentQuestionIndex].evidence = evidence;

  console.log("➡ Proceeding to next question...");
  currentQuestionIndex++;

  // Small delay to ensure updates apply before loading the next question
  setTimeout(loadQuestion, 50);
}

async function showResults() {
  const recipientEmail = await getSiteEmail();
  console.log("🎉 Assessment completed!");

  const assessmentContainer = document.getElementById("assessment-container");
  assessmentContainer.innerHTML = `
    <h4>Assessment Completed 🎉</h4>
    <p>The data has been saved, and a PDF report has been e-mailed to ${recipientEmail}.</p>
  `;

  exportResults(true); // ✅ Generate & upload the report, but do not download it

  // ✅ Add button for manual download
  const exportButton = document.createElement("button");
  exportButton.textContent = "Manual Download";
  exportButton.addEventListener("click", downloadReport); // ✅ Trigger manual download
  assessmentContainer.appendChild(exportButton);
}

async function uploadToR2(pdfBlob, fileName) {
  console.log("📤 Uploading PDF to R2...");

  const formData = new FormData();
  formData.append("file", pdfBlob, fileName);

  try {
    const response = await fetch("https://welfare-assessment-reports.hello-e9b.workers.dev/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Upload failed. Response: ${errorText}`);
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !data.url) {
      throw new Error("❌ Invalid response from R2 upload - No file URL received.");
    }

    console.log("✅ PDF uploaded successfully:", data.url);
    return data.url; // ✅ Correctly returning the direct file URL

  } catch (error) {
    console.error("❌ Failed to upload PDF:", error.message, error);
    return null;
  }
}

async function exportResults() {
  console.log("📤 Exporting results...");
  const { jsPDF } = window.jspdf;
  const zip = new JSZip();

  const doc = new jsPDF();
  let csvContent = "Question,Answer,Evidence\n";
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

    if (yPos > pageHeight) {
      doc.addPage();
      yPos = 20;
    }

    let wrappedQuestion = doc.splitTextToSize(`${index + 1}. ${res.question}`, 170);
    doc.text(wrappedQuestion, 15, yPos);
    yPos += wrappedQuestion.length * 7;

    doc.setFont("helvetica", "normal");

    let wrappedAnswer = doc.splitTextToSize(`Answer: ${res.answer}`, 160);
    doc.text(wrappedAnswer, 20, yPos);
    yPos += wrappedAnswer.length * 7;

    let wrappedEvidence = doc.splitTextToSize(`Evidence: ${res.evidence || "None"}`, 160);
    doc.text(wrappedEvidence, 20, yPos);
    yPos += wrappedEvidence.length * 7 + 5;

    csvContent += `"${res.question.replace(/"/g, '""')}","${res.answer}","${res.evidence.replace(/"/g, '""')}"\n`;

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

  doc.text(`Welfare Score:`, 15, yPos + 10);
  doc.setFont("helvetica", "normal");
  doc.text(`${welfareScore}%`, 47, yPos + 10);
  yPos += 30;

  const date = new Date();
  const shortDate = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;
  const time = `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
  const fileNameBase = `Welfare-assessment_${shortDate}-${time}`;

  reportBlob = doc.output("blob"); // ✅ Store PDF Blob
  csvBlob = new Blob([csvContent], { type: "text/csv" }); // ✅ Store CSV Blob

  // ✅ Upload PDF to Cloudflare R2
  const fileName = `${fileNameBase}.pdf`;
  try {
    const formData = new FormData();
    formData.append("file", reportBlob, fileName);

    const uploadResponse = await fetch("https://welfare-assessment-reports.hello-e9b.workers.dev/upload", {
      method: "POST",
      body: formData
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    const responseData = await uploadResponse.json();
    if (!responseData.url) {
      throw new Error("Upload response did not contain a valid URL.");
    }

    console.log("✅ File uploaded successfully to R2:", responseData.url);
    const fileLink = responseData.url; // Ensure the correct link is used

    const recipientEmail = await getSiteEmail(); // Fetch dynamically

    const emailPayload = {
      recipient: recipientEmail,
      subject: `🔔 New Welfare Assessment: ${selectedAnimal}`,
      message: `A welfare assessment for ${selectedAnimal} has just been completed by ${document.getElementById("auditor-name").value}!\n\nDownload the report here: ${fileLink}`
    };

    const emailResponse = await fetch("https://welfare-assessment-reports.hello-e9b.workers.dev/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailPayload),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text(); // Read response for more details
      throw new Error(`Email send failed: ${emailResponse.statusText}, Response: ${errorText}`);
    }

    console.log("✅ Email sent successfully");

  } catch (error) {
    console.error("❌ Error processing upload or email:", error);
  }
}

async function submitWelfareAssessment() {
  console.log("📤 Sending welfare assessment to database...");

  const pathSegments = window.location.pathname.split("/");
  const siteId = /^\d{4}$/.test(pathSegments[1]) ? pathSegments[1] : null;
  if (!siteId) {
      console.error("❌ Site ID is missing or invalid.");
      return;
  }

  const endTime = new Date();

  const assessmentData = {
      site_id: siteId,
      animal: selectedAnimal,
      assessment_id: Date.now(), // Unique ID for this assessment
      auditor_name: document.getElementById("auditor-name").value,
      auditor_role: document.getElementById("auditor-role").value,
      start_time: startTime.toISOString(),  // Capture start time in ISO format
      end_time: endTime.toISOString(),      // Capture end time in ISO format
      responses
  };

  try {
      const response = await fetch("https://save-welfare-assessments.hello-e9b.workers.dev/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assessmentData)
      });

      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      console.log("✅ Welfare assessment saved to database successfully!");
  } catch (error) {
      console.error("❌ Failed to save assessment to database:", error);
  }
}

async function getSiteEmail() {
  try {
    const response = await fetch("./assets/data/config.json");
    if (!response.ok) throw new Error("Failed to load config.json");
    
    const configData = await response.json();

    if (!configData.assessmentsEmail) {
      throw new Error("❌ assessmentsEmail is missing in config.json.");
    }

    console.log("✅ Retrieved email:", configData.assessmentsEmail);
    return configData.assessmentsEmail;
  } catch (error) {
    console.error("❌ Error fetching site email:", error);
    return "reports@alerts.get-curio.us"; // change to emai.get.curious
  }
}

// async function sendEmailNotification(fileUrl) {
//   console.log("📧 Sending email notification...");

//   try {
//     // ✅ Get the correct recipient email
//     const recipientEmail = await getSiteEmail();

//     // ✅ Construct the email payload
//     const emailData = {
//       recipient: recipientEmail, // Now dynamically set
//       subject: `🔔 New Welfare Assessment: ${selectedAnimal}`,
//       message: `A welfare assessment for ${selectedAnimal} has just been completed by ${document.getElementById("auditor-name").value}. \n\nDownload the report here: ${fileUrl}`,
//     };

//     // ✅ Send the email
//     const response = await fetch("https://welfare-assessment-reports.hello-e9b.workers.dev/send-email", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(emailData),
//     });

//     if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    
//     console.log("✅ Email sent successfully to:", recipientEmail);
//   } catch (error) {
//     console.error("❌ Failed to send email:", error);
//   }
// }

function downloadReport() {
  if (!reportBlob || !csvBlob) {
    console.error("❌ Report not available for download.");
    return;
  }

  const date = new Date();
  const shortDate = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;
  const time = `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
  const fileNameBase = `Welfare-assessment_${shortDate}-${time}`;

  const zip = new JSZip();
  zip.file(`${fileNameBase}.pdf`, reportBlob);
  zip.file(`${fileNameBase}.csv`, csvBlob);

  zip.generateAsync({ type: "blob" }).then((zipBlob) => {
    const zipUrl = URL.createObjectURL(zipBlob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = zipUrl;
    downloadAnchor.download = `${fileNameBase}.zip`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(zipUrl);
  });

  console.log("✅ Report downloaded successfully.");
}