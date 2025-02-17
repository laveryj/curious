document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const exhibitId = urlParams.get("EID");
    const speciesId = urlParams.get("OID");
    
    if (!exhibitId) return; // Ensure an exhibit ID is present
  
    // Determine the unique key for voting
    const voteKey = `EID=[${exhibitId}]OID=[${speciesId || "None"}]`;

    // Create upvote button UI
    const voteContainer = document.createElement("div");
    voteContainer.classList.add("vote-container");
  
    const upvoteButton = document.createElement("button");
    upvoteButton.classList.add("upvote-button");
    upvoteButton.innerHTML = "Upvote 👍";
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

    // Fetch existing vote count from Cloudflare KV
    async function fetchVoteCount() {
      try {
        const response = await fetch(`https://upvote-tracker.hello-e9b.workers.dev/vote?key=${voteKey}`);
        if (!response.ok) throw new Error("Failed to fetch vote count");
        const data = await response.json();
        voteCount.textContent = data.count || 0;
      } catch (error) {
        console.error("Error fetching vote count:", error);
        voteCount.textContent = "0";
      }
    }
  
    // Handle upvote click
    upvoteButton.addEventListener("click", async () => {
      if (localStorage.getItem(voteKey)) {
        alert("You've already voted!");
        return;
      }
  
      try {
        console.log("Submitting vote with key:", voteKey); // Debugging log

        const response = await fetch(`https://upvote-tracker.hello-e9b.workers.dev/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: voteKey.trim() }), // Ensure key is properly formatted
        });

        if (!response.ok) throw new Error("Failed to submit vote");
        const data = await response.json();
        voteCount.textContent = data.count;
  
        localStorage.setItem(voteKey, "voted"); // Prevent multiple votes
        upvoteButton.disabled = true; // Disable button after voting
      } catch (error) {
        console.error("Error submitting vote:", error);
      }
    });
  
    // Fetch initial vote count
    await fetchVoteCount();
  });