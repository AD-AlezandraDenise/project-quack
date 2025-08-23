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
                    const winningAnswer = {
                        question: poll.question,
                        answer: optionText
                    };
                    
                    localStorage.setItem("winningAnswer", JSON.stringify(winningAnswer));
                    
                    alert(`Success! The winning answer has been set to "${optionText}".`);
                }

            } );
            
            optionsDiv.appendChild(optionButton);
        });

        pollDiv.appendChild(optionsDiv);

        pollListContainer.appendChild(pollDiv);
    });
}

// Run the function when the page loads
renderAdminPolls();
