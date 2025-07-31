let bets = JSON.parse(localStorage.getItem("bets")) || [];
let tokens = parseInt(localStorage.getItem("tokens")) || 100;

updateTokenDisplay();
renderDistribution();
updateHistoryLog();

// Update token display with bounce animation
function updateTokenDisplay() {
    const tokenEl = document.getElementById("token-balance");
    tokenEl.innerText = tokens;

    tokenEl.classList.remove("bounce");
    void tokenEl.offsetWidth; // Force reflow to re-trigger animation
    tokenEl.classList.add("bounce");
}

// Handle form submission
document.getElementById("bet-form").addEventListener("submit", function (e) {
    e.preventDefault();

    const playerName = document.getElementById("player-name").value.trim();
    const selectedOption = document.querySelector('input[name="option"]:checked');
    const betAmount = parseInt(document.getElementById("bet-amount").value);

    if (!playerName) {
        alert("Enter your name homie");
        return;
    }

    if (!selectedOption) {
        alert("Please choose an option to bet on!");
        return;
    }

    if (isNaN(betAmount) || betAmount < 1) {
        alert("Please enter a valid bet amount.");
        return;
    }

    if (betAmount > tokens) {
        alert("You don't have enough tokens to make this bet!");
        return;
    }

    const option = selectedOption.value;

    // Save the bet
    bets.push({
        player: playerName,
        option: option,
        amount: betAmount
    });

    // Deduct tokens
    tokens -= betAmount;

    // Save to localStorage
    localStorage.setItem("bets", JSON.stringify(bets));
    localStorage.setItem("tokens", tokens.toString());

    // Update UI
    updateTokenDisplay();
    renderDistribution();
    updateHistoryLog();

    // Play sound
    const betSound = document.getElementById("bet-sound");
    betSound.currentTime = 0;
    betSound.play();

    alert(`Bet placed: ${betAmount} tokens on "${option}" by ${playerName}`);
    document.getElementById("bet-form").reset();
});

// Get total tokens per option
function getBetSummary() {
    const summary = {};
    for (let bet of bets) {
        const option = bet.option;
        const amount = bet.amount;
        if (!summary[option]) summary[option] = 0;
        summary[option] += amount;
    }
    return summary;
}

// Calculate odds based on distribution
function calculateOdds(summary) {
    const total = Object.values(summary).reduce((a, b) => a + b, 0);
    const odds = {};
    for (let option in summary) {
        odds[option] = total / summary[option];
    }
    return odds;
}

// Show bet distribution
function renderDistribution() {
    const summary = getBetSummary();
    const odds = calculateOdds(summary);
    const distContainer = document.getElementById("distribution");
    distContainer.innerHTML = "";

    const totalTokens = Object.values(summary).reduce((a, b) => a + b, 0);

    for (let option in summary) {
        const percent = ((summary[option] / totalTokens) * 100).toFixed(1);
        const odd = odds[option].toFixed(2);

        const div = document.createElement("div");
        div.innerText = `Option ${option}: ${summary[option]} tokens (${percent}%) | Odds: x${odd}`;
        distContainer.appendChild(div);
    }
}

// Display chat-style bet history
function updateHistoryLog() {
    const log = document.getElementById("history-log");
    log.innerHTML = "";

    bets.slice().reverse().forEach(bet => {
        const div = document.createElement("div");
        const nameSpan = document.createElement("span");
        nameSpan.classList.add("player-name");
        nameSpan.innerText = bet.player;

        div.prepend(nameSpan);
        div.append(` bet ${bet.amount} tokens on "${bet.option}"`);

        log.appendChild(div);
    });
}
