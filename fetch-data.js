document.addEventListener("DOMContentLoaded", () => {
  const exhibitName = "Wave"; // The current exhibit name
  const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQN7Vc3sLFfDaVF-7eRmR9Z_mvAiLwcB6K5slycdF2rajSNMMIRDo9mkvk4SNr7RFckWuTUD_2X2Khy/pub?output=csv";

  Papa.parse(sheetUrl, {
    download: true,
    header: true, // Automatically treat the first row as headers.
    complete: (results) => {
      const data = results.data;

      // Filter rows based on Exhibit Name and ensure valid data rows
      const filteredData = data.filter(item => item['Exhibit Name'] === exhibitName && item['Common Name']);

      renderData(filteredData);
    }
  });
});

function renderData(data) {
  const content = document.querySelector("#content");

  if (data.length === 0) {
    content.innerHTML = `<p>No animals found for this exhibit.</p>`;
    return;
  }

  data.forEach(item => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.innerHTML = `
      <a href="species.html?species=${encodeURIComponent(item['Common Name'])}" style="text-decoration: none; color: inherit;">
        <img src="${item['Image URL'] || 'placeholder.png'}" alt="${item['Common Name']}" style="width: 120px; height: auto; border-radius: 8px; margin-bottom: 10px; float: left; margin-right: 15px;">
        <h3>${item['Common Name']} (<em>${item['Scientific Name']}</em>)</h3>
        <p>${item['Short Description']}</p>
        <div style="clear: both;"></div>
      </a>
    `;
    content.appendChild(card);
  });
}