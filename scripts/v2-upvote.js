document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const exhibitId = urlParams.get("EID");
    const speciesId = urlParams.get("OID");
    
    if (!exhibitId || !speciesId) return; // Ensure it's a species page (OID must be present)

    const match = window.location.pathname.match(/^\/(\d+)\//);
    if (!match) return console.error("❌ No valid site ID found.");

    const siteId = match[1]; // Extracts the site ID from the URL

    // Create upvote button UI
    const voteContainer = document.createElement("div");
    voteContainer.classList.add("vote-container");

    const upvoteButton = document.createElement("button");
    upvoteButton.classList.add("upvote-button");
    upvoteButton.innerHTML = "Upvote 👍";
    const voteKey = `VOTED_${siteId}_${exhibitId}_${speciesId}`;
    if (localStorage.getItem(voteKey)) {
        upvoteButton.disabled = true; // Disable if already voted
    }
    upvoteButton.title = "Upvote this content";

    const voteCount = document.createElement("span");
    voteCount.classList.add("vote-count");
    voteCount.textContent = "Loading...";

    voteContainer.appendChild(upvoteButton);
    voteContainer.appendChild(voteCount);

    // Append voting UI to the #content div
    setTimeout(() => {
        const contentDiv = document.querySelector("#content");
        if (contentDiv) {
            console.log("Appending vote button after delay...");
            contentDiv.appendChild(voteContainer);
        } else {
            console.error("Error: #content div not found!");
        }
    }, 1000); // Wait 1 second to ensure #content isn't overwritten

    // ✅ Fetch existing vote count from D1
    async function fetchVoteCount() {
        try {
            const response = await fetch(`https://get-curio.us/api/upvote-tracker/vote?site_id=${siteId}&exhibit_id=${exhibitId}&species_id=${speciesId}`);
            if (!response.ok) throw new Error("Failed to fetch vote count");
            const data = await response.json();
            voteCount.textContent = data.count || 0;
        } catch (error) {
            console.error("Error fetching vote count:", error);
            voteCount.textContent = "0";
        }
    }

upvoteButton.addEventListener("click", async () => {
  const voteKey = `VOTED_${siteId}_${exhibitId}_${speciesId}`;

  if (localStorage.getItem(voteKey)) {
      alert("You've already voted!");
      return;
  }

  try {
      console.log("Submitting vote for:", { siteId, exhibitId, speciesId });

      const response = await fetch(`https://get-curio.us/api/upvote-tracker/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site_id: siteId, exhibit_id: exhibitId, species_id: speciesId })
      });

      if (!response.ok) throw new Error("Failed to submit vote");

      const data = await response.json();

      // ✅ Ensure the new vote count updates correctly
      voteCount.textContent = data.count !== undefined ? data.count : "Error";

      localStorage.setItem(voteKey, "voted"); // Prevent multiple votes
      upvoteButton.disabled = true; // Disable button after voting
  } catch (error) {
      console.error("Error submitting vote:", error);
  }
});

    // Fetch initial vote count
    await fetchVoteCount();
});