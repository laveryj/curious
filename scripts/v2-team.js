// Fetch team data from JSON file
fetch('./assets/data/team.json') // Ensure the file path is correct relative to this HTML file
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(teamData => {
        const teamContainer = document.getElementById('team');

        // Generate team member cards
        teamData.forEach(member => {
            const card = document.createElement('div');
            card.className = 'team-card';

            card.innerHTML = `
                <img src="${member.photo}" alt="Photo of ${member.name}">
                <h3>${member.name}</h3>
                <p><strong>Role:</strong> ${member.role}</p>
                <p>${member.overview}</p>
                <br>
                <p class="fun-fact">${member.fun_fact}</p>
            `;

            teamContainer.appendChild(card);
        });
    })
    .catch(error => console.error('Error loading team data:', error));