# GitHub Profile Lookup | **README**

`APIRefresher` &nbsp;|&nbsp; `GitHub REST API` &nbsp;|&nbsp; `AJAX` &nbsp;|&nbsp; `async/await` &nbsp;|&nbsp; `Fetch API` &nbsp;|&nbsp; `HTML` &nbsp;|&nbsp; `CSS` &nbsp;|&nbsp; `JavaScript`

---

## Overview

A lightweight front-end project that queries the GitHub Users REST API and renders profile data into a glass-morphism card. Built as a deliberate API/AJAX refresher — the code is heavily annotated to walk through every step of the request lifecycle: form event capture, `fetch()`, Promise resolution, JSON parsing, cherry-picking fields, and DOM injection.

No build tools. No dependencies. No framework. One folder, three files, open in a browser.

---

## What This Demonstrates

### JavaScript / AJAX Concepts

- **`submit` event over `click`.** The event listener is attached to the `<form>` element, not the button. This means both mouse-click and Enter-key trigger the search — attaching to `click` would silently break the keyboard path.
- **`event.preventDefault()` stops the default form behaviour.** Without it, the browser would navigate to `?usernameInput=torvalds`, causing a full page reload. One line keeps us on the page and hands control to JavaScript.
- **`fetch()` only rejects on network failure — not HTTP errors.** A 404 "User not found" is still a successful fetch from the browser's perspective. `response.ok` (true for 200–299) must be checked manually before parsing — this is the most common beginner trap with the Fetch API.
- **`async/await` makes async code read synchronously.** Each `await` pauses execution at that line until the Promise resolves, without blocking the main thread. Under the hood it is still Promises — `async` is syntactic sugar.
- **`response.json()` is also asynchronous.** It reads and parses the response body stream. Both `fetch()` and `.json()` are awaited in sequence — skipping the second `await` is a common mistake that leaves you holding a Promise object instead of data.
- **Destructuring cherry-picks exactly what you need.** The GitHub API returns ~30+ fields. One destructuring assignment pulls only the eight fields the card uses, discarding the rest — clean and explicit.
- **`try/catch` wraps the entire async block.** It handles both errors we throw manually (404, bad status) and errors thrown by the runtime (no internet, CORS failure) in one unified handler — no unhandled Promise rejections.
- **`textContent` over `innerHTML` for injected data.** Writing user-controlled data via `innerHTML` is an XSS vector. `textContent` treats the value as plain text — the browser never parses it as markup.

### CSS Concepts

- **Glass morphism requires three ingredients together.** Semi-transparent `background` (low-alpha rgba) + `backdrop-filter: blur()` to frost whatever is behind the element + a subtle `border` to simulate light hitting frosted glass. Any one ingredient alone does not produce the effect.
- **CSS custom properties as design tokens.** All colours, blur values, and radii are declared as `--variables` in `:root`. One change cascades to every element that references it — the same pattern used in production design systems.
- **`<link>` in `<head>`, `<script>` at the bottom of `<body>`.** CSS loads before the browser paints (prevents flash of unstyled content). JavaScript loads last so the DOM exists before `getElementById` runs — placing `<script>` in `<head>` without `defer` would cause all DOM queries to return `null`.
- **`animation: forwards` holds the final keyframe state.** Without it, the card would snap back to `opacity: 0` the moment the animation ended. `forwards` keeps the `to` values applied after completion.

---

## Project Structure

```
github-profile-lookup/
├── index.html    ← structure only — semantic markup, id hooks, file links
├── style.css     ← presentation only — glass effect, gradient, layout, animation
└── script.js     ← logic only — fetch, DOM queries, async/await, error handling
```

### Separation of Concerns

| File         | Responsibility      | Knows about                        |
| ------------ | ------------------- | ---------------------------------- |
| `index.html` | Document structure  | Nothing — just links CSS and JS    |
| `style.css`  | Visual presentation | Class names and element types only |
| `script.js`  | Behaviour and data  | `id` attributes as DOM hooks       |

