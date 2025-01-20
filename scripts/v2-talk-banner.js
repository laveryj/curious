// Function to fetch talks from config.json
async function fetchTalks() {
    const response = await fetch('./assets/data/config.json');
    if (!response.ok) {
        console.error('Failed to fetch config.json');
        return [];
    }
    const data = await response.json();
    return data.talkTimes;
}

// Function to create and display the banner
function showBanner(message) {
    // Remove existing banner if present
    const existingBanner = document.getElementById('talk-banner');
    if (existingBanner) existingBanner.remove();

    // Create banner element
    const banner = document.createElement('div');
    banner.id = 'talk-banner';
    banner.style.position = 'fixed';
    banner.style.width = '100%';
    banner.style.backgroundColor = '#ffffff'; // White background
    banner.style.color = '#000000'; // Black text
    banner.style.textAlign = 'center';
    banner.style.padding = '5px';
    banner.style.fontSize = '16px';
    banner.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.3)';
    banner.style.display = 'flex';
    banner.style.justifyContent = 'space-between';
    banner.style.alignItems = 'center';
    banner.style.zIndex = '1000';

    // Adjust the banner position to sit below the header
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;
    banner.style.top = `${headerHeight}px`;

    // Add the message to the banner
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    messageSpan.style.flex = '1';
    banner.appendChild(messageSpan);

    // Add a close button to the banner
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.fontSize = '16px';
    closeButton.style.color = '#000000';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.cursor = 'pointer';
    closeButton.style.padding = '0 10px';
    closeButton.style.margin = '0';
    closeButton.style.fontWeight = 'bold';
    closeButton.addEventListener('click', () => banner.remove());
    banner.appendChild(closeButton);

    // Append the banner to the body
    document.body.appendChild(banner);
}

// Function to filter talks based on the current day
function filterTalksByDay(talks) {
    const currentDay = new Date().toLocaleDateString('en-GB', { weekday: 'long' });
    return talks.filter(talk =>
        talk.days.includes('Daily') ||
        talk.days.includes(currentDay) ||
        (talk.days.includes('Weekends') && (currentDay === 'Saturday' || currentDay === 'Sunday'))
    );
}

// Function to check and display the countdown for the next talk
async function checkNextTalk() {
    const talkTimes = await fetchTalks();
    const now = new Date();

    // Filter talks by day
    const filteredTalks = filterTalksByDay(talkTimes);

    // Convert talk times to Date objects and sort them
    const upcomingTalks = filteredTalks
        .map(talk => {
            const [hours, minutes] = talk.time.split(':').map(Number);
            const talkTime = new Date();
            talkTime.setHours(hours, minutes, 0);
            talkTime.setSeconds(0, 0);
            return { ...talk, talkTime };
        })
        .filter(talk => talk.talkTime > now) // Only keep future talks
        .sort((a, b) => a.talkTime - b.talkTime); // Sort by time

    if (upcomingTalks.length > 0) {
        const nextTalk = upcomingTalks[0];
        const diff = nextTalk.talkTime - now;

        // Display banner if within 15 minutes
        if (diff > 0 && diff <= 15 * 60 * 1000) {
            const minutesLeft = Math.ceil(diff / 60000);
            const minuteText = `${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}`;
            showBanner(`The next ${nextTalk.name} starts in ${minuteText}`);
        } else {
            // Remove the banner if no talk is within the time frame
            const existingBanner = document.getElementById('talk-banner');
            if (existingBanner) existingBanner.remove();
        }
    }
}

// Main function to initialise the banner system
async function initTalkBanner() {
    // Run check every minute
    setInterval(checkNextTalk, 60000);

    // Check immediately on page load
    await checkNextTalk();
}

// Initialise the script when the page loads
window.onload = initTalkBanner;