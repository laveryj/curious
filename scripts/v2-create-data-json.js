const Papa = require("papaparse");
const fs = require("fs").promises;
const https = require("follow-redirects").https;
const path = require("path");

// ORIGINAL CODE

// (async () => {
//   const configPath = path.resolve(__dirname, "../2000/assets/data/config.json");
//   let config;

//   try {
//     const configContent = await fs.readFile(configPath, "utf-8");
//     config = JSON.parse(configContent);
//   } catch (error) {
//     console.error("Failed to load config.json:", error.message);
//     return;
//   }

//   const sheetUrl = config.databaseid; // Ensure this is the correct key from your config for the Google Sheet URL
//   if (!sheetUrl) {
//     console.error("No database ID found in config.json.");
//     return;
//   }

//   console.log("Fetching data from Google Sheets database...");

//   let uniqueIdCounter = 0; // Counter to generate unique IDs

//   https.get(sheetUrl, (response) => {
//     if (response.statusCode !== 200) {
//       console.error(`Failed to fetch data. Status Code: ${response.statusCode}`);
//       response.resume();
//       return;
//     }

//     let csvData = "";

//     response.on("data", (chunk) => {
//       csvData += chunk;
//     });

//     response.on("end", async () => {
//       if (!csvData) {
//         console.error("No CSV data received from Google Sheets.");
//         return;
//       }

//       console.log("Google Sheets CSV data fetched successfully. Parsing data...");

//       Papa.parse(csvData, {
//         header: true,
//         skipEmptyLines: true,
//         complete: async (results) => {
//           if (!results.data || results.data.length === 0) {
//             console.error("No valid data found in the Google Sheets CSV.");
//             return;
//           }

//           console.log("Google Sheets CSV parsed successfully. Processing data...");

//           const exhibits = [];
//           const currentDate = new Date().toISOString();

//           results.data.forEach((row) => {
//             let exhibit = exhibits.find(e => e.exhibitID === row["Exhibit ID"]);
//             if (!exhibit) {
//               exhibit = {
//                 exhibitID: row["Exhibit ID"],
//                 exhibitName: row["Exhibit Name"],
//                 exhibitMode: row["Exhibit Mode"],
//                 exhibitStatus: row["Exhibit Status"],
//                 objects: []
//               };
//               exhibits.push(exhibit);
//             }

//             const longDescription = row["Description"] || "";
//             const shortDescription = row["Short Description"]?.trim() || // Use the Short Description if available
//               (longDescription.length > 100
//                 ? longDescription.slice(0, 100) + "..."
//                 : longDescription + (longDescription ? "..." : ""));

//             exhibit.objects.push({
//               hidden: row["Object Hidden"] || "FALSE",
//               objectID: row["Object ID"] || `OID${++uniqueIdCounter}`, // Generate unique ID if missing
//               objectType: row["Object Type"] || "",
//               nickname: row["Nickname"] || "",
//               commonName: row["Common Name"] || "Unknown",
//               scientificName: row["Scientific Name"] || "",
//               shortDescription: shortDescription, // Prioritise sheet Short Description
//               longDescription: longDescription,
//               age: row["Age"] || "",
//               size: row["Size"] || "",
//               weight: row["Weight"] || "",
//               personalityProfile: row["Personality Profile"] || "",
//               funFact: row["Fun Fact"] || "",
//               conservationStatus: row["Conservation Status"] || "Unknown",
//               conservationInfo: row["Conservation Info"] || "",
//               primaryURL: row["Primary URL"] || "",
//               primaryURLlabel: row["Primary URL Label"] || "",
//               secondaryURL: row["Secondary URL"] || "",
//               secondaryURLlabel: row["Secondary URL Label"] || "",
//               ImageURL: row["Image URL"] || "",
//               AudioURL: row["Audio URL"] || "",
//               VideoURL: row["Video URL"] || ""
//             });
//           });

//           const outputFolder = path.resolve(__dirname, "../2000/assets/data");
//           await fs.mkdir(outputFolder, { recursive: true });
//           const filePath = path.join(outputFolder, "data.json");

//           try {
//             const dataToWrite = JSON.stringify({ dateCreated: currentDate, exhibits }, null, 2);
//             await fs.writeFile(filePath, dataToWrite);
//             console.log(`Exhibits data written successfully to ${filePath}`);
//           } catch (error) {
//             console.error(`Failed to write data to ${filePath}:`, error);
//           }
//         },
//         error: (error) => {
//           console.error("Error parsing CSV:", error.message);
//         }
//       });
//     });
//   }).on("error", (error) => {
//     console.error("Error fetching CSV:", error.message);
//   });
// })();


