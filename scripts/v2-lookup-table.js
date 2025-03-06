async function createLookupTable(jsonFilePath) {
    try {
        // Fetch the JSON data
        const response = await fetch(jsonFilePath);
        if (!response.ok) throw new Error(`Failed to fetch JSON: ${response.status}`);
        const data = await response.json();

        // Create lookup tables
        const exhibitLookup = {};
        const objectLookup = {};

        // Populate lookup tables
        data.exhibits.forEach((exhibit) => {
            // Map exhibit ID to name
            exhibitLookup[exhibit.exhibitID] = exhibit.exhibitName;

            // Map object IDs to names
            exhibit.objects.forEach((object) => {
                objectLookup[object.objectID] = object.commonName || object.nickname || "";
            });
        });

        console.log("Exhibit Lookup Table:", exhibitLookup);
        console.log("Object Lookup Table:", objectLookup);

        // Return the lookup tables
        return { exhibitLookup, objectLookup };
    } catch (error) {
        console.error("Error creating lookup tables:", error);
    }
}

// Example usage
document.addEventListener("DOMContentLoaded", async () => {
    const lookupTables = await createLookupTable("./assets/data/data.json");
    console.log("Lookup Tables:", lookupTables);
});