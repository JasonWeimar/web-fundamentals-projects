/* =====================================================
   script.js - responsible for:
     1. Listening for form submission
     2. Fetching data from GitHub API
     3. Parsing + cherry-picking JSON response
     4. Injecting data into the DOM
     5. Showing / hiding the card
===================================================== */

/* =====================================================
   DOM REFERENCES CACHE
===================================================== */
const form = document.getElementById("searchForm");
const input = document.getElementById("usernameInput");
const statusMsg = document.getElementById("statusMsg");
const profileCard = document.getElementById("profileCard");

// Individual card slots — each maps to an id in index.html
const cardAvatar = document.getElementById("cardAvatar");
const cardName = document.getElementById("cardName");
const cardLogin = document.getElementById("cardLogin");
const cardBio = document.getElementById("cardBio");
const cardRepos = document.getElementById("cardRepos");
const cardFollowers = document.getElementById("cardFollowers");
const cardFollowing = document.getElementById("cardFollowing");
const cardLink = document.getElementById("cardLink");

/* =====================================================
    ATTACH EVENT LISTENER
===================================================== */
form.addEventListener("submit", handleSearch);

/* =====================================================
   MAIN HANDLER
===================================================== */
async function handleSearch(event) {
  // preventDefault() - stop browser's default form behaviour of re-loading page.
  event.preventDefault();

  // read and sanitise the input value
  // .trim() removes any accidental leading/trailing whitespace
  const username = input.value.trim();

  // Guard clause:
  if (!username) {
    showStatus("Please enter a username.", "warn");
    return; // exits
  }

  // UX feedback while request in-flight
  showStatus("Fetching…");
  hideCard();

  /* ===================================================
     GET REQUEST
     -------------------------------------------------
     Template literal builds the URL dynamically.
     GitHub Users API: https://api.github.com/users/{username}
  =================================================== */
  const API_URL = `https://api.github.com/users/${username}`;

  //   try/catch wraps all async opperations
  try {
    const response = await fetch(API_URL);

    /*
      manually check response.ok — which is true for
      status codes 200–299, and false for everything else.
    */
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`User "${username}" not found.`);
      }
      throw new Error(`GitHub API error — status: ${response.status}`);
    }

    /* ===================================================
       PARSE THE JSON
       response.json() reads the response body stream and
       parses it into a JavaScript object.
    =================================================== */
    const data = await response.json();

    /*
      CHERRY-PICKING - destructuring assignment:
      Instead of: data.avatar_url, data.name, data.login …
      pull exactly what is needed (cleanly).
      
      - note: `|| fallback` pattern - if a field is null or
      empty/(falsy), use fallback value instead.
      some users have no display name > fall back to login.
    */
    const {
      avatar_url,
      name,
      login,
      bio,
      public_repos,
      followers,
      following,
      html_url,
    } = data;

    /* ===================================================
       INJECT INTO THE CARD
       -------------------------------------------------
       Write needed values into DOM slot.
       .textContent sets plain text (safe — no XSS risk).
       .src and .href set attributes directly.
    =================================================== */
    cardAvatar.src = avatar_url;
    cardAvatar.alt = `${login}'s avatar`;
    cardName.textContent = name || login; // fallback if no display name
    cardLogin.textContent = `@${login}`;
    cardBio.textContent = bio || "No bio provided.";
    cardRepos.textContent = public_repos;
    cardFollowers.textContent = followers;
    cardFollowing.textContent = following;
    cardLink.href = html_url;

    /* ===================================================
       RENDER THE CARD
       -------------------------------------------------
       showCard() flips display from none → flex.
    =================================================== */
    showCard();
    showStatus(""); // clears loading message
  } catch (err) {
    /*
      `err` catches:
        - Client/Application caused errors (404, bad status)
        - Network errors thrown by fetch (no internet, etc.)
       - Surface the message to the user instead of crashing.
    */
    showStatus(err.message, "error");
  }
}

/* =====================================================
   HELPER FUNCTIONS
===================================================== */

/**
 * Reveals profile card with a replayed CSS animation.
 * Resets the animation by briefly removing it, forcing a reflow (offsetHeight read).
 * Ensures animation replays on every new search.
 */
function showCard() {
  profileCard.style.animation = "none";
  profileCard.offsetHeight; // triggers reflow
  profileCard.style.animation = "";
  profileCard.style.display = "flex";
}

/** Hides the card between searches. */
function hideCard() {
  profileCard.style.display = "none";
}

/**
 * Updates the status message with color-coding.
@param {string} msg   - The message to display ('' clears it)
@param {string} type  - 'info' | 'warn' | 'error'
 */
function showStatus(msg, type = "info") {
  statusMsg.textContent = msg;
  statusMsg.style.color =
    type === "error" ? "#ff8a80" : type === "warn" ? "#ffcc80" : "#a89ec9"; // default: muted purple (info)
}
