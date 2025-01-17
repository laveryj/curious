fetch('assets/data/pricing.json')
    .then(response => response.json())
    .then(data => {
        // Calculate per visitor prices
        const discoverPV = (data.discover / (data.footfall / 12)).toFixed(2);
        const engagePV = (data.engage / (data.footfall / 12)).toFixed(2);
        const monetisePV = (data.monetise / (data.footfall / 12)).toFixed(2);

        // Update HTML elements with raw prices and per visitor prices
        document.getElementById('discover').textContent = `£${data.discover}`;
        document.getElementById('engage').textContent = `£${data.engage}`;
        document.getElementById('monetise').textContent = `£${data.monetise}`;
        document.getElementById('discover-perVisitor').textContent = `${discoverPV}p per visitor`;
        document.getElementById('engage-perVisitor').textContent = `${engagePV}p per visitor`;
        document.getElementById('monetise-perVisitor').textContent = `${monetisePV}p per visitor`;

        document.getElementById('footfall').textContent = `${data.footfall}`;
    })
    .catch(error => console.error('Error fetching pricing data:', error));