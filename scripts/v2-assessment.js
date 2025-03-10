let selectedAnimal = "";
let emailSent = false; // ✅ Track whether the email has been sent
let reportBlob = null; // ✅ Store PDF blob for manual download
let csvBlob = null; // ✅ Store CSV blob for manual download
let questions = []; // Declare globally
let fileUrl = null; // Use camelCase
const pageWidth = 175;

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
        assessment_id = Date.now(); // Generates a unique timestamp
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
        ...(evidenceField ? {
            evidence: evidenceField.value
        } : {}) // ✅ Only add evidence if present
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


function addLogo(doc, logoBase64) {
  if (logoBase64) {
    const logoWidth = 40;
    const logoHeight = 11;
    const pageWidth = 175;
    const logoX = pageWidth - 13; // Align to right
    const logoY = 8; // Position at top
      doc.addImage(logoBase64, "PNG", logoX, logoY, logoWidth, logoHeight);
  } else {
      console.warn("⚠ Logo failed to load, skipping logo on this page.");
  }
}

function addFirstPageFooter(doc) {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const actualWidth = doc.internal.pageSize.width; // Get page width
  const footerTop = `This welfare assessment was captured and generated with Curious.`;
  const footerTopWidth = doc.getTextWidth(footerTop); // Get text width
  const FTxPosition = (actualWidth - footerTopWidth) / 2; // Centre horizontally
  doc.text(footerTop, FTxPosition, 280); // Position at bottom of the page
  // const footerBottom = `Learn more at http://get-curio.us`;
  const footerBottom = `Create your own at http://tools.get-curio.us`;
  const footerBottomWidth = doc.getTextWidth(footerBottom); // Get text width
  const FBxPosition = (actualWidth - footerBottomWidth) / 2; // Centre horizontally
  doc.text(footerBottom, FBxPosition, 287); // Position at bottom of the page
}

