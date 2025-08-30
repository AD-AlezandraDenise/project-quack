function renderAdminPolls() {
    const polls = JSON.parse(localStorage.getItem("polls")) || [];
    const answerKey = JSON.parse(localStorage.getItem("answerKey")) || {}; 
    const pollListContainer = document.getElementById("admin-poll-list");
    pollListContainer.innerHTML = "";

    polls.forEach((poll, index) => {
        const pollDiv = document.createElement("div");
        pollDiv.style.border = "1px solid #ddd";
        pollDiv.style.padding = "15px";
        pollDiv.style.marginBottom = "15px";
        pollDiv.style.borderRadius = "8px";

        const questionEl = document.createElement("h3");
        questionEl.textContent = poll.question;
        pollDiv.appendChild(questionEl);

        const optionsDiv = document.createElement("div");
        poll.options.forEach(optionText => {
            const optionButton = document.createElement("button");
            optionButton.textContent = optionText;
            optionButton.style.marginRight = "10px";
            optionButton.style.marginBottom = "10px";

            if (answerKey[poll.question] === optionText) {
                optionButton.classList.add("selected-winner");
            }

            optionButton.addEventListener("click", () => {
                const currentAnswerKey = JSON.parse(localStorage.getItem("answerKey")) || {};
            
                currentAnswerKey[poll.question] = optionText;
                localStorage.setItem("answerKey", JSON.stringify(currentAnswerKey));

                const winningAnswer = { question: poll.question, answer: optionText };
                localStorage.setItem("winningAnswer", JSON.stringify(winningAnswer));
                
                alert(`Success! Answer key updated. "${optionText}" is set as the correct answer.`);
                renderAdminPolls(); 
            });
            optionsDiv.appendChild(optionButton);
        });
        pollDiv.appendChild(optionsDiv);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "❌ Delete Poll";
        deleteButton.style.marginTop = "15px";
        deleteButton.style.backgroundColor = "#dc3545";
        deleteButton.addEventListener("click", () => {
            if (confirm(`Are you sure you want to delete this poll?\n\n"${poll.question}"`)) {
                const currentPolls = JSON.parse(localStorage.getItem("polls")) || [];
                currentPolls.splice(index, 1);
                localStorage.setItem("polls", JSON.stringify(currentPolls));
                renderAdminPolls();
            }
        });
        pollDiv.appendChild(deleteButton);
        pollListContainer.appendChild(pollDiv);
    });
}

const createPollForm = document.getElementById("create-poll-form");
createPollForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const question = document.getElementById("poll-question").value.trim();
    const options = [
        document.getElementById("poll-option-1").value.trim(),
        document.getElementById("poll-option-2").value.trim(),
        document.getElementById("poll-option-3").value.trim(),
        document.getElementById("poll-option-4").value.trim(),
        document.getElementById("poll-option-5").value.trim(),
        document.getElementById("poll-option-6").value.trim()
    ].filter(option => option !== "");

    if (options.length < 2) {
        alert("Please provide at least two answer options.");
        return;
    }

    const newPoll = { question, options };
    const polls = JSON.parse(localStorage.getItem("polls")) || [];
    polls.push(newPoll);
    localStorage.setItem("polls", JSON.stringify(polls));
    alert("New poll has been saved successfully!");
    createPollForm.reset();
    renderAdminPolls();
});

const settingsForm = document.getElementById("settings-form");
settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const lobbyTime = document.getElementById("lobby-timer").value;
    const questionTime = document.getElementById("question-timer").value;
    const gameSettings = {
        lobbyTimerDuration: lobbyTime * 60,
        questionTimerDuration: parseInt(questionTime)
    };
    localStorage.setItem("gameSettings", JSON.stringify(gameSettings));
    alert("Game settings have been saved!");
});

renderAdminPolls();