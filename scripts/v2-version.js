// Fetch the version number from version.json and display it in the footer
fetch('../assets/data/version.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    // Update the footer with the version number
    document.getElementById('footer-version').textContent = `v${data.version}`;
  })
  .catch(error => {
    console.error('Error fetching version:', error);
    document.getElementById('footer-version').textContent = 'Version: Error loading';
  });