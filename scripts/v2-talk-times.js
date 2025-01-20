function displayTalkTimes(config) {
  // Locate the table elements
  const talkTimesTable = document.getElementById("talk-times-table");
  const experiencesTable = document.getElementById("experiences-table");

  // Get the current day
  const currentDay = new Date().toLocaleDateString("en-GB", { weekday: "long" });

  // Helper function to filter talks based on the day
  function filterTalksByDay(talks) {
    return talks.filter(talk =>
      talk.days.includes("Daily") ||
      talk.days.includes(currentDay) ||
      (talk.days.includes("Weekends") && (currentDay === "Saturday" || currentDay === "Sunday"))
    );
  }

  // Populate Talk Times
  if (talkTimesTable) {
    if (config.talkTimes && config.talkTimes.length > 0) {
      // Filter talks by day
      const filteredTalks = filterTalksByDay(config.talkTimes);

      if (filteredTalks.length > 0) {
        talkTimesTable.innerHTML = `
          <thead>
          </thead>
          <tbody>
            ${filteredTalks
              .map(
                (talk) =>
                  `<tr>
                    <td>${talk.name}</td>
                    <td>${talk.time}</td>
                  </tr>`
              )
              .join("")}
          </tbody>
        `;
      } else {
        talkTimesTable.innerHTML = `
          <thead>
          </thead>
          <tbody>
            <tr>
              <td colspan="2">No talk times available today</td>
            </tr>
          </tbody>
        `;
      }
    } else {
      talkTimesTable.innerHTML = `
        <thead>
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
        </thead>
        <tbody>
          ${config.experiences
            .map(
              (experience) =>
                `<tr>
                  <td>${experience.name}</td>
                  <td>${experience.price}</td>
                  <td>
                    ${
                      experience.link
                        ? `<a href="${experience.link}" target="_blank">Book now</a>`
                        : ""
                    }
                  </td>
                </tr>`
            )
            .join("")}
        </tbody>
      `;
    } else {
      experiencesTable.innerHTML = `
        <thead>
        </thead>
        <tbody>
          <tr>
            <td colspan="3">No experiences available</td>
          </tr>
        </tbody>
      `;
    }
  } else {
    console.error("Error: 'experiences-table' element not found in the DOM.");
  }
}