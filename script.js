let bets = JSON.parse(localStorage.getItem("bets")) || [];
let tokens = parseInt(localStorage.getItem("tokens")) || 100;
let playerStats = JSON.parse(localStorage.getItem("playerStats")) || {};
let gameOver = false;

const polls = [
    {
        question: "Which team will win the finals?",
        options: ["Team Red", "Team Blue", "Draw"]
    },
    {
        question: "Which feature should we build next?",
        options: ["Token Shop", "Player Avatars", "New Animations"]
    },
    {
        question: "Best programming language for beginners?",
        options: ["JavaScript", "Python", "Hard to say!"]
    }
];

let currentPollIndex = 0;

updateTokenDisplay();
renderDistribution();
updateHistoryLog();
renderLeaderboard();
renderPoll();

// Update token display with bounce animation
function updateTokenDisplay() {
    const tokenEl = document.getElementById("token-balance");
    tokenEl.innerText = tokens;

    tokenEl.classList.remove("bounce");
    void tokenEl.offsetWidth;
    tokenEl.classList.add("bounce");
}

function renderPoll(){
    let currentPoll = polls[currentPollIndex];

    const questionsEl = document.getElementById("poll-questions");
    const optionsEl = document.getElementById("poll-options");

    // ✅ FIXED: Used a dot instead of a comma
    questionsEl.innerText = currentPoll.question; 
    optionsEl.innerHTML = "";

    currentPoll.options.forEach(optionText => {
        const label = document.createElement("label");
        const radio = document.createElement("input");

        radio.type = "radio";
        radio.name = "option";
        radio.value = optionText;
        radio.required = true;

        label.appendChild(radio);
        label.append(` ${optionText}`);

        optionsEl.appendChild(label);
    });
}

function resetRound(){
    bets = [];
    localStorage.setItem("bets", JSON.stringify(bets));

    renderDistribution();
    updateHistoryLog();

    document.getElementById("winner-announcement").innerHTML = "";

    gameOver = false;
}

// Event listener for the "Next Poll" button
document.getElementById("next-poll-btn").addEventListener("click", function() {
    currentPollIndex++;

    if (currentPollIndex >= polls.length) {
        currentPollIndex = 0;
    }
    
    // ✅ FIXED: Added the missing function calls
    renderPoll();
    resetRound();
});

// Event listener for the "Previous Poll" button
document.getElementById("prev-poll-btn").addEventListener("click", function() {
    currentPollIndex--;

    if (currentPollIndex < 0) {
        currentPollIndex = polls.length - 1; 
    }

    renderPoll();
    resetRound();
});

// Handle form submission
document.getElementById("bet-form").addEventListener("submit", function (e) {
    e.preventDefault();

    if (gameOver) {
        alert("Round is over. Please reset the game to play again.");
        return;
    }

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

    bets.push({
        player: playerName,
        option: option,
        amount: betAmount
    });

    tokens -= betAmount;

    localStorage.setItem("bets", JSON.stringify(bets));
    localStorage.setItem("tokens", tokens.toString());

    updateTokenDisplay();
    renderDistribution();
    updateHistoryLog();

    const betSound = document.getElementById("bet-sound");
    betSound.currentTime = 0;
    betSound.play();

    alert(`Bet placed: ${betAmount} tokens on "${option}" by ${playerName}`);
    document.getElementById("bet-form").reset();
});

// Summary of bets per option
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

// Calculate payout odds
function calculateOdds(summary) {
    const total = Object.values(summary).reduce((a, b) => a + b, 0);
    const odds = {};
    for (let option in summary) {
        odds[option] = total / summary[option];
    }
    return odds;
}

// Show live distribution
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

// Update chat-style bet history
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

function renderLeaderboard() {
    const leaderboardEl = document.getElementById("leaderboard");
    leaderboardEl.innerHTML = "";

    // Turn stats object into sortable array
    const sortedPlayers = Object.entries(playerStats)
        .sort((a, b) => b[1] - a[1]); // sort by tokens won (descending)

    if (sortedPlayers.length === 0) {
        leaderboardEl.innerHTML = "<p>No players yet.</p>";
        return;
    }

    // Render top players
    sortedPlayers.forEach(([name, score], index) => {
        const div = document.createElement("div");
        div.innerHTML = `#${index + 1} — <strong>${name}</strong>: ${score} tokens won`;
        leaderboardEl.appendChild(div);
    });
}

// 🎯 Reveal Winner Logic
document.getElementById("reveal-btn").addEventListener("click", function () {
    if (bets.length === 0) {
        alert("No bets placed yet!");
        return;
    }
    
    // Get the options for the CURRENT poll
    const currentPoll = polls[currentPollIndex];
    const options = currentPoll.options;
    const winningOption = options[Math.floor(Math.random() * options.length)];

    const summary = getBetSummary();
    const odds = calculateOdds(summary);
    let winners = [];

    for (let bet of bets) {
        if (bet.option === winningOption) {
            const payout = Math.floor(bet.amount * odds[winningOption]);
            tokens += payout;

            if (!playerStats[bet.player]) {
                playerStats[bet.player] = 0;
            }
            playerStats[bet.player] += payout;

            localStorage.setItem("playerStats", JSON.stringify(playerStats));

            winners.push(`${bet.player} won ${payout} tokens!`);
        }
    }

    gameOver = true;

    localStorage.setItem("tokens", tokens.toString());
    updateTokenDisplay();

    const announce = document.getElementById("winner-announcement");
    if (winners.length > 0) {
        announce.innerHTML = `<strong>🏆 Winning Option:</strong> ${winningOption}<br>${winners.join("<br>")}`;
    } else {
        announce.innerHTML = `<strong>🏆 Winning Option:</strong> ${winningOption}<br>No winners this round. 😢`;
    }

    bets = [];
    localStorage.setItem("bets", JSON.stringify(bets));
    renderDistribution();
    updateHistoryLog();
    renderLeaderboard();
});

// 🔄 Reset Game
document.getElementById("reset-btn").addEventListener("click", function () {
    const confirmReset = confirm("Are you sure you want to reset the game?");
    if (!confirmReset) return;

    bets = [];
    tokens = 100;
    gameOver = false;
    playerStats = {}; // Clear player stats on full reset

    localStorage.setItem("bets", JSON.stringify(bets));
    localStorage.setItem("tokens", tokens.toString());
    localStorage.setItem("playerStats", JSON.stringify(playerStats));

    updateTokenDisplay();
    renderDistribution();
    updateHistoryLog();
    renderLeaderboard();

    document.getElementById("winner-announcement").innerHTML = "";

    alert("Game has been reset!");
});