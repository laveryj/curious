document.addEventListener("DOMContentLoaded", function () {
    const loginContainer = document.getElementById("login-container");
    if (loginContainer) {
        loginContainer.style.display = "none";
    }
});

const chartInstances = {};
let rawData = [];
let currentPage = 1;
const rowsPerPage = 10;

let exhibitLookup = {};

async function loadExhibitData(siteId) {
    try {
        const response = await fetch(`/${siteId}/assets/data/data.json`);
        const exhibitData = await response.json();

        exhibitLookup = createExhibitLookup(exhibitData);
        console.log("📄 Exhibit Lookup Table Created:", exhibitLookup);
    } catch (error) {
        console.error("❌ Failed to fetch exhibit names:", error);
    }
}

async function loadAnalytics() {
    const match = window.location.pathname.match(/^\/(\d+)\//);
    if (!match) return console.error("❌ No valid site ID found.");

    const siteId = match[1];
    const periods = ["today", "yesterday", "last7days", "last30days", "alltime"];
    console.log(`📡 Fetching analytics for site ${siteId}`);

    await loadExhibitData(siteId); // ✅ Load exhibit lookup first

    for (const period of periods) {
        try {
            const response = await fetch(`https://get-curio.us/api/view-analytics/${siteId}/${period}/`);
            const data = await response.json();
            if (!data || data.error) continue;

            // ✅ Replace EID and OID with actual names using the lookup
            const topExhibit = exhibitLookup[data.top_exhibit]?.exhibitName ?? data.top_exhibit ?? "No data";
            const topObject = getObjectName(data.top_object); // ✅ New lookup function
            
            // ✅ Update the table dynamically for each period
            // document.getElementById(`totalViews-${period}`).textContent = data.total_views ?? 0;
            document.getElementById(`totalViews-${period}`).textContent = period === "alltime" ? (data.total_views) : data.total_views ?? 0;
            document.getElementById(`uniqueExhibits-${period}`).textContent = data.unique_exhibits ?? 0;
            document.getElementById(`uniqueObjects-${period}`).textContent = data.unique_objects ?? 0;
            document.getElementById(`popularExhibit-${period}`).textContent = topExhibit;
            document.getElementById(`popularObject-${period}`).textContent = topObject;

        } catch (error) {
            console.error(`❌ Fetch Error for ${period}:`, error);
        }
    }
}

function processAnalyticsData(rawData) {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        console.warn("⚠️ No analytics data available.");
        return { total_views: 0, device_brands: {}, languages: {} };
    }

    let totalViews = rawData.length;
    let deviceBrands = {};
    let languages = {};

    // Language code to full name mapping
    const languageMap = {
        "en": "English",
        "en-gb": "English",
        "en-us": "United States",
        "es": "Spanish",
        "fr": "French",
        "de": "German",
        "it": "Italian",
        "nl": "Dutch",
        "ru": "Russian",
        "zh": "Chinese",
        "ja": "Japanese",
        "ko": "Korean",
        "pt": "Portuguese",
        "ar": "Arabic",
        "hi": "Hindi",
        "tr": "Turkish",
        "pl": "Polish",
        "sv": "Swedish",
        "no": "Norwegian",
        "fi": "Finnish",
        "da": "Danish",
        "he": "Hebrew",
        "th": "Thai",
        "id": "Indonesian",
        "vi": "Vietnamese",
        "cs": "Czech",
        "hu": "Hungarian",
        "ro": "Romanian",
        "el": "Greek",
        "uk": "Ukrainian",
        "bg": "Bulgarian",
        "hr": "Croatian",
        "sr": "Serbian",
        "sk": "Slovak",
        "sl": "Slovenian",
        "lt": "Lithuanian",
        "lv": "Latvian",
        "et": "Estonian",
        "fa": "Persian",
        "ms": "Malay",
        "tl": "Filipino",
        "unknown": "Unknown"
    };

    rawData.forEach(row => {
        let brand = row.device_brand?.trim() || "Unknown";
        let langCode = row.language ? row.language.trim().toLowerCase().split('-')[0] : "unknown"; // ✅ Convert to lowercase before lookup
        let langName = languageMap[langCode] || "Unknown"; // Convert code to full name

        deviceBrands[brand] = (deviceBrands[brand] || 0) + 1;
        languages[langName] = (languages[langName] || 0) + 1;
    });

    return {
        total_views: totalViews,
        device_brands: deviceBrands,
        languages: languages
    };
}

