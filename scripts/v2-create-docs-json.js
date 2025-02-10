const fs = require("fs");
const path = require("path");

// Adjust paths relative to the scripts directory
const rootDir = path.join(__dirname, ".."); // Move up from /scripts/
const docsDir = path.join(rootDir, "assets", "docs");
const jsonFilePath = path.join(rootDir, "assets", "data", "docs.json");

// Function to update docs.json
function updateDocsJson() {
  fs.readdir(docsDir, (err, files) => {
    if (err) {
      console.error("Error reading docs directory:", err);
      return;
    }

    // Filter out only files (ignores directories)
    const docs = files
      .filter(file => fs.statSync(path.join(docsDir, file)).isFile())
      .map(file => ({
        name: file, // Use filename as default display name
        file: file
      }));

    // Save to JSON
    fs.writeFile(jsonFilePath, JSON.stringify(docs, null, 2), (err) => {
      if (err) {
        console.error("Error writing docs.json:", err);
      } else {
        console.log("docs.json updated successfully!");
      }
    });
  });
}

// Run the function
updateDocsJson();