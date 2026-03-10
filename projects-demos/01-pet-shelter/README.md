# Pet Shelter Mini Project

A small front-end project that simulates a simple pet adoption landing page using **HTML**, **CSS**, and **JavaScript**.

The project focuses on building a clean multi-section layout, styling reusable UI patterns, and adding basic interactive behavior with vanilla JavaScript.

---

## Overview:

This mini project is a static front-end interface for a fictional **Pet Shelter** site. It includes:

- A branded navigation/header area
- A simple pet search section
- Reusable pet listing cards
- Interactive buttons powered by JavaScript

While the project is intentionally small in scope, it demonstrates several important front-end fundamentals:

- Semantic page structure with HTML
- Layout composition using CSS Flexbox/Grid
- Reusable component-style CSS classes
- DOM interaction with JavaScript
- Event handling for simple UI behavior

---

## What This Project Demonstrates

### HTML Concepts:
- Semantic structure using:
  - `nav`
  - `main`
  - `article`
  - headings and paragraphs
- Organized content hierarchy
- Accessible form elements such as:
  - `select`
  - `input`
  - `button`
- Improved image `alt` text for readability and accessibility

### CSS Concepts:
- Global reset and base styling
- Custom typography with Google Fonts
- Layout design using:
  - **Flexbox** for larger content sections
  - **CSS Grid** for search alignment
- Reusable utility and component classes
- Button styling with borders, shadows, and hover behavior
- Responsive layout adjustments with media queries
- Cleaner scalable styling by replacing repeated one-off classes with reusable patterns

### JavaScript Concepts:
- DOM selection using `querySelector` and `querySelectorAll`
- Event listeners for:
  - button clicks
  - form selection changes
- Dynamic DOM updates
- Incrementing pet count values in the UI
- Removing an element from the page
- Using `closest()` to scope interactions to the correct card

---

## Features

### 1. Navigation/Header Section:
The top section includes:
- Shelter branding/logo
- Navigation links
- Donate button

The **Donate** button demonstrates a simple DOM manipulation pattern:
- clicking the button removes it from the page

### 2. Search Section:
The search area allows the user to:
- choose a pet type from a dropdown
- enter a city or zip code
- click a call-to-action button

The pet dropdown demonstrates basic JavaScript interactivity:
- when a user selects a pet, an alert displays their chosen animal

### 3. Pet Listing Cards:
Each pet card includes:
- image
- name
- description
- petting counter
- call-to-action button

Clicking a pet button increases that specific pet’s counter. This demonstrates:
- card-level interaction
- DOM traversal
- updating displayed values dynamically

---

## Layout / Design Notes
**The page is organized into two major areas:**

### Header / Search Area:
**The top section is visually separated with:**
- a teal background
- high contrast text
- icon-based visual cues
- grouped form controls

The search labels were aligned to the form controls using a matching **CSS Grid column structure**, which creates cleaner visual alignment than using manual spacing.

### Main Content Area:
**The pet listings are built as reusable card-like components with:**
- consistent spacing
- soft background contrast
- clearly separated content/action areas
- visual hierarchy through font sizing and layout

This makes the design easier to scale if more pet cards are added later.

---

## File Structure:

```bash
01-pet-shelter/
│
├── index.html
├── README.md
├── css/
│   └── style.css
├── scripts/
│   └── scripts.js
├── wireframe/
│   └── pet-shelter.png
└── images/
    ├── heart-light.png
    ├── paw-light.png
    ├── pin-light.png
    ├── pepper.jpg
    ├── bruce.jpg
    └── oscar.jpg
```
___

## How the Code Is Organized

```
index.html
```

**Responsible for the structure of the page:**

- navigation

- search controls

- pet cards

- script and stylesheet links

```
style.css
```

**Responsible for:**

- page layout

- spacing

- colors

- typography

- reusable component styling

- responsive behavior

```
scripts.js
```

**Responsible for:**

- removing the donate button

- responding to the pet dropdown selection

- increasing petting counters for each card

___

## JavaScript Behavior Breakdown

**Donate Button:**
```JavaScript
donateBtn.addEventListener("click", () => {
    donateBtn.remove();
});
```
**Concept shown:** removing an element from the DOM after a user action.


**Pet Selection Dropdown:**
```JavaScript
petSelect.addEventListener("change", (event) => {
    alert(`You are looking for a ${event.target.value}.`);
});
```
**Concept shown:** reacting to form input changes.

**Pet Count Buttons:**
```JavaScript
petButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const petCard = button.closest(".pet-card");
        const petCount = petCard.querySelector(".pet-count");
        petCount.textContent = Number(petCount.textContent) + 1;
    });
});
```
**Concepts shown:**

- looping through multiple matching elements

- attaching event listeners dynamically

- traversing the DOM

- updating text content

___

## Front-End Skills Demonstrated

**This project highlights foundational front-end skills such as:**

- structuring a page with semantic HTML

- styling layouts with Flexbox and Grid

- building reusable UI patterns

- improving alignment and spacing through CSS refinement

- connecting UI actions to DOM behavior with JavaScript

- refactoring repeated code into cleaner scalable patterns



## Recruiter Summary:

- This project demonstrates practical front-end fundamentals using vanilla HTML, CSS, and JavaScript. It shows the ability to build a structured layout, style reusable card-based UI elements, and add interactive behavior through DOM event handling. It also reflects a refactoring mindset by replacing repeated code with cleaner reusable patterns.


## Engineer Summary:

**From an engineering perspective, this project demonstrates:**

- semantic HTML structure

- component-style CSS reuse

- improved layout alignment using Grid/Flexbox

- removal of inline handlers in favor of JavaScript event listeners

- DOM traversal and scoped updates via closest()

- basic UI state updates through text content changes

**It is a compact example of early-stage front-end architecture and cleanup discipline.**

## Running the Project:

- Because this is a simple static project, it can be run by opening index.html in a browser.

- For a cleaner local workflow, you can also use a simple live server extension in VS Code.


___

### Refactoring Improvements Made:

The original version worked, but it included repeated code for each pet listing. The project was refined to make it more maintainable and closer to how real front-end code should be structured.

### Before
- separate CSS classes for each pet card
- separate CSS classes for each pet image, name, description, and button
- separate JavaScript functions for each pet counter
- inline event handlers in the HTML

### After
- one reusable `.pet-card` component pattern
- one reusable `.pet-btn` button style
- one shared `.pet-count` class for counter values
- one JavaScript loop that handles all pet buttons
- event listeners added in JavaScript instead of inline HTML attributes

**improves:**
- readability
- scalability
- maintainability
- separation of concerns

