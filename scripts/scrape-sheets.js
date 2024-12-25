const Papa = require("papaparse");
const fs = require("fs");
const https = require("https");
const path = require("path");

const sheetUrl = "https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:csv"; // Replace <SHEET_ID>

https.get(sheetUrl, (response) => {
  let csvData = "";

  response.on("data", (chunk) => {
    csvData += chunk;
  });

  response.on("end", () => {
    // Parse CSV with Papa Parse
    Papa.parse(csvData, {
      header: true,
      complete: (results) => {
        const siteExhibits = {};

        results.data.forEach((row) => {
          const siteId = row["Site ID"];
          const exhibitId = row["Exhibit ID"];

          if (!siteId || !exhibitId) return; // Skip rows without Site ID or Exhibit ID

          // Initialize site if it doesn't exist
          if (!siteExhibits[siteId]) {
            siteExhibits[siteId] = {};
          }

          // Initialize exhibit if it doesn't exist
          if (!siteExhibits[siteId][exhibitId]) {
            siteExhibits[siteId][exhibitId] = {
              "exhibit-id": exhibitId,
              "exhibit-name": row["Exhibit Name"],
              "exhibit-mode": "standard",
              species: [],
            };
          }

          // Add species to the exhibit
          siteExhibits[siteId][exhibitId].species.push({
            "species-id": row["Species ID"],
            commonName: row["Common Name"],
            scientificName: row["Scientific Name"],
            shortDescription: row["Short Description"],
            longDescription: row["Long Description"],
            funFact: row["Fun Fact"],
            conservationStatus: row["Conservation Status"],
            fishBaseURL: row["FishBase URL"],
            externalURL: row["External URL"],
            imageURL: row["Image URL"],
            audioURL: row["Audio URL"],
          });
        });

        // Write data.json files for each site
        Object.keys(siteExhibits).forEach((siteId) => {
          const siteFolder = path.join(__dirname, siteId); // Path to the site folder

          // Create the folder if it doesn't exist
          if (!fs.existsSync(siteFolder)) {
            fs.mkdirSync(siteFolder, { recursive: true });
            console.log(`Created folder: ${siteFolder}`);
          }

          const exhibits = Object.values(siteExhibits[siteId]);
          const siteData = { exhibits };

          const filePath = path.join(siteFolder, "data.json");
          fs.writeFileSync(filePath, JSON.stringify(siteData, null, 2));
          console.log(`Generated ${filePath}`);
        });
      },
    });
  });
}).on("error", (err) => {
  console.error("Error fetching CSV:", err.message);
});