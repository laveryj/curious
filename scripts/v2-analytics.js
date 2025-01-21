async function fetchAndDisplayCSV() {
    const pathSegments = window.location.pathname.split("/");
    const siteId = /^\d{4}$/.test(pathSegments[1]) ? pathSegments[1] : null;

    if (!siteId) {
        console.error("Site ID is missing or invalid in the URL path.");
        return; // Exit early if the site ID is not valid
    }

    console.log("Extracted siteId:", siteId);

    const csvUrl = `/${siteId}/assets/data/analytics.csv`;
    const jsonUrl = `/${siteId}/assets/data/data.json`;

    console.log("CSV URL:", csvUrl);
    console.log("JSON URL:", jsonUrl);

    try {
        const csvResponse = await fetch(csvUrl, { cache: "no-store" });
        if (!csvResponse.ok) throw new Error(`Failed to fetch CSV: ${csvResponse.statusText}`);
        const csvText = await csvResponse.text();

        const jsonResponse = await fetch(jsonUrl, { cache: "no-store" });
        if (!jsonResponse.ok) throw new Error(`Failed to fetch JSON: ${jsonResponse.statusText}`);
        const exhibitData = await jsonResponse.json();

        console.log("CSV Content:", csvText);
        console.log("JSON Content:", exhibitData);

        const rows = parseCSV(csvText);
        const exhibitLookup = createExhibitLookup(exhibitData);

        const metrics = calculateMetrics(rows, exhibitLookup, siteId)
            .filter((row) => row.exhibitName !== "Unknown Exhibit"); // Filter out unknown exhibits

        console.log("Filtered Metrics:", metrics);

        const totalViews = metrics.reduce((sum, row) => sum + row.totalViews, 0);
        const totalEngagementTime = metrics.reduce((sum, row) => sum + row.totalEngagementTime, 0);
        const totalAvgEngagementTime = (totalEngagementTime / totalViews).toFixed(2);

        console.log("Total Views:", totalViews);
        console.log("Total Average Engagement Time:", totalAvgEngagementTime);

        document.getElementById("total-views-count").textContent = totalViews;

        if (metrics.length === 0) {
            console.error("No metrics available to render!");
        }

        renderDashboard(metrics, totalViews, totalAvgEngagementTime);
    } catch (error) {
        console.error("Error fetching or displaying data:", error);
    }
}

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

function calculateMetrics(data, exhibitLookup, siteId) {
    const metricsByQueryString = {};

    data.forEach((row) => {
        const queryString = row["Landing page + query string"];
        console.log("Processing row:", queryString);

        if (!queryString.includes(`/2000/`)) {
            console.log("Skipping row:", queryString);
            return;
        }

        const views = parseInt(row.Views, 10) || 0;
        const engagementTime = parseFloat(row["Average engagement time per active user"]) || 0;
        const { exhibitId, speciesId } = parseQueryString(queryString);

        if (!metricsByQueryString[queryString]) {
            const exhibit = exhibitLookup[exhibitId] || {};
            const object = exhibit.objects?.[speciesId] || {};
            metricsByQueryString[queryString] = {
                exhibitId,
                speciesId,
                exhibitName: exhibit.exhibitName || "Unknown Exhibit",
                speciesName: object.commonName || "",
                animalName: object.nickname || "",
                totalViews: 0,
                totalEngagementTime: 0,
            };
        }

        metricsByQueryString[queryString].totalViews += views;
        metricsByQueryString[queryString].totalEngagementTime += engagementTime;
    });

    console.log("Aggregated Metrics:", metricsByQueryString);

    return Object.values(metricsByQueryString).map((entry) => ({
        ...entry,
        avgEngagementTime: (entry.totalEngagementTime / (entry.totalViews || 1)).toFixed(2),
    }));
}