async function updateUpvotesTable() {
    const match = window.location.pathname.match(/^\/(\d+)\//);
    if (!match) return console.error("❌ No valid site ID found.");

    const siteId = match[1];
    const tableBody = document.querySelector("#upvotesTable tbody");
    tableBody.innerHTML = "";

    try {
        // ✅ Fetch upvotes from the new D1 endpoint
        const response = await fetch(`https://get-curio.us/api/upvote-tracker/view-upvotes?site_id=${siteId}`);
        const upvoteData = await response.json();

        if (!upvoteData || !upvoteData.upvotes || upvoteData.upvotes.length === 0) {
            tableBody.innerHTML = "<tr><td colspan='4'>No upvote data available</td></tr>";
            return;
        }

        // ✅ Convert exhibit_id and species_id into actual names
        let upvotesList = upvoteData.upvotes.map(({ exhibit_id, species_id, upvotes }) => ({
            exhibitName: exhibitLookup[exhibit_id]?.exhibitName || `Exhibit ${exhibit_id}`,
            speciesName: species_id !== "None" ? (exhibitLookup[exhibit_id]?.objects[species_id] || `Species ${species_id}`) : "-",
            upvotes
        }));

        // ✅ Sort in descending order and limit to top 5
        upvotesList = upvotesList.sort((a, b) => b.upvotes - a.upvotes).slice(0, 5);

        // ✅ Populate table
        upvotesList.forEach(({ exhibitName, speciesName, upvotes }, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${exhibitName}</td>
                <td>${speciesName}</td>
                <td>${upvotes}</td>
            `;
            tableBody.appendChild(tr);
        });

    } catch (error) {
        console.error("❌ Error fetching upvotes:", error);
        tableBody.innerHTML = "<tr><td colspan='4'>Error loading upvotes</td></tr>";
    }
}

function updateVisualisations(period) {
    const match = window.location.pathname.match(/^\/(\d+)\//);
    if (!match) return;

    const siteId = match[1];
    fetch(`https://get-curio.us/api/view-analytics/${siteId}/${period}/`)
    .then(response => response.json())
    .then(data => {
        if (!data) return console.warn("⚠️ No data returned from API.");

        destroyChart("exhibitViewsChart");
        destroyChart("viewingTimeChart");
        destroyChart("deviceUsageChart");
        destroyChart("osUsageChart");
        destroyChart("deviceBrandsChart");
        destroyChart("languagesChart");

        // ✅ Convert Exhibit IDs to Names
        let exhibitViews = {};
        for (let eid in data.exhibit_views) {
            exhibitViews[exhibitLookup[eid]?.exhibitName || eid] = data.exhibit_views[eid];
        }

        // ✅ Sort exhibits by views (largest to smallest)
        const sortedExhibits = Object.entries(exhibitViews)
            .sort((a, b) => b[1] - a[1]);

        const sortedLabels = sortedExhibits.map(entry => entry[0]); // Exhibit names
        const sortedValues = sortedExhibits.map(entry => entry[1]); // View counts

        // ✅ Process new analytics data (Device Brands & Languages)
        const analyticsProcessed = processAnalyticsData(data.raw_data || []);

        // ✅ Update charts with the new data
        updateChart("exhibitViewsChart", "bar", sortedLabels, sortedValues, "Exhibit Views");
        updateChart("viewingTimeChart", "line", Object.keys(data.viewing_time_distribution), Object.values(data.viewing_time_distribution), "Hourly Activity");
        updateChart("deviceUsageChart", "pie", Object.keys(data.device_usage), Object.values(data.device_usage), "Device Usage");
        updateChart("osUsageChart", "doughnut", Object.keys(data.os_usage), Object.values(data.os_usage), "OS Distribution");
        updateChart("deviceBrandsChart", "pie", Object.keys(analyticsProcessed.device_brands), Object.values(analyticsProcessed.device_brands), "Mobile Device Brands");
        updateChart("languagesChart", "doughnut", Object.keys(analyticsProcessed.languages), Object.values(analyticsProcessed.languages), "Browser Languages");
    })
    .catch(error => console.error("❌ Failed to fetch analytics:", error));
}

// ✅ Ensure updateChart accepts labels & values
function updateChart(elementId, type, labels, values, label) {
    if (!labels || !values || labels.length === 0 || values.length === 0) {
        console.warn(`⚠️ No data for ${elementId}, skipping update.`);
        return;
    }

    const ctx = document.getElementById(elementId).getContext("2d");

    // Calculate total for percentages
    const total = values.reduce((sum, value) => sum + value, 0);

    chartInstances[elementId] = new Chart(ctx, { 
        type, 
        data: { 
            labels: labels, 
            datasets: [{ 
                label, 
                data: values, 
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#8BC34A", "#9C27B0"] 
            }] 
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            let value = tooltipItem.raw;
                            let percentage = ((value / total) * 100).toFixed(1);
                            return ` ${percentage}% (${value} views)`;
                        }
                    }
                }
            }
        }
    });
}

