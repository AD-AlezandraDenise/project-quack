let bets = JSON.parse(localStorage.getItem("bets")) || [];
let players = JSON.parse(localStorage.getItem("players")) || {};
let gameOver = false;
let activePlayerName = null;
let currentPollIndex = parseInt(localStorage.getItem("currentPollIndex")) || 0;
const polls = JSON.parse(localStorage.getItem("polls")) || [];
const gameSettings = JSON.parse(localStorage.getItem("gameSettings")) || { questionTimerDuration: 30 };

function updatePlayerList() {
    const dataList = document.getElementById("player-list");
    dataList.innerHTML = "";
    Object.keys(players).forEach(playerName => {
        const option = document.createElement("option");
        option.value = playerName;
        dataList.appendChild(option);
    });
}

function updateActivePlayerDisplay() {
    const nameEl = document.getElementById("active-player-name");
    const balanceEl = document.getElementById("active-player-balance");
    if (activePlayerName && players[activePlayerName]) {
        nameEl.textContent = activePlayerName;
        balanceEl.textContent = players[activePlayerName].balance;
    } else {
        nameEl.textContent = "None";
        balanceEl.textContent = "--";
    }
}

function setActivePlayer(playerName) {
    playerName = playerName.trim();
    if (!playerName) return;
    if (!players[playerName]) {
        players[playerName] = { balance: 100, totalWinnings: 0 };
        updatePlayerList();
        localStorage.setItem("players", JSON.stringify(players));
    }
    activePlayerName = playerName;
    updateActivePlayerDisplay();
}

