fetch('assets/data/pricing.json')
    .then(response => response.json())
    .then(data => {
        // Calculate per visitor prices
        const DiscoverPV = (data.Discover / (data.footfall / 12)).toFixed(2);
        const EngagePV = (data.Engage / (data.footfall / 12)).toFixed(2);
        const MonetisePV = (data.Monetise / (data.footfall / 12)).toFixed(2);

        // Update HTML elements with raw prices and per visitor prices
        document.getElementById('Discover').textContent = `£${data.Discover}`;
        document.getElementById('Engage').textContent = `£${data.Engage}`;
        document.getElementById('Monetise').textContent = `£${data.Monetise}`;
        document.getElementById('Discover-perVisitor').textContent = `${DiscoverPV}p per visitor`;
        document.getElementById('Engage-perVisitor').textContent = `${EngagePV}p per visitor`;
        document.getElementById('Monetise-perVisitor').textContent = `${MonetisePV}p per visitor`;

        document.getElementById('footfall').textContent = `${data.footfall}`;
    })
    .catch(error => console.error('Error fetching pricing data:', error));