// WITH ADDED FILTERING TO ENSURE SAME SPECIES RECEIVE SAME OID
(async () => {
  const configPath = path.resolve(__dirname, "../2054/assets/data/config.json");
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
    console.error("No database ID found in config.json.");
    return;
  }

  console.log("Fetching data from Google Sheets database...");

  let uniqueIdCounter = 0; // Counter to generate unique IDs for base IDs
  const idMap = {}; // Map to store base IDs for scientific names
  const speciesCounters = {}; // Map to store unique letter suffixes for animals in each species

  https.get(sheetUrl, (response) => {
    if (response.statusCode !== 200) {
      console.error(`Failed to fetch data. Status Code: ${response.statusCode}`);
      response.resume();
      return;
    }

    let csvData = "";

    response.on("data", (chunk) => {
      csvData += chunk;
    });

    response.on("end", async () => {
      if (!csvData) {
        console.error("No CSV data received from Google Sheets.");
        return;
      }

      console.log("Google Sheets CSV data fetched successfully. Parsing data...");

      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (!results.data || results.data.length === 0) {
            console.error("No valid data found in the Google Sheets CSV.");
            return;
          }

          console.log("Google Sheets CSV parsed successfully. Processing data...");

          const exhibits = [];
          const currentDate = new Date().toISOString();

          results.data.forEach((row) => {
            let exhibit = exhibits.find(e => e.exhibitID === row["Exhibit ID"]);
            if (!exhibit) {
              exhibit = {
                exhibitID: row["Exhibit ID"],
                exhibitName: row["Exhibit Name"],
                exhibitMode: row["Exhibit Mode"],
                exhibitStatus: row["Exhibit Status"],
                objects: []
              };
              exhibits.push(exhibit);
            }

            const longDescription = row["Description"] || "";
            const shortDescription = row["Short Description"]?.trim() ||
              (longDescription.length > 100
                ? longDescription.slice(0, 100) + "..."
                : longDescription + (longDescription ? "..." : ""));

            const scientificName = row["Scientific Name"] || "Unknown Species";
            const objectType = row["Object Type"] || "";
            let baseID;

            // Assign or retrieve the base ID for the species
            if (idMap[scientificName]) {
              baseID = idMap[scientificName];
            } else {
              // baseID = `OID${++uniqueIdCounter}`;
              baseID = `${++uniqueIdCounter}`;
              idMap[scientificName] = baseID;
              speciesCounters[scientificName] = 0; // Initialise letter counter for this species
            }

            let objectID;

            if (objectType.toLowerCase() === "animal") {
              // Generate a unique letter suffix for animals
              const suffixLetter = String.fromCharCode(65 + (speciesCounters[scientificName] || 0)); // A, B, C, ...
              objectID = `${baseID}${suffixLetter}`;
              speciesCounters[scientificName] = (speciesCounters[scientificName] || 0) + 1;
            } else {
              // Use the base ID for non-animal objects
              objectID = baseID;
            }

            exhibit.objects.push({
              hidden: row["Object Hidden"] || "FALSE",
              objectID: objectID,
              objectType: objectType,
              nickname: row["Nickname"] || "",
              commonName: row["Common Name"] || "Unknown",
              scientificName: scientificName,
              shortDescription: shortDescription,
              longDescription: longDescription,
              age: row["Age"] || "",
              size: row["Size"] || "",
              weight: row["Weight"] || "",
              personalityProfile: row["Personality Profile"] || "",
              funFact: row["Fun Fact"] || "",
              conservationStatus: row["Conservation Status"] || "Unknown",
              conservationInfo: row["Conservation Info"] || "",
              primaryURL: row["Primary URL"] || "",
              primaryURLlabel: row["Primary URL Label"] || "",
              secondaryURL: row["Secondary URL"] || "",
              secondaryURLlabel: row["Secondary URL Label"] || "",
              ImageURL: row["Image URL"] || "",
              AudioURL: row["Audio URL"] || "",
              VideoURL: row["Video URL"] || ""
            });
          });

          const outputFolder = path.resolve(__dirname, "../2054/assets/data");
          await fs.mkdir(outputFolder, { recursive: true });
          const filePath = path.join(outputFolder, "data.json");

          try {
            const dataToWrite = JSON.stringify({ dateCreated: currentDate, exhibits }, null, 2);
            await fs.writeFile(filePath, dataToWrite);
            console.log(`Exhibits data written successfully to ${filePath}`);
          } catch (error) {
            console.error(`Failed to write data to ${filePath}:`, error);
          }
        },
        error: (error) => {
          console.error("Error parsing CSV:", error.message);
        }
      });
    });
  }).on("error", (error) => {
    console.error("Error fetching CSV:", error.message);
  });
})();