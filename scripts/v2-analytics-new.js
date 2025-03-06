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

    if (!table) {
        console.error("Table element not found.");
        return;
    }

    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    const totalViews = metrics.reduce((sum, row) => sum + row.totalViews, 0);
    const totalEngagementTime = metrics.reduce((sum, row) => sum + row.totalEngagementTime, 0);
    const totalAvgEngagementTime = (totalEngagementTime / totalViews).toFixed(2);

    // ✅ Sort metrics by total page views (descending order)
    metrics.sort((a, b) => b.totalViews - a.totalViews);

    thead.innerHTML = `
    <tr>
        <th style="text-align: inherit;">Page</th>
        <th>Views</th>
        <th>AET</th>
    </tr>
    `;

    tbody.innerHTML = metrics
        .map((row) => `
            <tr>
                <td style="text-align: inherit;">${row.pageDisplay || ""}</td>
                <td>${row.totalViews}</td>
                <td>${row.avgEngagementTime}</td>
            </tr>
        `)
        .join("");

    tbody.innerHTML += `
        <tr style="font-weight: bold;">
            <td style="text-align: right;">Totals:</td>
            <td>${totalViews}</td>
            <td>${totalAvgEngagementTime}</td>
        </tr>
    `;
}

// Generates Charts
function generateCharts(metrics) {
    if (!metrics.length) {
        console.error("No data available for charts.");
        return;
    }

    // 📊 DATA PROCESSING 📊
    
    // Page Views Over Time
    const viewsOverTimeData = Object.entries(metrics.reduce((acc, row) => {
        if (!row.timestamp) return acc;
        acc[row.timestamp] = (acc[row.timestamp] || 0) + row.totalViews;
        return acc;
    }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => new Date(a.label) - new Date(b.label));

    // Total Page Views by Page
    const viewsByPage = metrics.map(row => ({ label: row.pageDisplay, value: row.totalViews })).sort((a, b) => b.value - a.value);

    // Average Engagement Time by Page
    const engagementByPage = metrics.map(row => ({ label: row.pageDisplay, value: parseFloat(row.avgEngagementTime) })).sort((a, b) => b.value - a.value);
    
    // Discovery Depth (Exhibits vs Species)
    const discoveryDepth = {
        exhibits: metrics.filter(row => row.exhibitId && !row.speciesId).length,
        species: metrics.filter(row => row.exhibitId && row.speciesId).length,
    };

    // Most Engaging Exhibits (Total Engagement Time)
    const mostEngagingExhibitsData = Object.entries(metrics.reduce((acc, row) => {
        if (row.exhibitName) {
            acc[row.exhibitName] = (acc[row.exhibitName] || 0) + row.totalEngagementTime;
        }
        return acc;
    }, {})).map(([label, value]) => ({ label, value }));

    // ✅ Fix for Views per Browser Type
    const viewsByBrowserData = Object.entries(metrics.reduce((acc, row) => {
        if (row.browser) {
            acc[row.browser] = (acc[row.browser] || 0) + row.totalViews;
        }
        return acc;
    }, {})).map(([label, value]) => ({ label, value }));

    // ✅ Fix for Views per Entry Source
    const viewsByEntrySourceData = Object.entries(metrics.reduce((acc, row) => {
        if (row.sessionSource) {
            acc[row.sessionSource] = (acc[row.sessionSource] || 0) + row.totalViews;
        }
        return acc;
    }, {})).map(([label, value]) => ({ label, value }));

    // Visitor Drop-off Rate
    const visitorDropOff = {
        landing: metrics.filter(row => row.pageDisplay.includes("Get Started")).reduce((sum, row) => sum + row.totalViews, 0),
        engaged: metrics.filter(row => row.exhibitId).reduce((sum, row) => sum + row.totalViews, 0),
    };

    // ✅ Fix for Heatmap of Engagement by Time of Day
    const heatmapDataEntries = Object.entries(metrics.reduce((acc, row) => {
        if (!row.timestamp) return acc;
        const hour = row.timestamp.split(" ")[1]?.split(":")[0] || "00"; 
        acc[hour] = (acc[hour] || 0) + row.totalViews;
        return acc;
    }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => a.label - b.label);

    // 📝 HELPER FUNCTION TO CREATE CHARTS
    function createChart(ctxId, type, labels, datasetLabel, data, backgroundColors = null) {
        const ctx = document.getElementById(ctxId);
        if (!ctx) {
            console.warn(`Canvas with id "${ctxId}" not found.`);
            return;
        }

        if (data.length === 0) {
            console.warn(`No data for chart: ${ctxId}`);
            return;
        }

        new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: datasetLabel,
                    data: data,
                    backgroundColor: backgroundColors || ["#36A2EB", "#FF6384", "#FFCE56", "#4BC0C0"],
                    borderWidth: 1,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: type === "bar" || type === "line" ? { y: { beginAtZero: true } } : {},
            }
        });
    }

    // 🎨 GENERATE CHARTS 🎨
    createChart("chart-page-views-time", "line", viewsOverTimeData.map(d => d.label), "Page Views Over Time", viewsOverTimeData.map(d => d.value));
    createChart("chart-page-views", "bar", viewsByPage.map(d => d.label), "Total Page Views", viewsByPage.map(d => d.value));
    createChart("chart-avg-engagement", "bar", engagementByPage.map(d => d.label), "Avg Engagement Time", engagementByPage.map(d => d.value));
    createChart("chart-discovery-depth", "pie", ["Exhibits", "Species"], "Discovery Depth", [discoveryDepth.exhibits, discoveryDepth.species]);
    createChart("chart-most-engaging", "pie", mostEngagingExhibitsData.map(d => d.label), "Most Engaging Exhibits", mostEngagingExhibitsData.map(d => d.value));
    createChart("chart-views-browser", "pie", viewsByBrowserData.map(d => d.label), "Views per Browser Type", viewsByBrowserData.map(d => d.value));
    createChart("chart-views-source", "pie", viewsByEntrySourceData.map(d => d.label), "Views per Entry Source", viewsByEntrySourceData.map(d => d.value));
    createChart("chart-dropoff-rate", "bar", ["Landing Page", "Engaged Users"], "Visitor Drop-off Rate", [visitorDropOff.landing, visitorDropOff.engaged]);
    createChart("chart-heatmap-time", "bar", heatmapDataEntries.map(d => d.label), "Engagement by Time of Day", heatmapDataEntries.map(d => d.value));
}

// Run functions when DOM is fully loaded
document.addEventListener("DOMContentLoaded", async function () {
    const metrics = await fetchAndDisplayCSV();
    if (metrics.length > 0) {
        generateCharts(metrics);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // Get references to buttons
    const backButton = document.getElementById("back-button");
    const logoutButton = document.getElementById("logout-button");

    // Ensure the back button exists before attaching the event
    if (backButton) {
        backButton.addEventListener("click", () => {
            window.history.back(); // Navigate to the previous page
        });
    }

    // Ensure the logout button exists before attaching the event
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            console.log("Logging out...");
            sessionStorage.clear(); // Clear session storage
            localStorage.clear(); // Clear local storage
            console.log("Session and local storage cleared.");
            window.location.href = "./portal.html"; // Redirect to the portal page
        });
    }
});