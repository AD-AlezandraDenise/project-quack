let timerInterval = null; 
let timeLeft = 0; 

function updateTimerDisplay() {
    const timerEl = document.getElementById("timer-display");
    if (timerEl) {
        timerEl.textContent = timeLeft;
    }
}

function startTimer(duration) {
 
    stopTimer();

    timeLeft = duration; 
    updateTimerDisplay(); 

    timerInterval = setInterval(() => {
        timeLeft--; 
        updateTimerDisplay(); 

        if (timeLeft <= 0) {
            stopTimer(); 
            alert("Time's up!");
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval); 
}