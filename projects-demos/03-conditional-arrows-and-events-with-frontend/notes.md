**The DOM pattern to memorize - three moves:**

```
| 1) document.getElementById("some-id") | // find the element         |
| 2) .value                             | // READ from inputs/selects |
| 3) .textContent = "..."               | // WRITE to paragraphs/divs |

```

# DOM Pattern Reference

---

## The core idea

HTML gives every element an **id**. JavaScript uses that id to find the element,
then either **reads** data from it or **writes** data to it.

```
HTML element (id)  →  JS finds it  →  JS reads or writes
```

---

## The one method you need

```javascript
document.getElementById("some-id");
```

This returns the actual HTML element as a JavaScript object.
Everything else is just a property you access on that object.

---

## Reading vs. writing

| What you want                    | Property       | Direction |
| -------------------------------- | -------------- | --------- |
| Get text a user typed            | `.value`       | read      |
| Get selected option              | `.value`       | read      |
| Put text into a `<p>` or `<div>` | `.textContent` | write     |
| Put HTML into an element         | `.innerHTML`   | write     |

---

## The two HTML elements you'll read from

### `<input>` — user types a value

```html
<input type="number" id="age-input" />
```

```javascript
document.getElementById("age-input").value; // → "18"  (always a string)
Number(document.getElementById("age-input").value); // → 18  (converted to number)
```

### `<select>` — user picks an option

```html
<select id="weather-input">
  <option value="true">raining</option>
  <option value="false">not raining</option>
</select>
```

```javascript
document.getElementById("weather-input").value; // → "true"  (always a string)
document.getElementById("weather-input").value === "true"; // → true  (converted to boolean)
```

> `.value` always returns a **string** — no matter what type you put in the HTML.
> Always convert before passing into your function.

---

## The element you'll write to

### `<p>` or `<div>` — display a result

```html
<p id="age-result"></p>
```

```javascript
document.getElementById("age-result").textContent = "You are good to go!";
```

---

## The button — triggers the flow

```html
<button id="age-btn">check</button>
```

```javascript
document.getElementById("age-btn").onclick = () => {
  // everything in here runs when the button is clicked
};
```

---

## The full pattern — assembled

```
[input element]  →  button click  →  function  →  [output element]
    .value                              logic        .textContent
```

```javascript
document.getElementById("age-btn").onclick = () => {
  // 1. READ from input — convert string to correct type
  const age = Number(document.getElementById("age-input").value);

  // 2. PASS into your function — pure logic runs here
  const result = isOldEnough(age);

  // 3. WRITE to output — display the returned value
  document.getElementById("age-result").textContent = result;
};
```

---

## The same pattern across all four functions

| Function      | Read from                     | Convert with | Write to          |
| ------------- | ----------------------------- | ------------ | ----------------- |
| `isOldEnough` | `#age-input`                  | `Number()`   | `#age-result`     |
| `isRaining`   | `#weather-input`              | `=== "true"` | `#rain-result`    |
| `isEven`      | `#number-input`               | `Number()`   | `#even-result`    |
| `isGreater`   | `#num1-input` + `#num2-input` | `Number()`   | `#greater-result` |

---

## Common mistakes

### Forgetting to convert `.value`

```javascript
// wrong — "18" >= 18 behaves unexpectedly
const age = document.getElementById("age-input").value;

// correct
const age = Number(document.getElementById("age-input").value);
```

### Using `.value` on an output element

```javascript
// wrong — <p> tags don't have .value
document.getElementById("age-result").value = "...";

// correct
document.getElementById("age-result").textContent = "...";
```

### Calling a function before it's defined

```javascript
// wrong — connector runs before isOldEnough exists
document.getElementById("age-btn").onclick = () => { isOldEnough(age); };
const isOldEnough = (age) => { ... };

// correct — define first, connect after
const isOldEnough = (age) => { ... };
document.getElementById("age-btn").onclick = () => { isOldEnough(age); };
```

---

## Mental model

Think of your JS file in two layers:

```
layer 1 — pure logic (no DOM)
  const isOldEnough = (age) => { ... }
  const isRaining   = (weather) => { ... }
  const isEven      = (number) => { ... }
  const isGreater   = (num1, num2) => { ... }

layer 2 — DOM connectors (wires the UI to layer 1)
  document.getElementById("age-btn").onclick     = () => { ... }
  document.getElementById("rain-btn").onclick    = () => { ... }
  document.getElementById("even-btn").onclick    = () => { ... }
  document.getElementById("greater-btn").onclick = () => { ... }
```

Layer 1 knows nothing about the DOM.
Layer 2 knows nothing about the logic.
They meet inside the `onclick` arrow function.
