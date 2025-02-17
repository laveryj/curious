let selectedAnimal = "";
let emailSent = false; // ✅ Track whether the email has been sent
let reportBlob = null; // ✅ Store PDF blob for manual download
let csvBlob = null; // ✅ Store CSV blob for manual download
let questions = []; // Declare globally
let fileUrl = null; // Use camelCase

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

  const captureWelfareAssessment = document.getElementById("welfare-assessment-tool");
  const viewHistoricWelfareAssessments = document.getElementById("welfare-assessment-history");


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
    assessment_id = Date.now();  // Generates a unique timestamp
    console.log("▶ Start button clicked.");

    if (!auditorName.value || !auditorRole.value || !animalSelect.value) {
      alert("⚠ Please enter your name, role, and select an animal.");
      return;
    }

    selectedAnimal = animalSelect.value; // Store selected animal
    currentQuestionIndex = 0;
    responses = [];
    startTime = new Date();

    console.log(`✅ Assessment with an ID ${assessment_id} started for ${selectedAnimal}.`);

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

  // ✅ Get the correct answer options from the JSON
  const answerOptions = question.options || ["Yes", "No", "N/A", "N/W"]; // Default if missing
  const showEvidence = question.notes !== false; // ✅ Evidence field appears unless explicitly false

  // ✅ Generate answer buttons dynamically
  const optionsHTML = answerOptions.map(option => `
    <button class="option-btn" data-answer="${option}">${option}</button>
  `).join("");

  // ✅ Create the evidence field only if `notes` is not false
  const evidenceHTML = showEvidence ? `
    <br>
    <textarea id="evidence" placeholder="Evidence"></textarea>
  ` : ""; // ✅ Empty string if `notes` is false

  // ✅ Create a new question block
  const questionBlock = document.createElement("div");
  questionBlock.classList.add("question-block");
  questionBlock.innerHTML = `
    <h3>${selectedAnimal}</h3>
    <p>${currentQuestionIndex + 1}. ${question.question}</p>
    <div class="options">${optionsHTML}</div>
    ${evidenceHTML} <!-- ✅ Evidence is conditionally added -->
    <br>
    <button id="next-button">Next</button>
  `;

  assessmentContainer.appendChild(questionBlock);

  // ✅ Attach event listeners for the dynamically created buttons
  document.querySelectorAll(".option-btn").forEach(button => {
    button.addEventListener("click", (event) => {
      selectAnswer(event.target.getAttribute("data-answer"));
    });
  });

  document.getElementById("next-button").addEventListener("click", nextQuestion);
}

function nextQuestion() {
  const evidenceField = document.getElementById("evidence"); // ✅ Check if element exists
  const selectedAnswer = responses[currentQuestionIndex]?.answer; // ✅ Check if an answer was selected

  if (!selectedAnswer) {
    alert("Please select an answer before proceeding.");
    return;
  }

  // ✅ Store evidence only if the field exists
  responses[currentQuestionIndex] = {
    question: questions[currentQuestionIndex].question,
    answer: selectedAnswer,
    ...(evidenceField ? { evidence: evidenceField.value } : {}) // ✅ Only add evidence if present
  };

  console.log("➡ Proceeding to next question...");
  currentQuestionIndex++;

  // Small delay to ensure updates apply before loading the next question
  setTimeout(loadQuestion, 50);
}

function selectAnswer(answer) {
  console.log(`✅ Answer selected: ${answer}`);
  responses[currentQuestionIndex] = {
    question: questions[currentQuestionIndex].question,
    answer
  };
}

async function showResults() {
  console.log("🎉 Assessment completed!");
  const recipientEmail = await getSiteEmail();

  const assessmentContainer = document.getElementById("assessment-container");
  assessmentContainer.innerHTML = `
      <h4>Assessment Completed 🎉</h4>
      <p>The data from your assessment has been saved to the Curious database, and a PDF report has been e-mailed to ${recipientEmail}.</p>
      <p>You can manually download and view the report below, if needed.</p>
  `;

  // ✅ Ensure report generation is complete
  await exportResults();  // ✅ Wait for reportBlob generation

  console.log("🛠 Debug: Checking reportBlob before upload:", reportBlob);
  if (!reportBlob) {
      console.error("❌ Report Blob is null! Cannot upload PDF.");
      return;
  }

  const fileName = `Welfare_assessment-${assessment_id}.pdf`;
  fileUrl = await uploadToR2(reportBlob, fileName);  // ✅ Assign to global variable
  console.log("🛠 Debug: Received fileUrl from R2:", fileUrl);

  if (!fileUrl) {
      console.error("❌ Failed to upload report, skipping database save.");
      return;
  }

  console.log("📤 Submitting welfare assessment with file URL:", fileUrl);
  
  // ✅ Ensure `fileUrl` is correctly passed
  await submitWelfareAssessment(fileUrl);  // ✅ No need to pass fileUrl as an argument
  }

