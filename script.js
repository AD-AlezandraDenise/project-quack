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

// Load the last-used poll index from localStorage, or default to 0
let currentPollIndex = parseInt(localStorage.getItem("currentPollIndex")) || 0;

function updateTokenDisplay() {
    const tokenEl = document.getElementById("token-balance");
    tokenEl.innerText = tokens;
    tokenEl.classList.remove("bounce");
    void tokenEl.offsetWidth;
    tokenEl.classList.add("bounce");
}

function renderPoll() {
    let currentPoll = polls[currentPollIndex];
    const questionsEl = document.getElementById("poll-questions");
    const optionsEl = document.getElementById("poll-options");
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

function startNewRound() {
    bets = [];
    localStorage.setItem("bets", JSON.stringify(bets));
    renderDistribution();
    updateHistoryLog();
    document.getElementById("winner-announcement").innerHTML = "";
    gameOver = false;
}

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

function calculateOdds(summary) {
    const total = Object.values(summary).reduce((a, b) => a + b, 0);
    const odds = {};
    for (let option in summary) {
        odds[option] = total / summary[option];
    }
    return odds;
}

function renderDistribution(winningOption = null) {
    const summary = getBetSummary();
    const odds = calculateOdds(summary);
    const distContainer = document.getElementById("distribution");
    distContainer.innerHTML = "";
    const totalTokens = Object.values(summary).reduce((a, b) => a + b, 0);

    if (totalTokens === 0) {
        distContainer.innerHTML = "<p>No bets have been placed yet.</p>";
        return;
    }

    for (let option in summary) {
        const percent = ((summary[option] / totalTokens) * 100).toFixed(1);
        const odd = odds[option].toFixed(2);
        const div = document.createElement("div");
        div.innerText = `Option ${option}: ${summary[option]} tokens (${percent}%) | Odds: x${odd}`;
        if (winningOption && option === winningOption) {
            div.classList.add("winning-option");
        }
        distContainer.appendChild(div);
    }
}

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
    const sortedPlayers = Object.entries(playerStats).sort((a, b) => b[1] - a[1]);

    if (sortedPlayers.length === 0) {
        leaderboardEl.innerHTML = "<p>No players on the leaderboard yet.</p>";
        return;
    }

    sortedPlayers.forEach(([name, score], index) => {
        const row = document.createElement("div");
        row.classList.add("leaderboard-row");

        const rank = document.createElement("span");
        rank.classList.add("leaderboard-rank");
        if (index === 0) rank.textContent = "🥇 #1";
        else if (index === 1) rank.textContent = "🥈 #2";
        else if (index === 2) rank.textContent = "🥉 #3";
        else rank.textContent = `#${index + 1}`;

        const nameEl = document.createElement("span");
        nameEl.classList.add("leaderboard-name");
        nameEl.textContent = name;

        const scoreEl = document.createElement("span");
        scoreEl.classList.add("leaderboard-score");
        scoreEl.textContent = `${score} tokens`;

        row.appendChild(rank);
        row.appendChild(nameEl);
        row.appendChild(scoreEl);
        leaderboardEl.appendChild(row);
    });
}

function calculateAndPayWinners() {
    const currentPoll = polls[currentPollIndex];
    const options = currentPoll.options;
    const winningOption = options[Math.floor(Math.random() * options.length)];
    const summary = getBetSummary();
    const odds = calculateOdds(summary);
    let winners = [];
    let totalWinnings = 0;

    for (let bet of bets) {
        if (bet.option === winningOption) {
            const payout = Math.floor(bet.amount * odds[winningOption]);
            tokens += payout;
            totalWinnings += payout;
            if (!playerStats[bet.player]) {
                playerStats[bet.player] = 0;
            }
            playerStats[bet.player] += payout;
            winners.push(`${bet.player} won ${payout} tokens!`);
        }
    }

    localStorage.setItem("playerStats", JSON.stringify(playerStats));
    localStorage.setItem("tokens", tokens.toString());
    return { winningOption, winners, totalWinnings };
}

function showPayoutAnimation(totalWinnings) {
    if (totalWinnings <= 0) return;
    const payoutEl = document.getElementById("payout-animation");
    payoutEl.textContent = `+${totalWinnings}`;
    payoutEl.style.animation = 'fly-to-tokens 1.5s ease-out';
    payoutEl.addEventListener('animationend', () => {
        payoutEl.style.animation = 'none';
    }, { once: true });
}

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
    bets.push({ player: playerName, option: option, amount: betAmount });
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

document.getElementById("reveal-btn").addEventListener("click", function () {
    if (bets.length === 0) {
        alert("No bets placed yet!");
        return;
    }
    if (gameOver) {
        alert("The winner has already been revealed!");
        return;
    }
    gameOver = true;
    document.getElementById("reveal-btn").style.display = "none";
    const announce = document.getElementById("winner-announcement");
    announce.innerHTML = "<h3>Picking a winner...</h3>";

    setTimeout(() => {
        const results = calculateAndPayWinners();
        showPayoutAnimation(results.totalWinnings);
        renderDistribution(results.winningOption);
        updateTokenDisplay();
        renderLeaderboard();
        if (results.winners.length > 0) {
            announce.innerHTML = `<strong>🏆 Winning Option:</strong> ${results.winningOption}<br>${results.winners.join("<br>")}`;
        } else {
            announce.innerHTML = `<strong>🏆 Winning Option:</strong> ${results.winningOption}<br>No winners this round. 😢`;
        }
        document.getElementById("next-round-btn").style.display = "inline-block";
    }, 1500);
});

document.getElementById("next-round-btn").addEventListener("click", function() {
    currentPollIndex++;
    if (currentPollIndex >= polls.length) {
        currentPollIndex = 0;
    }
    localStorage.setItem("currentPollIndex", currentPollIndex.toString());
    renderPoll();
    startNewRound();
    document.getElementById("reveal-btn").style.display = "inline-block";
    document.getElementById("next-round-btn").style.display = "none";
});

document.getElementById("prev-poll-btn").addEventListener("click", function() {
    currentPollIndex--;
    if (currentPollIndex < 0) {
        currentPollIndex = polls.length - 1;
    }
    localStorage.setItem("currentPollIndex", currentPollIndex.toString());
    renderPoll();
    startNewRound();
});

document.getElementById("next-poll-btn").addEventListener("click", function() {
    currentPollIndex++;
    if (currentPollIndex >= polls.length) {
        currentPollIndex = 0;
    }
    localStorage.setItem("currentPollIndex", currentPollIndex.toString());
    renderPoll();
    startNewRound();
});

document.getElementById("reset-btn").addEventListener("click", function () {
    const confirmReset = confirm("Are you sure you want to reset the game?");
    if (!confirmReset) return;
    bets = [];
    tokens = 100;
    gameOver = false;
    playerStats = {};
    currentPollIndex = 0; // Also reset the poll index on full reset
    localStorage.setItem("bets", JSON.stringify(bets));
    localStorage.setItem("tokens", tokens.toString());
    localStorage.setItem("playerStats", JSON.stringify(playerStats));
    localStorage.setItem("currentPollIndex", "0"); // And clear it from memory
    updateTokenDisplay();
    renderDistribution();
    updateHistoryLog();
    renderLeaderboard();
    renderPoll(); // Re-render the first poll
    document.getElementById("winner-announcement").innerHTML = "";
    alert("Game has been reset!");
});

// Initial Render Calls
updateTokenDisplay();
renderDistribution();
updateHistoryLog();
renderLeaderboard();
renderPoll();