// ============================================================
// FUNCTION DEFINITIONS
// ============================================================

// 1.) Check if a user is older than 18:
const isOldEnough = (age) => {
  const ageLimit = 18;
  return age >= ageLimit
    ? "You are good to go!"
    : `Sorry, you must be ${ageLimit}!`;
};

// 2.) Check if it is currently raining:
const isRaining = (weather) => {
  const defaultCondition = "No rain on today's forecast!";
  const rainyMessage = "Get your rain jacket!";
  return weather === true ? rainyMessage : defaultCondition;
};

// 3.) Check if a number is even:
const isEven = (number) => {
  const isTrue = "That's an even number!";
  const isFalse = "That's an odd number!";
  return number % 2 === 0 ? isTrue : isFalse;
};

// 4.) Check whether one number is greater than another:
const isGreater = (num1, num2) => {
  if (num1 === num2) return `${num1} and ${num2} are equal`;
  return num1 > num2
    ? `${num1} is greater than ${num2}`
    : `${num1} is less than ${num2}`;
};

// ============================================================
// DOM CONNECTORS
// ============================================================

document.getElementById("age-btn").onclick = () => {
  const age = Number(document.getElementById("age-input").value);
  document.getElementById("age-result").textContent = isOldEnough(age);
};

document.getElementById("rain-btn").onclick = () => {
  const weather = document.getElementById("weather-input").value === "true";
  document.getElementById("rain-result").textContent = isRaining(weather);
};

document.getElementById("even-btn").onclick = () => {
  const number = Number(document.getElementById("number-input").value);
  document.getElementById("even-result").textContent = isEven(number);
};

document.getElementById("greater-btn").onclick = () => {
  const num1 = Number(document.getElementById("num1-input").value);
  const num2 = Number(document.getElementById("num2-input").value);
  document.getElementById("greater-result").textContent = isGreater(num1, num2);
};
