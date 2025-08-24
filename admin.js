function renderAdminPolls() {
    const polls = JSON.parse(localStorage.getItem("polls")) || [];
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
            optionButton.addEventListener("click", () => {
                const confirmSet = confirm(`Set "${optionText}" as the winner for the poll:\n\n"${poll.question}"?`);
                
                if (confirmSet) {
                    localStorage.setItem("winningAnswer", JSON.stringify({ question: poll.question, answer: optionText }));
                    alert(`Success! The winning answer has been set to "${optionText}".`);
                }
            });
            optionsDiv.appendChild(optionButton);
        });
        pollDiv.appendChild(optionsDiv);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "❌ Delete Poll";
        deleteButton.style.marginTop = "15px";
        deleteButton.style.backgroundColor = "#dc3545"; 

        deleteButton.addEventListener("click", () => {
            const confirmDelete = confirm(`Are you sure you want to delete this poll?\n\n"${poll.question}"`);
            if (confirmDelete) {
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
    const option1 = document.getElementById("poll-option-1").value.trim();
    const option2 = document.getElementById("poll-option-2").value.trim();
    const option3 = document.getElementById("poll-option-3").value.trim();
    const option4 = document.getElementById("poll-option-4").value.trim();
    const option5= document.getElementById("poll-option-5").value.trim();
    const option6= document.getElementById("poll-option-6").value.trim();

    const options = [option1, option2, option3, option4, option5, option6].filter(option => option !== "");

    const newPoll = {
        question: question,
        options: options
    };

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

// Run the function when the page loads
renderAdminPolls();
