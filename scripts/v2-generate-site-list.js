const fs = require("fs");
const path = require("path");

(async () => {
  try {
    const rootDir = path.resolve(__dirname, "..");
    const dataDir = path.join(rootDir, "assets", "data");
    const siteFolders = [];

    // Read root directory and filter folders matching four-digit names
    const items = await fs.promises.readdir(rootDir, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory() && /^\d{4}$/.test(item.name)) {
        siteFolders.push(item.name);
      }
    }

    // Ensure the data directory exists
    await fs.promises.mkdir(dataDir, { recursive: true });

    // Write the site-list.json file
    const sitesListPath = path.join(dataDir, "site-list.json");
    await fs.promises.writeFile(
      sitesListPath,
      JSON.stringify({ sites: siteFolders }, null, 2),
      "utf-8"
    );

    console.log(`Successfully generated ${sitesListPath}`);
  } catch (error) {
    console.error("Error generating site list:", error);
    process.exit(1);
  }
})();