function renderPoll() {
    let currentPoll = polls[currentPollIndex];
    const questionsEl = document.getElementById("poll-questions");
    const optionsEl = document.getElementById("poll-options");
    questionsEl.innerText = currentPoll ? currentPoll.question : "No Polls Available. Create one in the admin panel!";
    optionsEl.innerHTML = "";
    if (!currentPoll) return;
    const optionColors = ["red", "blue", "yellow", "green", "orange", "purple"];
    currentPoll.options.forEach((optionText, index) => {
        const button = document.createElement("button");
        button.classList.add("answer-option", `option-${optionColors[index % 6]}`);
        button.textContent = optionText;
        button.dataset.value = optionText;
        button.addEventListener("click", () => {
            const allOptions = document.querySelectorAll(".answer-option");
            allOptions.forEach(opt => opt.classList.remove("selected"));
            button.classList.add("selected");
        });
        optionsEl.appendChild(button);
    });
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
    const sortedPlayers = Object.entries(players)
        .map(([name, data]) => ({ name, score: data.totalWinnings }))
        .sort((a, b) => b.score - a.score);
    if (sortedPlayers.length === 0 || sortedPlayers.every(p => p.score === 0)) {
        leaderboardEl.innerHTML = "<p>No players on the leaderboard yet.</p>";
        return;
    }
    sortedPlayers.forEach(({ name, score }, index) => {
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

function updateTokenDisplay() {
    updateActivePlayerDisplay();
    const balanceEl = document.getElementById("active-player-balance");
    balanceEl.classList.remove("bounce");
    void balanceEl.offsetWidth;
    balanceEl.classList.add("bounce");
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

function startNewRound() {
    bets = [];
    localStorage.setItem("bets", JSON.stringify(bets));
    renderDistribution();
    updateHistoryLog();
    document.getElementById("winner-announcement").innerHTML = "";
    gameOver = false;
    startTimer(gameSettings.questionTimerDuration);
}

function getBetSummary() {
    const summary = {};
    for (let bet of bets) {
        if (!summary[bet.option]) summary[bet.option] = 0;
        summary[bet.option] += bet.amount;
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

function calculateAndPayWinners() {
    const savedWinner = JSON.parse(localStorage.getItem("winningAnswer"));
    const currentPoll = polls[currentPollIndex];
    let winningOption = null;
    if (savedWinner && savedWinner.question === currentPoll.question) {
        winningOption = savedWinner.answer;
        localStorage.removeItem("winningAnswer");
    } else {
        alert("Host error: No winning answer has been set for this poll from the Admin Panel. Please set a winner and try again.");
        return { error: true };
    }
    const summary = getBetSummary();
    const odds = calculateOdds(summary);
    let winners = [];
    let totalWinnings = 0;
    for (let bet of bets) {
        if (bet.option === winningOption) {
            const payout = Math.floor(bet.amount * odds[winningOption]);
            if (players[bet.player]) {
                players[bet.player].balance += payout;
                players[bet.player].totalWinnings += payout;
            }
            totalWinnings += payout;
            winners.push(`${bet.player} won ${payout} tokens!`);
        }
    }
    localStorage.setItem("players", JSON.stringify(players));
    return { winningOption, winners, totalWinnings };
}

document.getElementById("player-name-input").addEventListener("change", (e) => {
    setActivePlayer(e.target.value);
});

document.getElementById("bet-form").addEventListener("submit", function (e) {
    e.preventDefault();
    if (gameOver) {
        alert("Round is over. Please reset the game to play again.");
        return;
    }
    if (!activePlayerName) {
        alert("Please enter a player's name before placing a bet.");
        return;
    }
    const selectedButton = document.querySelector('.answer-option.selected');
    const betAmount = parseInt(document.getElementById("bet-amount").value);
    if (!selectedButton) {
        alert("Please choose an option to bet on!");
        return;
    }
    if (isNaN(betAmount) || betAmount < 1) {
        alert("Please enter a valid bet amount.");
        return;
    }
    if (betAmount > players[activePlayerName].balance) {
        alert(`${activePlayerName} does not have enough tokens for this bet!`);
        return;
    }
    const option = selectedButton.dataset.value;
    bets.push({ player: activePlayerName, option: option, amount: betAmount });
    players[activePlayerName].balance -= betAmount;
    localStorage.setItem("bets", JSON.stringify(bets));
    localStorage.setItem("players", JSON.stringify(players));
    updateTokenDisplay();
    renderDistribution();
    updateHistoryLog();
    const betSound = document.getElementById("bet-sound");
    betSound.currentTime = 0;
    betSound.play();
    alert(`Bet placed: ${betAmount} tokens on "${option}" by ${activePlayerName}`);
    document.getElementById("bet-amount").value = 10;
    if (selectedButton) selectedButton.classList.remove("selected");
});

document.getElementById("reveal-btn").addEventListener("click", function () {
    stopTimer();
    if (bets.length === 0) { alert("No bets placed yet!"); return; }
    if (gameOver) { alert("The winner has already been revealed!"); return; }
    gameOver = true;
    document.getElementById("reveal-btn").style.display = "none";
    const announce = document.getElementById("winner-announcement");
    announce.innerHTML = "<h3>Picking a winner...</h3>";
    setTimeout(() => {
        const results = calculateAndPayWinners();
        if (results.error) {
            gameOver = false;
            document.getElementById("reveal-btn").style.display = "inline-block";
            document.getElementById("winner-announcement").innerHTML = "";
            return;
        }
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
    if (currentPollIndex >= polls.length) { currentPollIndex = 0; }
    localStorage.setItem("currentPollIndex", currentPollIndex.toString());
    renderPoll();
    startNewRound();
    document.getElementById("reveal-btn").style.display = "inline-block";
    document.getElementById("next-round-btn").style.display = "none";
});

document.getElementById("next-poll-btn").addEventListener("click", function() {
    currentPollIndex++;
    if (currentPollIndex >= polls.length) { currentPollIndex = 0; }
    localStorage.setItem("currentPollIndex", currentPollIndex.toString());
    renderPoll();
    startNewRound();
});

document.getElementById("prev-poll-btn").addEventListener("click", function() {
    currentPollIndex--;
    if (currentPollIndex < 0) { currentPollIndex = polls.length - 1; }
    localStorage.setItem("currentPollIndex", currentPollIndex.toString());
    renderPoll();
    startNewRound();
});

document.getElementById("reset-btn").addEventListener("click", function () {
    const confirmReset = confirm("Are you sure you want to reset the game?");
    if (!confirmReset) return;
    bets = [];
    players = {};
    gameOver = false;
    activePlayerName = null;
    currentPollIndex = 0;
    localStorage.removeItem("bets");
    localStorage.removeItem("players");
    localStorage.setItem("currentPollIndex", "0");
    initializeGame();
    document.getElementById("winner-announcement").innerHTML = "";
    alert("Game has been reset!");
});

let keySequence = [];
const secretCode = ['a', 'a', 'a'];
document.addEventListener('keydown', (e) => {
    keySequence.push(e.key.toLowerCase());
    keySequence = keySequence.slice(-secretCode.length);
    if (keySequence.join(',') === secretCode.join(',')) {
        alert("Admin access granted!");
        window.location.href = 'admin.html';
    }
});

function initializeGame() {
    updatePlayerList();
    updateActivePlayerDisplay();
    renderPoll();
    renderDistribution();
    updateHistoryLog();
    renderLeaderboard();
    startTimer(gameSettings.questionTimerDuration);
}

initializeGame();