function destroyChart(elementId) {
    if (chartInstances[elementId]) {
        chartInstances[elementId].destroy();
        delete chartInstances[elementId];
    }
}

async function loadRawData(period = "today") {
    const match = window.location.pathname.match(/^\/(\d+)\//);
    if (!match) return console.error("❌ No valid site ID found.");

    const siteId = match[1];
    console.log(`📡 Fetching raw analytics data for ${siteId}, period: ${period}`);

    await loadExhibitData(siteId); // ✅ Ensure exhibit data is loaded first

    try {
        const response = await fetch(`https://get-curio.us/api/view-analytics/${siteId}/${period}/`);
        const data = await response.json();

        console.log("📊 API Response:", data);

        if (!data || data.error) {
            console.warn(`⚠️ No data available for ${period}`);
            rawData = [];
        } else {
            rawData = data.raw_data || [];
        }

        displayTablePage(1);
    } catch (error) {
        console.error(`❌ Fetch Error for ${period}:`, error);
    }
}

function createExhibitLookup(data) {
  console.log("📄 Exhibit Lookup Table Created:", exhibitLookup);
    const lookup = {};
    data.exhibits.forEach(exhibit => {
        lookup[exhibit.exhibitID] = {
            exhibitName: exhibit.exhibitName,
            objects: exhibit.objects.reduce((objLookup, obj) => {
                objLookup[obj.objectID] = obj.nickname || obj.commonName || "Unknown";
                return objLookup;
            }, {})
        };
    });
    return lookup;
}

function formatDate(timestamp) {
    return new Date(timestamp).toISOString().split("T")[0]; // Extract YYYY-MM-DD
}

function formatTime(timestamp) {
    return new Date(timestamp).toISOString().split("T")[1].slice(0, 5); // Extract HH:MM
}

function displayTablePage(page) {
    const tableBody = document.querySelector("#rawDataTable tbody");
    tableBody.innerHTML = "";

    if (!rawData.length) {
        tableBody.innerHTML = "<tr><td colspan='9'>No data available</td></tr>";
        return;
    }

    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = rawData.slice(start, end);

    paginatedData.forEach(row => {
        let exhibitName = exhibitLookup[row.eid]?.exhibitName || "";
        let objectName = exhibitLookup[row.eid]?.objects[row.oid] || "Main Page";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${formatDate(row.timestamp)}</td>
            <td>${formatTime(row.timestamp)}</td>
            <td>${exhibitName}</td>
            <td>${objectName}</td>
            <td>${row.browser || "Unknown"}</td>
            <td>${row.os || "Unknown"}</td>
            <td>${row.device || "Unknown"}</td>
        `;
        tableBody.appendChild(tr);
    });

    document.getElementById("pageInfo").textContent = `Page ${page} of ${Math.ceil(rawData.length / rowsPerPage)}`;
    currentPage = page;
}

document.getElementById("prevPage").addEventListener("click", function () {
    if (currentPage > 1) displayTablePage(currentPage - 1);
});

document.getElementById("nextPage").addEventListener("click", function () {
    if (currentPage < Math.ceil(rawData.length / rowsPerPage)) displayTablePage(currentPage + 1);
});

document.getElementById("downloadCSV").addEventListener("click", function () {
    const csvContent = "data:text/csv;charset=utf-8," + [
        "Date,Time,Page,Exhibit,Object,Browser,OS,Device,Traffic Source",
        ...rawData.map(row =>
            `${formatDate(row.timestamp)},${formatTime(row.timestamp)},${row.path},${row.eid},${row.oid},${row.browser},${row.os},${row.device},${row.traffic_source}`
        )
    ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

document.getElementById("period-select").addEventListener("change", function () {
    updateVisualisations(this.value);
    loadRawData(this.value);
    updateUpvotesTable(this.value);
});

window.onload = function () {
    loadAnalytics();
    updateVisualisations("today");
    loadRawData("today");
    updateUpvotesTable("today");
};

function getObjectName(objectId) {
    for (let exhibit in exhibitLookup) {
        if (exhibitLookup[exhibit].objects && exhibitLookup[exhibit].objects[objectId]) {
            return exhibitLookup[exhibit].objects[objectId]; // ✅ Return the correct object name
        }
    }
    return "Unknown"; // ❌ If not found, return "Unknown"
}

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("logout")) {
        logoutUser();
    }

    // Add event listener for the logout button
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", logoutUser);
    }
});

function logoutUser() {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("authSiteId");
    window.location.href = "/signin.html"; // Redirect to clean URL after logout
}