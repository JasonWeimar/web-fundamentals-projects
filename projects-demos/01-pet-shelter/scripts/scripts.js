const donateBtn = document.querySelector("#donate-btn");
const petSelect = document.querySelector("#pet-selection-option");
const petButtons = document.querySelectorAll(".pet-btn");

if (donateBtn) {
    donateBtn.addEventListener("click", () => {
        donateBtn.remove();
    });
}

if (petSelect) {
    petSelect.addEventListener("change", (event) => {
        alert(`You are looking for a ${event.target.value}.`);
        console.log(event.target.value);
    });
}

petButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const petCard = button.closest(".pet-card");
        const petCount = petCard.querySelector(".pet-count");

        petCount.textContent = Number(petCount.textContent) + 1;
    });
});