const Papa = require("papaparse");
const fs = require("fs").promises;
const https = require("follow-redirects").https;
const path = require("path");

// Correct Google Sheets URL for CSV export
const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQN7Vc3sLFfDaVF-7eRmR9Z_mvAiLwcB6K5slycdF2rajSNMMIRDo9mkvk4SNr7RFckWuTUD_2X2Khy/pub?output=csv";

console.log("Fetching data from Google Sheets...");

https.get(sheetUrl, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to fetch data. Status Code: ${response.statusCode}`);
    response.resume(); // Consume response to free resources
    return;
  }

  let csvData = "";

  // Collect CSV data in chunks
  response.on("data", (chunk) => {
    csvData += chunk;
  });

  response.on("end", async () => {
    if (!csvData) {
      console.error("No CSV data received.");
      return;
    }

    console.log("CSV data fetched successfully. Parsing data...");

    // Parse CSV with Papa Parse
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (!results.data || results.data.length === 0) {
          console.error("No valid data found in the CSV.");
          return;
        }

        console.log("CSV parsed successfully. Processing data...");

        const siteExhibits = {};

        results.data.forEach((row, index) => {
          const siteId = row["Site ID"]?.trim();
          const exhibitId = row["Exhibit ID"]?.trim();

          if (!siteId || !exhibitId) {
            console.warn(`Skipping row ${index + 1}: Missing Site ID or Exhibit ID. Row:`, row);
            return;
          }

          // Initialize site if it doesn't exist
          if (!siteExhibits[siteId]) {
            siteExhibits[siteId] = {};
          }

          // Initialize exhibit if it doesn't exist
          if (!siteExhibits[siteId][exhibitId]) {
            siteExhibits[siteId][exhibitId] = {
              "exhibit-id": exhibitId,
              "exhibit-name": row["Exhibit Name"] || "Unnamed Exhibit",
              "exhibit-mode": "standard",
              species: [],
            };
          }

          // Add species to the exhibit
          siteExhibits[siteId][exhibitId].species.push({
            "species-id": row["Species ID"] || `unknown-${index + 1}`,
            commonName: row["Common Name"] || "Unknown",
            scientificName: row["Scientific Name"] || "Unknown",
            shortDescription: row["Short Description"] || "",
            longDescription: row["Long Description"] || "",
            funFact: row["Fun Fact"] || "",
            conservationStatus: row["Conservation Status"] || "Unknown",
            fishBaseURL: row["FishBase URL"] || "",
            externalURL: row["External URL"] || "",
            imageURL: row["Image URL"] || "",
            audioURL: row["Audio URL"] || "",
          });
        });

        console.log("Data processing complete. Writing data.json files...");

        const writePromises = Object.keys(siteExhibits).map(async (siteId) => {
          const siteFolder = path.resolve(__dirname, "..", siteId);

          try {
            await fs.mkdir(siteFolder, { recursive: true });
            console.log(`Ensured folder exists: ${siteFolder}`);
          } catch (error) {
            console.error(`Error creating folder ${siteFolder}:`, error.message);
            return;
          }

          const exhibits = Object.values(siteExhibits[siteId]);
          const siteData = { exhibits };

          const filePath = path.join(siteFolder, "data.json");

          try {
            await fs.writeFile(filePath, JSON.stringify(siteData, null, 2));
            console.log(`Overwritten: ${filePath}`);
          } catch (error) {
            console.error(`Error writing to ${filePath}:`, error.message);
          }
        });

        await Promise.all(writePromises);

        console.log("All data.json files written successfully.");
      },
      error: (error) => {
        console.error("Error parsing CSV:", error.message);
      },
    });
  });
}).on("error", (err) => {
  console.error("Error fetching CSV:", err.message);
});