function parseQueryString(queryString) {
    if (!queryString || !queryString.includes("?")) return { exhibitId: null, speciesId: null };
    const params = new URLSearchParams(queryString.split("?")[1]);
    return {
        // exhibitId: params.get("exhibit-id") || null,
        exhibitId: params.get("EID") || null,
        // speciesId: params.get("species-id") || params.get("object-id") || null,
        speciesId: params.get("OID") || params.get("object-id") || null,
    };
}

function renderDashboard(metrics) {
    const chartContainer = document.getElementById("chart-container");
    const table = document.getElementById("analytics-table");

    if (!chartContainer || !table) {
        console.error("Required elements not found.");
        return;
    }

    // Clear existing content
    chartContainer.innerHTML = "";

    // Generate X-axis labels
    const exhibitLabels = metrics.map((row) => {
        if (row.animalName && row.speciesName) {
            return `${row.exhibitName}: ${row.animalName}`;
        }
        if (row.speciesName) {
            return `${row.exhibitName}: ${row.speciesName}`;
        }
        return row.exhibitName || "Unknown Exhibit";
    });

    const totalViewsData = metrics.map((row) => row.totalViews);
    const avgEngagementTimeData = metrics.map((row) => parseFloat(row.avgEngagementTime));

    // Bar chart for total views
    const viewsCanvas = document.createElement("canvas");
    chartContainer.appendChild(viewsCanvas);
    new Chart(viewsCanvas, {
        type: "bar",
        data: {
            labels: exhibitLabels,
            datasets: [{
                label: "Total Views",
                data: totalViewsData,
                backgroundColor: "rgba(75, 192, 192, 0.6)",
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 60,
                        minRotation: 60,
                        autoSkip: false,
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "Total Views",
                    },
                    beginAtZero: true,
                },
            },
        },
    });

    // Line chart for average engagement time
    const engagementCanvas = document.createElement("canvas");
    chartContainer.appendChild(engagementCanvas);
    new Chart(engagementCanvas, {
        type: "line",
        data: {
            labels: exhibitLabels,
            datasets: [{
                label: "Avg Engagement Time (s)",
                data: avgEngagementTimeData,
                backgroundColor: "rgba(153, 102, 255, 0.6)",
                borderColor: "rgba(153, 102, 255, 1)",
                fill: false,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
            },
            scales: {
                x: {
                    ticks: {
                        maxRotation: 60,
                        minRotation: 60,
                        autoSkip: false,
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "Average Engagement Time (s)",
                    },
                    beginAtZero: true,
                },
            },
        },
    });

    // Render table
    const thead = table.querySelector("thead");
    const tbody = table.querySelector("tbody");
    const totalViews = metrics.reduce((sum, row) => sum + row.totalViews, 0);
    const totalEngagementTime = metrics.reduce((sum, row) => sum + row.totalEngagementTime, 0);
    const totalAvgEngagementTime = (totalEngagementTime / totalViews).toFixed(2);

    thead.innerHTML = `
        <tr>
            <th>Exhibit Name</th>
            <th>Page</th>
            <th>Total Page Views</th>
            <th>Avg Engagement Time</th>
        </tr>
    `;

    tbody.innerHTML = metrics
        .map((row) => {
            const page = row.speciesName
                ? `${row.animalName || row.speciesName || "Unknown"}`
                : "";
            return `
            <tr>
                <td>${row.exhibitName || ""}</td>
                <td>${page}</td>
                <td>${row.totalViews}</td>
                <td>${row.avgEngagementTime}</td>
            </tr>
        `;
        })
        .join("");

    tbody.innerHTML += `
        <tr style="font-weight: bold;">
            <td colspan="2" style="text-align: right;">Totals:</td>
            <td>${totalViews}</td>
            <td>${totalAvgEngagementTime}</td>
        </tr>
    `;
}

document.addEventListener("DOMContentLoaded", fetchAndDisplayCSV);

document.addEventListener("DOMContentLoaded", fetchAndDisplayCSV);
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