---

## API

**Endpoint used:**

```
GET https://api.github.com/users/{username}
```

**Fields cherry-picked from the response:**

| Field          | Used for                                      |
| -------------- | --------------------------------------------- |
| `avatar_url`   | Profile photo `src`                           |
| `name`         | Display name (falls back to `login` if null)  |
| `login`        | `@username` handle                            |
| `bio`          | Bio text (falls back to `'No bio provided.'`) |
| `public_repos` | Repos stat                                    |
| `followers`    | Followers stat                                |
| `following`    | Following stat                                |
| `html_url`     | "View on GitHub" link `href`                  |

**Rate limit:** 60 requests/hour per IP (unauthenticated). Add a GitHub personal access token as a `Bearer` header to raise this to 5,000/hour.

---

## The Request Lifecycle (Pseudocode → Code Map)

```
1. Username is entered
       └─ input.value.trim()

2. Form is submitted
       └─ form.addEventListener('submit', handleSearch)
       └─ event.preventDefault()

3. GET request fires
       └─ await fetch(`https://api.github.com/users/${username}`)

4. Response is validated and parsed
       └─ if (!response.ok) throw new Error(...)
       └─ const data = await response.json()

5. Fields are cherry-picked
       └─ const { avatar_url, name, login, bio, ... } = data

6. Data is injected into the card slots
       └─ cardName.textContent = name || login
       └─ cardAvatar.src = avatar_url  ...etc

7. Card is revealed
       └─ profileCard.style.display = 'flex'
       └─ CSS fadeUp animation plays automatically
```

---

## Prerequisites

- Any modern browser (Chrome, Firefox, Safari, Edge)
- No installs, no CLI, no server required

---

## Running the Project

```bash
# Clone or download the repo
git clone https://github.com/yourusername/github-profile-lookup.git
cd github-profile-lookup

# Open directly in your browser — no server needed
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

Try these usernames to verify it's working: `torvalds`, `gaearon`, `addyosmani`

---

## Key Concepts Quick Reference

### Why `response.ok` must be checked manually

```js
// fetch() does NOT throw on 404, 403, 500, etc.
const response = await fetch(url); // always resolves if the server responded

// You must check this yourself
if (!response.ok) {
  throw new Error(`HTTP error: ${response.status}`);
}

// Only NOW is it safe to parse
const data = await response.json();
```

### Why `<script>` goes at the bottom of `<body>`

```html
<!-- ❌ In <head> — DOM doesn't exist yet when script runs -->
<head>
  <script src="script.js"></script>
  <!-- getElementById returns null -->
</head>

<!-- ✅ Bottom of <body> — all elements parsed before script executes -->
<body>
  <div id="profileCard"></div>
  <script src="script.js"></script>
  <!-- getElementById works correctly -->
</body>

<!-- ✅ Alternative: defer in <head> — same result, different mechanism -->
<head>
  <script src="script.js" defer></script>
</head>
```

### The `||` fallback pattern

```js
// Some GitHub users have no display name set — name will be null
cardName.textContent = name || login;
// If name is null/empty (falsy) → falls back to login
// If name is "Linus Torvalds" (truthy) → uses it

cardBio.textContent = bio || "No bio provided.";
```

---

## Potential Next Steps

| Feature                                  | Concept introduced                                  |
| ---------------------------------------- | --------------------------------------------------- |
| Loading spinner while fetch is in-flight | CSS animation + JS class toggling                   |
| Cache results in `localStorage`          | Web Storage API, avoiding redundant requests        |
| Authenticated requests via GitHub token  | `Authorization: Bearer` header, rate limit increase |
| Fetch and list a user's repos            | Second API endpoint, dynamic list rendering         |
| Debounced live search (no submit needed) | `setTimeout` / `clearTimeout` pattern               |

---

_Part of a frontend + API refresher series — vanilla JS, no frameworks, annotated for learning._
