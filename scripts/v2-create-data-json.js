const Papa = require("papaparse");
const fs = require("fs").promises;
const https = require("follow-redirects").https;
const path = require("path");

(async () => {
    const basePath = path.resolve(__dirname, ".."); // Base directory containing site directories
    const logFilePath = path.join(basePath, "update_log.txt"); // Log file

    async function logMessage(message) {
        console.log(message);
        await fs.appendFile(logFilePath, message + "\n", "utf-8");
    }

    try {
        const directories = await fs.readdir(basePath, { withFileTypes: true });
        const siteDirs = directories.filter(dir => dir.isDirectory() && /^\d{4}$/.test(dir.name));

        if (siteDirs.length === 0) {
            await logMessage("No valid site directories found.");
            return;
        }

        for (const dir of siteDirs) {
            const siteId = dir.name;
            const configPath = path.join(basePath, siteId, "assets/data/config.json");
            const outputPath = path.join(basePath, siteId, "assets/data/data.json");

            try {
                const configContent = await fs.readFile(configPath, "utf-8");
                const config = JSON.parse(configContent);

                if (!config.databaseid) {
                    await logMessage(`Site ${siteId}: Missing 'databaseid' in config.json.`);
                    continue;
                }

                await logMessage(`Site ${siteId}: Fetching data from Google Sheets...`);

                const csvData = await fetchCSV(config.databaseid);
                if (!csvData) {
                    await logMessage(`Site ${siteId}: Failed to fetch or parse Google Sheets data.`);
                    continue;
                }

                const exhibits = processCSVData(csvData);
                if (!exhibits) {
                    await logMessage(`Site ${siteId}: Error processing CSV data.`);
                    continue;
                }

                const currentDate = new Date().toISOString();
                const dataToWrite = JSON.stringify({ dateCreated: currentDate, exhibits }, null, 2);

                await fs.mkdir(path.dirname(outputPath), { recursive: true });
                await fs.writeFile(outputPath, dataToWrite);

                await logMessage(`Site ${siteId}: data.json updated successfully.`);

            } catch (error) {
                await logMessage(`Site ${siteId}: Error processing site - ${error.message}`);
                continue;
            }
        }

        await logMessage("Update process completed.");

    } catch (error) {
        console.error("Critical error:", error.message);
        await logMessage(`Critical error: ${error.message}`);
    }

    async function fetchCSV(sheetUrl) {
        return new Promise((resolve, reject) => {
            let csvData = "";

            https.get(sheetUrl, (response) => {
                if (response.statusCode !== 200) {
                    return reject(new Error(`HTTP status ${response.statusCode}`));
                }

                response.on("data", (chunk) => {
                    csvData += chunk;
                });

                response.on("end", () => {
                    resolve(csvData);
                });
            }).on("error", (error) => {
                reject(error);
            });
        });
    }

    function processCSVData(csvText) {
        const { data, errors } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        if (errors.length) {
            console.error("CSV Parsing errors:", errors);
            return null;
        }

        const exhibits = [];
        const idMap = {};
        const speciesCounters = {};

        data.forEach(row => {
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
                    ? longDescription.slice(0, 80) + "..."
                    : longDescription + (longDescription ? "..." : ""));

            const scientificName = row["Scientific Name"] || "";
            let baseID;

            if (idMap[scientificName]) {
                baseID = idMap[scientificName];
            } else {
                baseID = `${Object.keys(idMap).length + 1}`;
                idMap[scientificName] = baseID;
                speciesCounters[scientificName] = 0;
            }

            let objectID;
            if ((row["Object Type"] || "").toLowerCase() === "animal") {
                const suffixLetter = String.fromCharCode(65 + speciesCounters[scientificName]);
                objectID = `${baseID}${suffixLetter}`;
                speciesCounters[scientificName] += 1;
            } else {
                objectID = baseID;
            }

            exhibit.objects.push({
                hidden: row["Object Hidden"] || "FALSE",
                objectID,
                objectType: row["Object Type"] || "",
                nickname: row["Nickname"] || "",
                commonName: row["Common Name"] || "Unknown Object",
                scientificName,
                shortDescription,
                longDescription,
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

        return exhibits;
    }
})();