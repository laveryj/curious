const Papa = require("papaparse");
const fs = require("fs").promises;
const https = require("follow-redirects").https;
const path = require("path");

(async () => {
  // Load config.json
  const configPath = path.resolve(__dirname, "assets", "data", "config.json");
  let config;

  try {
    const configContent = await fs.readFile(configPath, "utf-8");
    config = JSON.parse(configContent);
  } catch (error) {
    console.error("Failed to load config.json:", error.message);
    return;
  }

  const sheetUrl = config.databaseid;
  if (!sheetUrl) {
    console.error("No sheetUrl found in config.json.");
    return;
  }

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
            const exhibitMode = row["Exhibit Mode"]?.trim() || "standard";

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
                "exhibit-mode": exhibitMode, // Add exhibit mode here
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
            const siteFolder = path.resolve(__dirname, "assets", "data", siteId);

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
              // Check if file exists and compare contents
              let existingData = null;
              try {
                const fileContent = await fs.readFile(filePath, "utf-8");
                existingData = JSON.parse(fileContent);
              } catch {
                console.log(`No existing data.json found at ${filePath}. It will be created.`);
              }

              const newData = JSON.stringify(siteData, null, 2);

              // Only write file if the content is different
              if (existingData && JSON.stringify(existingData, null, 2) === newData) {
                console.log(`No changes detected for ${filePath}. Skipping file write.`);
              } else {
                await fs.writeFile(filePath, newData);
                console.log(`Updated: ${filePath}`);
              }
            } catch (error) {
              console.error(`Error writing to ${filePath}:`, error.message);
            }
          });

          await Promise.all(writePromises);

          console.log("All data.json files processed successfully.");
        },
        error: (error) => {
          console.error("Error parsing CSV:", error.message);
        },
      });
    });
  }).on("error", (err) => {
    console.error("Error fetching CSV:", err.message);
  });
})();