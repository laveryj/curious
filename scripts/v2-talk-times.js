document.addEventListener("DOMContentLoaded", () => {
  const configUrl = "./assets/data/config.json"; // Path to the config.json file

function displaySiteInfo(config) {
  // Locate the table elements
  const talkTimesTable = document.getElementById("talk-times-table");
  const experiencesTable = document.getElementById("experiences-table");

  // Populate Talk Times
  if (talkTimesTable) {
    if (config.talkTimes && config.talkTimes.length > 0) {
      talkTimesTable.innerHTML = `
        <thead>
          <tr>
          </tr>
        </thead>
        <tbody>
          ${config.talkTimes
            .map(
              (talk) =>
                `<tr>
                  <td>${talk.talkName}</td> <!-- Updated key to match new JSON format -->
                  <td>${talk.talkTime}</td> <!-- Updated key to match new JSON format -->
                </tr>`
            )
            .join("")}
        </tbody>
      `;
    } else {
      talkTimesTable.innerHTML = `
        <thead>
          <tr>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="2">No talk times available</td>
          </tr>
        </tbody>
      `;
    }
  } else {
    console.error("Error: 'talk-times-table' element not found in the DOM.");
  }

  // Populate Experiences
  if (experiencesTable) {
    if (config.experiences && config.experiences.length > 0) {
      experiencesTable.innerHTML = `
        <thead>
          <tr>
          </tr>
        </thead>
        <tbody>
          ${config.experiences
            .map(
              (experience) =>
                `<tr>
                  <td>
                    ${experience.experienceLink 
                      ? `<a href="${experience.experienceLink}" target="_blank">${experience.experienceName}</a>` // Updated keys
                      : experience.experienceName} <!-- Updated key -->
                  </td>
                  <td>${experience.experiencePrice}</td> <!-- Updated key -->
                </tr>`
            )
            .join("")}
        </tbody>
      `;
    } else {
      experiencesTable.innerHTML = `
        <thead>
          <tr>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="2">No experiences available</td>
          </tr>
        </tbody>
      `;
    }

    // Add "Book Today!" subheading below the table
    const bookTodaySubheading = document.createElement("h3");
    bookTodaySubheading.textContent = "Click the link & book today!";
    bookTodaySubheading.style.textAlign = "center"; // Centre the text
    experiencesTable.parentElement.appendChild(bookTodaySubheading);
  } else {
    console.error("Error: 'experiences-table' element not found in the DOM.");
  }
}
});
