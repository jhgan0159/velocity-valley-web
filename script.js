document.addEventListener('DOMContentLoaded', () => {
    const introOverlay = document.getElementById('intro-overlay');
    const introVideo = document.getElementById('intro-video');
    const startIntroBtn = document.getElementById('start-intro-btn');
    const skipBtn = document.getElementById('skip-intro-btn');
    const bgMusicElement = document.getElementById('bg-music');

    function closeIntro() {
        if (!introOverlay) return;
        introOverlay.style.transition = "opacity 1s";
        introOverlay.style.opacity = "0";
        setTimeout(() => {
            introOverlay.style.display = "none";
            if (bgMusicElement) {
                bgMusicElement.volume = 0.5;
                bgMusicElement.play().catch(e => console.log("Bg music blocked", e));
            }
        }, 1000);
    }

    if (startIntroBtn && introVideo) {
        startIntroBtn.addEventListener('click', () => {
            introVideo.muted = false;
            introVideo.volume = 1.0;
            introVideo.currentTime = 0;
            introVideo.play().then(() => {
                startIntroBtn.style.display = 'none';
                if (skipBtn) skipBtn.style.display = 'block';
            }).catch(e => console.log("Play failed", e));
        });
    }

    if (introVideo) introVideo.addEventListener('ended', closeIntro);
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            if (introVideo) introVideo.pause();
            closeIntro();
        });
    }

    const gameBoard = document.getElementById('game-board');
    const rollDiceBtn = document.getElementById('roll-dice-btn');
    const diceImage = document.getElementById('dice-image');
    const gameLog = document.getElementById('game-log');
    const currentPlayerName = document.getElementById('current-player-name');
    const currentPlayerColor = document.getElementById('current-player-color');

    const questionModal = document.getElementById('question-modal');
    const questionLevel = document.getElementById('question-level');
    const questionText = document.getElementById('question-text');
    const questionImage = document.getElementById('question-image');
    const answerBox = document.getElementById('answer-box');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');

    const explanationModal = document.getElementById('explanation-modal');
    const explanationTitle = document.getElementById('explanation-title');
    const explanationCorrectAnswer = document.getElementById('explanation-correct-answer');
    const explanationText = document.getElementById('explanation-text');
    const continueGameBtn = document.getElementById('continue-game-btn');

    const gameSetupModal = document.getElementById('game-setup-modal');
    const playerCountSelect = document.getElementById('player-count-select');
    const playerInputsContainer = document.getElementById('player-inputs-container');
    const startGameBtn = document.getElementById('start-game-btn');
    const gameContainer = document.querySelector('.game-container');
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const scoreList = document.getElementById('score-list');
    const roundCounter = document.getElementById('round-counter');
    const gameTimer = document.getElementById('game-timer');

    const powerupModal = document.getElementById('powerup-modal');
    const wheelDisplay = document.getElementById('wheel-display');
    const spinBtn = document.getElementById('spin-btn');
    const closePowerupBtn = document.getElementById('close-powerup-btn');

    const gameOverModal = document.getElementById('game-over-modal');
    const finalWinner = document.getElementById('final-winner');
    const finalAverage = document.getElementById('final-average');
    const exportBtn = document.getElementById('export-btn');

    let players = [];
    let gameHistory = [];
    const allPlayerColors = ["#E53935", "#1E88E5", "#43A047", "#FDD835"];

    let currentPlayerIndex = 0;
    let currentQuestionForChecking = null;
    let currentQuestionType = '';
    let gameInProgress = false;
    const totalSquares = 25;
    let currentRound = 1;
    let maxRounds = 10;
    let gameTimerInterval = null;
    let totalSecondsPlayed = 0;

    const boardLayout = {
        0: { x: 180, y: 43, type: "Start", name: "START" },
        1: { x: 280, y: 43, type: "C1_Question" },
        2: { x: 355, y: 43, type: "C1_Question" },
        3: { x: 435, y: 43, type: "C1_Question" },
        4: { x: 500, y: 43, type: "C1_Question" },
        5: { x: 580, y: 43, type: "C1_Question" },
        6: { x: 660, y: 43, type: "C1_Question" },
        7: { x: 780, y: 128, type: "C2_Question" },
        8: { x: 780, y: 214, type: "C2_Question" },
        9: { x: 780, y: 300, type: "C2_Question" },
        10: { x: 780, y: 385, type: "C2_Question" },
        11: { x: 780, y: 471, type: "C2_Question" },
        12: { x: 780, y: 557, type: "C2_Question" },
        13: { x: 660, y: 490, type: "C3_Question" },
        14: { x: 580, y: 490, type: "C3_Question" },
        15: { x: 500, y: 490, type: "C3_Question" },
        16: { x: 435, y: 490, type: "C3_Question" },
        17: { x: 355, y: 490, type: "C3_Question" },
        18: { x: 290, y: 490, type: "C3_Question" },
        19: { x: 160, y: 557, type: "C4_Question" },
        20: { x: 160, y: 471, type: "C4_Question" },
        21: { x: 160, y: 385, type: "C4_Question" },
        22: { x: 160, y: 300, type: "C4_Question" },
        23: { x: 160, y: 214, type: "C4_Question" },
        24: { x: 160, y: 128, type: "C4_Question" },
        25: { x: 160, y: 43, type: "Finish", name: "END" }
    };

    const POWERUP_POOL = [
        { name: "⏱ Time Freeze", type: "time_freeze", desc: "Pauses your timer on NEXT turn" },
        { name: "🚫 Miss a Turn", type: "miss_turn", desc: "Skip next player's turn" },
        { name: "✈️ Teleport", type: "teleport", desc: "Move to any square" },
        { name: "💰 Jackpot", type: "jackpot", desc: "Get +3 Points instantly" },
        { name: "🏹 Robin Hood", type: "robin_hood", desc: "Steal 2 pts from Leader" }
    ];

    const defaultQuestionPools = {
        "C1_Question": [
            { level: "C1: Remembering", question: "Hubungan antara daya, F, jisim, m dan pecutan, a diberi oleh persamaan \nF = ma \nAntara yang berikut, manakah yang betul mewakili persamaan tersebut? \nA Hukum Gerakan Newton pertama\nB Hukum Gerakan Newton kedua\nC Hukum Gerakan Newton ketiga", answer: ["B"], explanation: "Hukum Gerakan Newton Kedua menyatakan hubungan antara daya, jisim dan pecutan, F = ma." },
            { level: "C1: Remembering", question: "Antara berikut, pernyataan manakah yang betul tentang berat? \nA Kuantiti vektor\nB Tetap di semua tempat\nC Pecutan graviti\nD Kuantiti jirim dalam sesuatu objek", answer: ["A"], explanation: "Berat ialah kuantiti vektor kerana mempunyai magnitud dan arah." },
            { level: "C1: Remembering", question: "Antara kuantiti fizik berikut, yang manakah mempunyai unit m s⁻²?\nA Laju\nB Halaju\nC Pecutan\nD Sesaran", answer: ["C"], explanation: "Unit m s⁻² ialah unit bagi pecutan." },
            { level: "C1: Remembering", question: "Apakah nilai g? \nA 9.81 m s⁻¹\nB 9.81 m s⁻²\nC 10 m s⁻¹\nD 12.7 m s⁻¹", answer: ["B"], explanation: "Nilai standard pecutan graviti ialah 9.81 m s⁻²." },
            { level: "C1: Remembering", question: "Inersia sesuatu objek dipengaruhi oleh\nA Suhu\nB Jirim\nC Jisim\nD Kuantiti bahan", answer: ["C"], explanation: "Inersia sesuatu objek bergantung kepada jisimnya." },
            { level: "C1: Remembering", question: "Antara berikut, yang manakah merupakan unit bagi momentum? \nA N\nB kg m s⁻¹\nC kg m s⁻²\nD kg⁻¹ s⁻²", answer: ["B"], explanation: "Momentum = jisim × halaju (kg m s⁻¹)." }
        ],
        "C2_Question": [
            { level: "C2: Understanding", question: "Antara kenderaan berikut, yang manakah paling sukar untuk mula bergerak dari keadaan pegun? \nA. Sebuah kereta kompak\nB. Sebuah motosikal\nC. Sebuah bas sekolah yang penuh dengan penumpang\nD. Sebuah lori kosong", answer: ["C"], explanation: "Inersia berkadar terus dengan jisim." },
            { level: "C2: Understanding", question: "Apabila sos cili sukar dikeluarkan daripada botol, kita sering menggoncang botol itu dengan kuat dan memberhentikannya secara mengejut. Konsep fizik manakah yang menerangkan situasi ini? \nA. Prinsip Pascal\nB. Hukum Gerakan Newton Pertama\nC. Hukum Gerakan Newton Ketiga\nD. Prinsip Keabadian Momentum", answer: ["B"], explanation: "Hukum Gerakan Newton Pertama (Inersia)." },
            { level: "C2: Understanding", question: "Mengapakah pecutan sebuah roket semakin bertambah apabila ia naik tinggi ke atmosfera? \nA. Tarikan graviti semakin bertambah.\nB. Rintangan udara semakin bertambah.\nC. Jisim roket semakin berkurang kerana bahan api terbakar.\nD. Suhu enjin semakin meningkat.", answer: ["C"], explanation: "Mengikut F=ma, apabila jisim berkurang, pecutan bertambah." }
        ],
        "C3_Question": [
            { level: "C3: Applying", question: "Sebuah troli X berjisim 6 kg dengan halaju 3 m s⁻¹ berlanggar secara elastik dengan satu lagi troli Y berjisim 3 kg dengan halaju 2 m s⁻¹. Jika troli X berhenti sejurus selepas perlanggaran, hitungkan halaju akhir bagi troli Y. \nA. 4 m s⁻¹ \nB. 5 m s⁻¹ \nC. 8 m s⁻¹ \nD. 9 m s⁻¹", answer: ["C"], explanation: "(6)(3) + (3)(2) = 0 + 3(v2) => v2 = 8 m s⁻¹" },
            { level: "C3: Applying", question: "Seorang atlet larian lelaki yang berjisim 50 kg berlari dengan daya 100 N. Hitungkan pecutannya. \nA 2 m s⁻² \nB 5 m s⁻² \nC 20 m s⁻² \nD 150 m s⁻²", answer: ["A"], explanation: "a = F/m = 100/50 = 2 m s⁻²" }
        ],
        "C4_Question": [
            { level: "C4: Analyzing", question: "Sebiji telur dijatuhkan ke atas lantai simen dan ke atas span tebal dari ketinggian yang sama. Pernyataan manakah yang benar mengenai hubungan antara masa impak (t) dan daya impuls (F)?\nA. Masa impak di atas permukaan lantai adalah lebih panjang.\nB. Masa impak di atas permukaan span adalah lebih singkat.\nC. Daya impuls adalah berkadar terus dengan masa impak.\nD. Daya impuls adalah berkadar songsang dengan masa impak.", answer: ["D"], explanation: "Daya impuls berkadar songsang dengan masa impak (F = Δp / t)." },
            { level: "C4: Analyzing", question: "Sebiji buah durian sedang jatuh dari pokok. Kuantiti fizik yang manakah yang kekal malar? \nA Halaju akhir \nB Masa jatuhan \nC Kadar perubahan halaju \nD Kadar perubahan sesaran", answer: ["C"], explanation: "Kadar perubahan halaju ialah pecutan graviti (g), yang sentiasa malar." }
        ]
    };

    let customQuestions = null;
    try {
        const stored = localStorage.getItem('customQuestions');
        if (stored) customQuestions = JSON.parse(stored);
    } catch (e) {}

    const questionPools = (customQuestions && customQuestions["C1_Question"] && customQuestions["C1_Question"].length > 0)
        ? customQuestions
        : defaultQuestionPools;

    function startMasterTimer() {
        gameTimerInterval = setInterval(() => {
            totalSecondsPlayed++;
            const minutes = Math.floor(totalSecondsPlayed / 60);
            const seconds = totalSecondsPlayed % 60;
            gameTimer.textContent = `Total Time: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            if (players[currentPlayerIndex] && !players[currentPlayerIndex].isTimeFrozen) {
                players[currentPlayerIndex].timePlayed++;
            }
            updateLeaderboard();
        }, 1000);
    }

    function updateGameLog(message) { gameLog.textContent = message; }

    function updateLeaderboard() {
        scoreList.innerHTML = '';
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        sortedPlayers.forEach(player => {
            const li = document.createElement('li');
            const m = Math.floor(player.timePlayed / 60);
            const s = player.timePlayed % 60;
            const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            const frozenIcon = player.isTimeFrozen ? "❄️" : "⏱";
            li.innerHTML = `<span class="score-color-dot" style="background-color: ${player.color}"></span> ${player.name}: ${player.score} pts ${player.streak > 0 ? `(🔥${player.streak})` : ''} <span style="font-size: 0.85em; margin-left: 8px;">${frozenIcon} ${timeStr}</span>`;
            scoreList.appendChild(li);
        });
    }

    function generatePlayerNameInputs() {
        playerInputsContainer.innerHTML = '';
        const count = parseInt(playerCountSelect.value);
        for (let i = 0; i < count; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `Enter Player ${i + 1} Name`;
            input.className = 'player-name-input';
            input.id = `player-name-input-${i}`;
            input.value = `Player ${i + 1}`;
            playerInputsContainer.appendChild(input);
        }
    }

    generatePlayerNameInputs();
    playerCountSelect.addEventListener('change', generatePlayerNameInputs);

    function startGame() {
        const numPlayers = parseInt(playerCountSelect.value);
        const roundsInput = document.getElementById('round-count-input');
        if (roundsInput && roundsInput.value) maxRounds = Math.max(1, parseInt(roundsInput.value));
        players = [];
        gameHistory = [];
        for (let i = 0; i < numPlayers; i++) {
            const nameInput = document.getElementById(`player-name-input-${i}`);
            players.push({
                id: i, name: nameInput.value.trim() || `Player ${i + 1}`, position: 0, previousPosition: 0, score: 0,
                color: allPlayerColors[i], streak: 0, skipTurn: false, timePlayed: 0, isTimeFrozen: false, pendingTimeFreeze: false
            });
        }
        gameSetupModal.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        leaderboardContainer.classList.remove('hidden');
        gameInProgress = true;
        startMasterTimer();
        setupBoard();
    }

    function setupBoard() {
        gameBoard.innerHTML = '';
        players.forEach(player => {
            const token = document.createElement('div');
            token.id = `player-${player.id}`;
            token.classList.add('player-token');
            token.style.backgroundColor = player.color;
            gameBoard.appendChild(token);
            movePlayerToken(player.id, 0, true);
        });
        updatePlayerUI();
        updateLeaderboard();
        roundCounter.textContent = `Round: 1 / ${maxRounds}`;
    }

    function movePlayerToken(playerIndex, position, instant = false) {
        const token = document.getElementById(`player-${playerIndex}`);
        const targetSquare = boardLayout[position];
        if (!targetSquare) return;
        const offsetX = (playerIndex % 2) * 15 - 7.5;
        const offsetY = Math.floor(playerIndex / 2) * 15 - 7.5;
        token.style.transition = instant ? 'none' : 'all 0.5s ease-in-out';
        token.style.left = `${targetSquare.x + offsetX}px`;
        token.style.top = `${targetSquare.y + offsetY}px`;
    }

    function updatePlayerUI() {
        if (players.length === 0) return;
        const player = players[currentPlayerIndex];
        if (player.skipTurn) {
            updateGameLog(`${player.name} misses a turn!`);
            player.skipTurn = false;
            setTimeout(nextTurn, 2000);
            return;
        }
        currentPlayerName.textContent = player.name;
        currentPlayerColor.style.backgroundColor = player.color;
        gameLog.textContent = `${player.name}, your turn!`;
    }

    function rollDice() {
        if (!gameInProgress) return;
        const player = players[currentPlayerIndex];
        if (player.skipTurn) return;
        rollDiceBtn.disabled = true;
        player.previousPosition = player.position;
        const roll = Math.floor(Math.random() * 6) + 1;
        diceImage.src = `/static/images/dice-${roll}.png`;
        player.position = (player.position + roll) % (totalSquares + 1);
        updateGameLog(`${player.name} rolled a ${roll}!`);
        movePlayerToken(player.id, player.position);

        setTimeout(() => {
            let questionType = "Safe";
            if (player.position >= 1 && player.position <= 6) questionType = "C1_Question";
            else if (player.position >= 7 && player.position <= 12) questionType = "C2_Question";
            else if (player.position >= 13 && player.position <= 18) questionType = "C3_Question";
            else if (player.position >= 19 && player.position < totalSquares) questionType = "C4_Question";

            if (questionType.includes("_Question")) showQuestion(questionType);
            else { updateGameLog("Safe square!"); setTimeout(nextTurn, 1000); }
        }, 700);
    }

    function showQuestion(questionType) {
        const pool = questionPools[questionType];
        if (!pool || pool.length === 0) { setTimeout(nextTurn, 1000); return; }
        const q = pool[Math.floor(Math.random() * pool.length)];
        currentQuestionForChecking = { ...q };
        currentQuestionType = questionType;
        if (q.image && q.image.trim() !== "") {
            questionImage.src = q.image.startsWith('/') ? q.image : `/static/${q.image}`;
            questionImage.classList.remove('hidden');
        } else {
            questionImage.classList.add('hidden');
        }
        questionLevel.textContent = q.level;
        questionText.textContent = q.question;
        answerBox.value = "";
        questionModal.classList.remove('hidden');
        answerBox.focus();
    }

    function checkAnswer() {
        if (!currentQuestionForChecking) return;
        const player = players[currentPlayerIndex];
        const userAnswer = answerBox.value.trim().toLowerCase();
        const rawAnswer = currentQuestionForChecking.answer;
        const isCorrect = Array.isArray(rawAnswer)
            ? rawAnswer.map(a => a.trim().toLowerCase()).includes(userAnswer)
            : (userAnswer === rawAnswer.trim().toLowerCase());

        gameHistory.push({
            player: player.name, question: currentQuestionForChecking.question,
            studentAnswer: answerBox.value.trim(), result: isCorrect ? "Correct" : "Incorrect"
        });
        questionModal.classList.add('hidden');

        if (isCorrect) {
            let points = currentQuestionType === "C2_Question" ? 2 : (currentQuestionType === "C3_Question" ? 3 : (currentQuestionType === "C4_Question" ? 4 : 1));
            player.score += points;
            player.streak += 1;
            updateGameLog(`Correct! +${points} pts.`);
            if (player.streak >= 3) {
                player.streak = 0;
                setTimeout(() => activatePowerUpWheel(player), 1000);
                return;
            }
        } else {
            player.score -= 1;
            player.streak = 0;
            updateGameLog(`Wrong! -1 pt.`);
            player.position = player.previousPosition;
            movePlayerToken(player.id, player.position);
        }
        updateLeaderboard();
        showExplanation(isCorrect, currentQuestionForChecking);
    }

    function activatePowerUpWheel(player) {
        powerupModal.classList.remove('hidden');
        wheelDisplay.textContent = "Click SPIN!";
        spinBtn.disabled = false;
        closePowerupBtn.classList.add('hidden');
        spinBtn.classList.remove('hidden');
        spinBtn.onclick = () => {
            spinBtn.disabled = true;
            let spins = 0;
            const interval = setInterval(() => {
                wheelDisplay.textContent = POWERUP_POOL[spins % POWERUP_POOL.length].name;
                spins++;
            }, 100);
            setTimeout(() => {
                clearInterval(interval);
                const reward = POWERUP_POOL[Math.floor(Math.random() * POWERUP_POOL.length)];
                wheelDisplay.innerHTML = `<div style="font-size:1.5em; color:#E65100;">${reward.name}</div><div style="font-size:0.6em;">${reward.desc}</div>`;
                if (reward.type === "jackpot") player.score += 3;
                else if (reward.type === "miss_turn") players[(currentPlayerIndex + 1) % players.length].skipTurn = true;
                updateLeaderboard();
                spinBtn.classList.add('hidden');
                closePowerupBtn.classList.remove('hidden');
            }, 2000);
        };
        closePowerupBtn.onclick = () => {
            powerupModal.classList.add('hidden');
            showExplanation(true, currentQuestionForChecking);
        };
    }

    function showExplanation(isCorrect, question) {
        explanationTitle.textContent = isCorrect ? "Correct!" : "Incorrect!";
        explanationCorrectAnswer.textContent = `Answer: ${Array.isArray(question.answer) ? question.answer.join(" / ") : question.answer}`;
        explanationText.textContent = question.explanation;
        explanationModal.classList.remove('hidden');
    }

    function nextTurn() {
        if (!gameInProgress) return;
        explanationModal.classList.add('hidden');
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        if (currentPlayerIndex === 0) {
            currentRound++;
            if (currentRound > maxRounds) { endGame(); return; }
            roundCounter.textContent = `Round: ${currentRound} / ${maxRounds}`;
        }
        updatePlayerUI();
        rollDiceBtn.disabled = false;
    }

    function endGame() {
        clearInterval(gameTimerInterval);
        gameInProgress = false;
        const sorted = [...players].sort((a, b) => b.score - a.score);
        finalWinner.textContent = `🏆 Winner: ${sorted[0].name} (${sorted[0].score} pts)`;
        finalAverage.textContent = `Avg Score: ${(players.reduce((a, b) => a + b.score, 0) / players.length).toFixed(2)}`;
        gameOverModal.classList.remove('hidden');
    }

    function exportGameData() {
        let csv = "Player,Score,Time Played (s)\n" + players.map(p => `"${p.name}",${p.score},${p.timePlayed}`).join("\n");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
        link.download = "PhysicsMonopoly_Report.csv";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }

    startGameBtn.addEventListener('click', startGame);
    rollDiceBtn.addEventListener('click', rollDice);
    submitAnswerBtn.addEventListener('click', checkAnswer);
    answerBox.addEventListener('keyup', (e) => { if (e.key === 'Enter') checkAnswer(); });
    continueGameBtn.addEventListener('click', nextTurn);
    exportBtn.addEventListener('click', exportGameData);
});