async function uploadToR2(pdfBlob, fileName) {
  console.log("📤 Uploading PDF to R2...");

  // Ensure pdfBlob is a valid Blob
  if (!(pdfBlob instanceof Blob)) {
    console.error("❌ Error: Invalid PDF Blob, skipping upload.");
    return null;
  }

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
    fileUrl = data.url;  // ✅ Ensure fileUrl is updated globally
    console.log("✅ Global fileUrl updated:", fileUrl);
    return fileUrl;

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
  doc.text(`Assessment ID: ${assessment_id} - ${selectedAnimal}`, 15, 30);

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

    csvContent += `"${res.question.replace(/"/g, '""')}","${res.answer}","${(res.evidence || "").replace(/"/g, '""')}"\n`;
    
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

  // Define the number of questions in the first section
  const firstSectionLength = 5;

  // Filter out issues that are not in the first section
  const filteredWelfareIssues = welfareIssues.filter((issue, index) => index >= firstSectionLength);

  if (filteredWelfareIssues.length > 0) {
    if (yPos + (filteredWelfareIssues.length * 7 + 20) > pageHeight) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Welfare Action Plan", 15, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 10;
    doc.text("The following items need addressing:", 15, yPos);
    yPos += 10;

    filteredWelfareIssues.forEach(issue => {
      if (yPos > pageHeight - 10) {
        doc.addPage();
        yPos = 20;
      }
      doc.text("- " + issue, 20, yPos);
      yPos += 7;
    });
  }

  // ✅ These were outside the function before - moving them inside
  reportBlob = doc.output("blob"); 
  console.log("✅ PDF Blob Generated:", reportBlob);
  csvBlob = new Blob([csvContent], { type: "text/csv" });

  console.log("✅ PDF & CSV Generated");

  // ✅ Upload PDF to Cloudflare R2
  const fileName = `Welfare_assessment-${assessment_id}.pdf`;
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
    const fileLink = responseData.url;

    const recipientEmail = await getSiteEmail();

    const emailPayload = {
      recipient: recipientEmail,
      subject: `🔔 New Welfare Assessment: ${selectedAnimal}`,
      message: `A welfare assessment (ID ${assessment_id}) for ${selectedAnimal} has just been completed by ${document.getElementById("auditor-name").value}!\n\nDownload the report here: ${fileLink}`
    };

    const emailResponse = await fetch("https://welfare-assessment-reports.hello-e9b.workers.dev/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailPayload),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Email send failed: ${emailResponse.statusText}, Response: ${errorText}`);
    }

    console.log("✅ Email sent successfully");

  } catch (error) {
    console.error("❌ Error processing upload or email:", error);const fileUrl = await uploadToR2(reportBlob, fileName);
  }
} // ✅ Closing `exportResults()`

async function submitWelfareAssessment(fileUrl) {
  console.log("📤 Sending welfare assessment to database...");

  const pathSegments = window.location.pathname.split("/");
  const siteId = /^\d{4}$/.test(pathSegments[1]) ? pathSegments[1] : null;
  if (!siteId) {
      console.error("❌ Site ID is missing or invalid.");
      return;
  }

  if (!fileUrl) {
    console.error("❌ Error: fileUrl is missing! Cannot submit assessment.");
    return;
}

  const endTime = new Date();

  const assessmentData = {
      site_id: siteId,
      animal: selectedAnimal || "Unknown",
      assessment_id: assessment_id || Date.now(),
      auditor_name: document.getElementById("auditor-name")?.value.trim().length >= 3 
        ? document.getElementById("auditor-name").value 
        : "Unknown",
      auditor_role: document.getElementById("auditor-role")?.value.trim().length >= 3 
        ? document.getElementById("auditor-role").value 
        : "Unknown",      start_time: startTime ? startTime.toISOString() : null,  
      end_time: endTime.toISOString(),
      responses: responses.length ? responses : [{ question: "N/A", answer: "N/A", evidence: "" }],  // ✅ Ensures at least one response
      file_url: fileUrl ? fileUrl : "MISSING_FILE_URL"
     };

  if (!fileUrl) {
    console.error("❌ Error: fileUrl is missing before sending the request!");
    return;  // Stop the function if fileUrl is missing
}

console.log("📄 Payload being sent:", assessmentData);

  try {
      const response = await fetch("https://save-welfare-assessments.hello-e9b.workers.dev/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assessmentData)
      });

      const responseText = await response.text(); // ✅ Capture the full server response
      if (!response.ok) {
          console.error(`❌ Server responded with ${response.status}: ${responseText}`);
          throw new Error(`HTTP error! ${response.status} - ${responseText}`);
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

  const zip = new JSZip();
  zip.file(`Welfare_assessment-${assessment_id}.pdf`, reportBlob);
  zip.file(`Welfare_assessment-${assessment_id}.csv`, csvBlob);

  zip.generateAsync({ type: "blob" }).then((zipBlob) => {
    const zipUrl = URL.createObjectURL(zipBlob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = zipUrl;
    downloadAnchor.download = `Curious-WA-${assessment_id}.zip`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(zipUrl);
  });

  console.log("✅ Report downloaded successfully.");
}