function addFooter(doc) {
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const actualWidth = doc.internal.pageSize.width; // Get page width
  const footerBottom = `Welfare Assessment Report for ${selectedAnimal} (ID: ${assessment_id})`;
  const footerBottomWidth = doc.getTextWidth(footerBottom); // Get text width
  const FBxPosition = (actualWidth - footerBottomWidth) / 2; // Centre horizontally
  doc.text(footerBottom, FBxPosition, 288); // Position at bottom of the page
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

    // Add Export button
    const exportButton = document.createElement("button");
    exportButton.textContent = "Download Results";
    exportButton.addEventListener("click", downloadReport);
    assessmentContainer.appendChild(exportButton);

    // ✅ Ensure report generation is complete
    await exportResults(); // ✅ Wait for reportBlob generation

    console.log("🛠 Debug: Checking reportBlob before upload:", reportBlob);
    if (!reportBlob) {
        console.error("❌ Report Blob is null! Cannot upload PDF.");
        return;
    }

    const fileName = `Welfare_assessment-${assessment_id}.pdf`;
    fileUrl = await uploadToR2(reportBlob, fileName); // ✅ Assign to global variable
    console.log("🛠 Debug: Received fileUrl from R2:", fileUrl);

    if (!fileUrl) {
        console.error("❌ Failed to upload report, skipping database save.");
        return;
    }

    console.log("📤 Submitting welfare assessment with file URL:", fileUrl);

    // ✅ Ensure `fileUrl` is correctly passed
    await submitWelfareAssessment(fileUrl); // ✅ No need to pass fileUrl as an argument
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
        const response = await fetch("https://get-curio.us/api/welfare-assessment-reports/upload", {
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
        fileUrl = data.url; // ✅ Ensure fileUrl is updated globally
        console.log("✅ Global fileUrl updated:", fileUrl);
        return fileUrl;

    } catch (error) {
        console.error("❌ Failed to upload PDF:", error.message, error);
        return null;
    }
}

async function exportResults() {
    console.log("📤 Exporting results...");
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
        console.error("❌ jsPDF library is not loaded.");
        return;
    }
    
    const zip = new JSZip();
    const doc = new jsPDF();

    // Convert the logo to Base64 first (wait for it to complete)
    let logoBase64;
    try {
        logoBase64 = await getBase64Image("/images/logo-dark.png");
    } catch (error) {
        console.warn("⚠ Logo failed to load, continuing without it.");
        logoBase64 = null;
    }
    
    addLogo(doc, logoBase64);

    let csvContent = "Question,Answer,Evidence\n";
    let yesCount = 0;
    let noCount = 0;
    let totalPossible = 0;
    let totalAchieved = 0;
    let welfareIssues = [];
    let notApplicableCount = 0;
    let notWitnessedCount = 0;
    const endTime = new Date();
    const pageHeight = 280; // Limit before adding a new page
    const firstSectionLength = 5;

    let yPos = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Animal Welfare Assessment`, 15, yPos);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    yPos += 10;
    doc.text(`Assessment ID: ${assessment_id} - ${selectedAnimal}`, 15, yPos);
    yPos += 15;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Assessment Details`, 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    yPos += 7;

    doc.setFont("helvetica", "bold");
    doc.text(`Name:`, 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${document.getElementById("auditor-name").value} - ${document.getElementById("auditor-role").value}`, 29, yPos);
    yPos += 5;

    doc.setFont("helvetica", "bold");
    doc.text(`ID:`, 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${assessment_id}`, 22, yPos);
    yPos += 5;

    doc.setFont("helvetica", "bold");
    doc.text(`Date:`, 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${new Date().toLocaleDateString()}`, 27, yPos);
    yPos += 5;

    doc.setFont("helvetica", "bold");
    doc.text(`Animal:`, 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${selectedAnimal}`, 32, yPos);
    yPos += 5;

    doc.setFont("helvetica", "bold");
    doc.text(`Start time:`, 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${startTime ? startTime.toLocaleTimeString() : "N/A"}`, 37, yPos);
    yPos += 5;

    doc.setFont("helvetica", "bold");
    doc.text(`End time:`, 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${endTime.toLocaleTimeString()}`, 36, yPos);

    yPos += 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`About This Assessment`, 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    yPos += 7;

    let wrappedText = doc.splitTextToSize(
        "Animal welfare assessments are an important tool for providing a data-driven approach to animal welfare. They help to identify areas of concern and track improvements over time. If issues are identified, they form part of a welfare action plan which can be used to address the problems. This report provides a summary of the assessment results for the animal or animals listed above.",
        pageWidth
    );
    doc.text(wrappedText, 15, yPos);
    yPos += 35;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Questions`, 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    yPos += 7;

    wrappedText = doc.splitTextToSize(
        "The questions in this report are taken from the BIAZA Animal Welfare Assessment Tool. They are designed to assess the welfare of animals in zoos and aquariums. The questions are divided into sections, each of which assesses a different aspect of animal welfare.",
        pageWidth
    );
    doc.text(wrappedText, 15, yPos);
    yPos += 25;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Answers`, 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    yPos += 7;

    wrappedText = doc.splitTextToSize(
        "Answers are recorded as either 'Yes', 'No', 'Not Applicable' or 'Not Witnessed'. 'Yes' indicates that the welfare standard is met, 'No' indicates that the welfare standard is not met, 'Not Applicable' indicates that the question was not relevant to the assessment, and 'Not Witnessed' indicates that the behaviour or welfare indicator was not observed during the assessment period.",
        pageWidth
    );
    doc.text(wrappedText, 15, yPos);
    yPos += 35;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Welfare Score`, 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    yPos += 7;

    wrappedText = doc.splitTextToSize(
        "The welfare score is calculated as a percentage which represents the number of 'Yes' responses as a proportion of the total number of applicable questions. The first 5 questions provide environmental context (e.g. weather, visitation) and are excluded from the score. Answers of Not Applicable or Not Witnessed are also excluded from the score.",
        pageWidth
    );
    doc.text(wrappedText, 15, yPos);

    addFirstPageFooter(doc);

    doc.addPage();
    addLogo(doc, logoBase64);
    addFooter(doc);
    yPos = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Assessment Answers`, 15, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    yPos += 10;

      // Iterate over responses and categorize answers
      responses.forEach((res, index) => {

        if (yPos + 30 > pageHeight) {
          doc.addPage();
          addLogo(doc, logoBase64);
          addFooter(doc);
          yPos = 20;
        }

        let wrappedQuestion = doc.splitTextToSize(`${index + 1}. ${res.question}`, pageWidth);
        doc.text(wrappedQuestion, 15, yPos);
        yPos += wrappedQuestion.length * 7;

        doc.setFont("helvetica", "normal");

        let wrappedAnswer = doc.splitTextToSize(`Answer: ${res.answer}`, pageWidth);
        doc.text(wrappedAnswer, 20, yPos);
        yPos += wrappedAnswer.length * 7;

        let wrappedEvidence = doc.splitTextToSize(`Evidence: ${res.evidence || "None"}`, pageWidth);
        doc.text(wrappedEvidence, 20, yPos);
        yPos += wrappedEvidence.length * 7 + 5;

        csvContent += `"${res.question.replace(/"/g, '""')}","${res.answer}","${(res.evidence || "").replace(/"/g, '""')}"\n`;

         if (index >= firstSectionLength) {
             if (res.answer === "Yes") {
                 totalAchieved++;
                 totalPossible++;
                 yesCount++;
             } else if (res.answer === "No") {
                 totalPossible++;
                 noCount++;
                 welfareIssues.push(res.question);
             } else if (res.answer === "N/A") {
                 notApplicableCount++;
             } else if (res.answer === "N/W") {
                 notWitnessedCount++;
             }
         }
      });

// Calculate Welfare Score
let welfareScore = totalPossible > 0 ? ((totalAchieved / totalPossible) * 100).toFixed(2) : "N/A";

    doc.addPage();
    addLogo(doc, logoBase64);
    addFooter(doc);
    yPos = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Assessment Results`, 15, yPos);
    yPos += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`${yesCount} questions were answered 'yes' and deemed to meet the required standard`, 15, yPos);
    yPos += 5;
    doc.text(`${noCount} questions were answered 'no' and deemed not to meet the required standard`, 15, yPos);
    yPos += 5;
    doc.text(`${notApplicableCount} questions were not applicable to this assessment`, 15, yPos);
    yPos += 5;
    doc.text(`${notWitnessedCount} questions were not witnessed during the assessment period`, 15, yPos);
    yPos += 10;

    // Welfare Score
    doc.setFont("helvetica", "bold");
    doc.text(`Calculated Welfare Score:`, 15, yPos);
    doc.setFont("helvetica", "normal");
    doc.text(`${welfareScore}%`,70, yPos);
    yPos += 20;

        // Welfare Action Plan
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(`Welfare Action Plan`, 15, yPos);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        yPos += 10;

        if (welfareIssues.length > 0) {
        doc.text("The following items were identified as areas of concern during this assessment:", 15, yPos);
        yPos += 10;

        welfareIssues.forEach(issue => {
            if (yPos > pageHeight - 15) {
                doc.addPage();
                addLogo(doc, logoBase64);
                addFooter(doc);
                yPos = 20;
            }
            doc.text("- " + issue, 20, yPos);
            yPos += 7;
        });
    }
    else {
        doc.text("No welfare issues were identified during this assessment.", 15, yPos);
    }

    reportBlob = doc.output("blob");
    console.log("✅ PDF Blob Generated:", reportBlob);
    csvBlob = new Blob([csvContent], {
        type: "text/csv"
    });

    console.log("✅ PDF & CSV Generated");

    // ✅ Upload PDF to Cloudflare R2
    const fileName = `Welfare_assessment-${assessment_id}.pdf`;
    try {
        const formData = new FormData();
        formData.append("file", reportBlob, fileName);

        const uploadResponse = await fetch("https://get-curio.us/api/welfare-assessment-reports/upload", {
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
            // recipient: 'hello@get-curio.us',
            subject: `🔔 New Welfare Assessment: ${selectedAnimal}`,
            // message: `A welfare assessment (ID ${assessment_id}) for ${selectedAnimal} has just been completed by ${document.getElementById("auditor-name").value}!\n\nDownload the report here: ${fileLink} or view all saved welfare assessments here: https://get-curio.us/${siteId}/assessment-history.html`
            message: `A welfare assessment (ID ${assessment_id}) for ${selectedAnimal} has just been completed by ${document.getElementById("auditor-name").value}!\n\nDownload the report here: ${fileLink}`
        };

        const emailResponse = await fetch("https://get-curio.us/api/welfare-assessment-reports/send-email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(emailPayload),
        });

        if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            throw new Error(`Email send failed: ${emailResponse.statusText}, Response: ${errorText}`);
        }

        console.log("✅ Email sent successfully");

    } catch (error) {
        console.error("❌ Error processing upload or email:", error);
        const fileUrl = await uploadToR2(reportBlob, fileName);
    }
  }

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
        auditor_name: document.getElementById("auditor-name")?.value.trim().length >= 3 ?
            document.getElementById("auditor-name").value : "Unknown",
        auditor_role: document.getElementById("auditor-role")?.value.trim().length >= 3 ?
            document.getElementById("auditor-role").value : "Unknown",
        start_time: startTime ? startTime.toISOString() : null,
        end_time: endTime.toISOString(),
        responses: responses.length ? responses : [{
            question: "N/A",
            answer: "N/A",
            evidence: ""
        }], // ✅ Ensures at least one response
        file_url: fileUrl ? fileUrl : "MISSING_FILE_URL"
    };

    if (!fileUrl) {
        console.error("❌ Error: fileUrl is missing before sending the request!");
        return; // Stop the function if fileUrl is missing
    }

    console.log("📄 Payload being sent:", assessmentData);

    try {
        const response = await fetch("https://get-curio.us/api/save-welfare-assessments/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
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

function downloadReport() {
    if (!reportBlob || !csvBlob) {
        console.error("❌ Report not available for download.");
        return;
    }

    const zip = new JSZip();
    zip.file(`Welfare_assessment-${assessment_id}.pdf`, reportBlob);
    zip.file(`Welfare_assessment-${assessment_id}.csv`, csvBlob);

    zip.generateAsync({
        type: "blob"
    }).then((zipBlob) => {
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

async function getBase64Image(url) {
  try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
      });
  } catch (error) {
      console.error("❌ Failed to load logo image:", error);
      return null;
  }
}
