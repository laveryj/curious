// Converts CSV text into structured data.
function parseCSV(csvText) {
    const lines = csvText.split("\n").filter((line) => line.trim() !== "" && !line.startsWith("#"));
    const [headerLine, ...dataLines] = lines;
    const headers = headerLine.split(",").map((header) => header.trim());
    return dataLines.map((line) =>
        line.split(",").map((cell) => cell.trim()).reduce((acc, value, index) => {
            acc[headers[index]] = value;
            return acc;
        }, {})
    );
}

// Extracts URL parameters (EID, OID)
function parseQueryString(queryString) {
    if (!queryString || !queryString.includes("?")) return { exhibitId: null, speciesId: null };
    const params = new URLSearchParams(queryString.split("?")[1]);
    return {
        exhibitId: params.get("EID") || null,
        speciesId: params.get("OID") || params.get("object-id") || null,
    };
}

// Creates a lookup for exhibits and objects
function createExhibitLookup(data) {
    const lookup = {};
    data.exhibits.forEach((exhibit) => {
        lookup[exhibit.exhibitID] = {
            exhibitName: exhibit.exhibitName,
            objects: exhibit.objects.reduce((objLookup, obj) => {
                objLookup[obj.objectID] = {
                    commonName: obj.commonName || "Unknown Species",
                    nickname: obj.nickname || "",
                };
                return objLookup;
            }, {}),
        };
    });
    return lookup;
}

// Aggregates views and engagement data
function calculateMetrics(data, exhibitLookup, siteId) {
    const metricsByQueryString = {};

    data.forEach((row) => {
        const queryString = row["Landing page + query string"];
        let pageTitle = row["Page title"];

        if (!queryString || !queryString.includes(`${siteId}`)) return;

        const { exhibitId, speciesId } = parseQueryString(queryString);
        const views = parseInt(row.Views, 10) || 0;
        const engagementTime = parseFloat(row["Average engagement time per active user"]) || 0;

        if (!metricsByQueryString[queryString]) {
            const exhibit = exhibitLookup[exhibitId] || {};
            const object = exhibit.objects?.[speciesId] || {};

            if (!pageTitle || pageTitle === "(not set)") {
                const urlParts = queryString.split("/");
                const filename = urlParts[urlParts.length - 1].split("?")[0];
                pageTitle = exhibit.exhibitName || filename || "Unknown Page";
            }

            let pageDisplay = exhibit.exhibitName || pageTitle;
            if (exhibitId && speciesId) {
                pageDisplay = `${exhibit.exhibitName}: ${object.commonName || "Unknown Species"}`;
            }

            metricsByQueryString[queryString] = {
                pageDisplay,
                exhibitId,
                speciesId,
                exhibitName: exhibit.exhibitName || "",
                speciesName: object.commonName || "",
                totalViews: 0,
                totalEngagementTime: 0,
            };
        }

        metricsByQueryString[queryString].totalViews += views;
        metricsByQueryString[queryString].totalEngagementTime += engagementTime;
    });

    return Object.values(metricsByQueryString).map((entry) => ({
        ...entry,
        avgEngagementTime: (entry.totalEngagementTime / (entry.totalViews || 1)).toFixed(2),
    }));
}

// Fetches CSV & JSON data, processes it, and returns metrics
async function fetchAndDisplayCSV() {
    const pathSegments = window.location.pathname.split("/");
    const siteId = /^\d{4}$/.test(pathSegments[1]) ? pathSegments[1] : null;

    if (!siteId) {
        console.error("Site ID is missing or invalid in the URL path.");
        return [];
    }

    try {
        const csvResponse = await fetch(`/${siteId}/assets/data/analytics.csv`, { cache: "no-store" });
        const jsonResponse = await fetch(`/${siteId}/assets/data/data.json`, { cache: "no-store" });

        if (!csvResponse.ok) throw new Error(`Failed to fetch CSV: ${csvResponse.statusText}`);
        if (!jsonResponse.ok) throw new Error(`Failed to fetch JSON: ${jsonResponse.statusText}`);

        const csvText = await csvResponse.text();
        const exhibitData = await jsonResponse.json();

        const rows = parseCSV(csvText);
        const exhibitLookup = createExhibitLookup(exhibitData);

        const metrics = calculateMetrics(rows, exhibitLookup, siteId)
            .filter((row) => row.exhibitName !== "Unknown Exhibit");

        console.log("Metrics:", metrics);
        renderDashboard(metrics);
        return metrics;  // ✅ Ensure metrics are returned for use in generateCharts()
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
}

// Generates the analytics table
function renderDashboard(metrics) {
    const table = document.getElementById("analytics-table");
    if (!table) return;

    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");

    metrics.sort((a, b) => b.totalViews - a.totalViews);

    thead.innerHTML = `<tr><th>Page</th><th>Views</th><th>AET</th></tr>`;
    tbody.innerHTML = metrics
        .map((row) => `<tr><td>${row.pageDisplay}</td><td>${row.totalViews}</td><td>${row.avgEngagementTime}</td></tr>`)
        .join("");

    tbody.innerHTML += `<tr style="font-weight: bold;"><td>Total:</td><td>${metrics.reduce((sum, row) => sum + row.totalViews, 0)}</td><td>-</td></tr>`;
}

// Generates Charts
function generateCharts(metrics) {
    if (!metrics.length) return console.error("No data for charts.");

    const viewsByPage = metrics.map(row => ({ label: row.pageDisplay, value: row.totalViews }));
    const engagementByPage = metrics.map(row => ({ label: row.pageDisplay, value: parseFloat(row.avgEngagementTime) }));

    function createChart(ctxId, type, labels, datasetLabel, data) {
        const ctx = document.getElementById(ctxId);
        if (!ctx) return;

        new Chart(ctx, {
            type,
            data: {
                labels,
                datasets: [{
                    label: datasetLabel,
                    data,
                    backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56", "#4BC0C0"],
                    borderWidth: 1,
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    createChart("chart-page-views", "bar", viewsByPage.map(d => d.label), "Total Page Views", viewsByPage.map(d => d.value));
    createChart("chart-avg-engagement", "bar", engagementByPage.map(d => d.label), "Avg Engagement Time", engagementByPage.map(d => d.value));
}

// Run functions when DOM is fully loaded
document.addEventListener("DOMContentLoaded", async function () {
    const metrics = await fetchAndDisplayCSV();
    generateCharts(metrics);
});