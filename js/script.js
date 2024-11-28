let players = [];
let currentPlayer = 0;
let gameScore = 301;
let playerCount = 2;
let lastScores = []; 
let legsCount = 1; 
let currentLeg = 1; 
let nextLegStartPlayer = 0; 
let legMode = 'bestOf'; 
let legsToWin = 0; 
let gameStartTime = null;
let gameEndTime = null;
let confettiInterval;
let isConfettiActive = true;
let currentLanguage = localStorage.getItem('language') || 'ru';


// Обработчики событий для кнопок
document.getElementById('playersButton').addEventListener('click', showModal);
document.getElementById('statsButton').addEventListener('click', showModal);
document.getElementById('tournamentsButton').addEventListener('click', showModal);
document.getElementById('settingsButton').addEventListener('click', showModal);

// Обработчик событий для модального окна
document.getElementById('closeModal').addEventListener('click', closeModal);
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        closeModal();
    }
});

// Функции для показа и скрытия модального окна
function showModal() {
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const backToMenuButton = document.getElementById('backToMenuButton');
    const settingsDiv = document.querySelector('.settings');
    const menuButtons = document.querySelectorAll('.menu-button');

    // Проверяем, что элементы найдены
    if (!settingsDiv) {
        console.error('Элемент с классом settings не найден.');
        return;
    }

    if (menuButtons.length === 0) {
        console.error('Кнопки меню не найдены.');
        return;
    }

    // Скрыть меню настроек при загрузке
    settingsDiv.classList.add('hidden'); // Убедитесь, что меню настроек скрыто

    // Показать кнопки меню при загрузке
    menuButtons.forEach(button => {
        button.style.display = 'block'; // Показываем кнопки меню
    });

    // Обработчик для кнопки "Новая игра"
    const startNewGameButton = document.getElementById('startNewGameButton');
    if (startNewGameButton) {
        startNewGameButton.addEventListener('click', function() {
            menuButtons.forEach(button => {
                button.style.display = 'none'; // Скрываем кнопки меню
            });
            settingsDiv.classList.remove('hidden'); // Показываем блок настроек
        });
    }

    // Обработчик для кнопки "Вернуться в меню"
    if (backToMenuButton) {
        backToMenuButton.addEventListener('click', function() {
            settingsDiv.classList.toggle('hidden'); // Скрываем блок настроек
            menuButtons.forEach(button => {
                button.style.display = 'block'; // Показываем кнопки меню
            });
        });
    } else {
        console.error('Элемент с ID backToMenuButton не найден.');
    }
});

const menuButtons = document.querySelectorAll('.menu button');
console.log('Найденные кнопки меню:', menuButtons);

document.addEventListener('keydown', function(event) {
    if (event.key === 'F9') { // Проверяем, была ли нажата клавиша F9
        event.preventDefault(); // Предотвращаем действие по умолчанию
        const interfaceElements = document.querySelectorAll('.container, .modal-content, .confetti');
        interfaceElements.forEach(element => {
            element.classList.toggle('hidden'); // Переключение класса hidden
        });
    }
});

document.getElementById('toggleInterfaceButton').addEventListener('click', function() {
    const interfaceElements = document.querySelectorAll('.container, .modal-content, .confetti');
    interfaceElements.forEach(element => {
        element.classList.toggle('hidden'); // Переключение класса hidden
    });
});

document.addEventListener('click', function(event) {
    const interfaceElements = document.querySelectorAll('.container, .modal-content, .confetti');
    const isInterfaceHidden = Array.from(interfaceElements).every(element => element.classList.contains('hidden'));

    // Проверяем, был ли клик на одном из элементов интерфейса
    const isClickOnInterface = Array.from(interfaceElements).some(element => element.contains(event.target));

    if (isInterfaceHidden && !isClickOnInterface) {
        interfaceElements.forEach(element => {
            element.classList.remove('hidden'); // Убираем класс hidden, чтобы показать элементы интерфейса
        });
    }
});

document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        undoScore();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        document.querySelector('.theme-icon').textContent = '☀️';
    }
});

function toggleLanguage() {
    currentLanguage = currentLanguage === 'ru' ? 'en' : 'ru';
    localStorage.setItem('language', currentLanguage);
    document.getElementById('languageButton').textContent = currentLanguage;
    loadTranslations();
}

function loadTranslations() {
    fetch(`locales/${currentLanguage}.json`)
        .then(response => response.json())
        .then(translations => {
            document.title = translations.title;
            document.getElementById('gameTypeLabel').textContent = translations.gameType;
            document.getElementById('playerCountLabel').textContent = translations.playerCount;
            document.getElementById('legModeLabel').textContent = translations.legMode;
            document.getElementById('legsCountLabel').textContent = translations.legsCount;
            document.getElementById('startGameButton').textContent = translations.startGame;
            document.getElementById('scoreLabel').textContent = translations.score;
            document.getElementById('submitScoreButton').textContent = translations.submitScore;
            document.getElementById('restartBtn').textContent = translations.restartBtn;
            document.getElementById('undoScoreButton').textContent = translations.undoButton;
            document.getElementById('undoScoreButton').title = translations.undoButtonTooltip;
            document.getElementById('statisticsTitle').textContent = translations.statistics;
            document.getElementById('startNewGameButton').textContent = `🎯 ${translations.startNewGameButton}`;
            document.getElementById('playersButton').textContent = `👥 ${translations.playersButton}`;
            document.getElementById('statsButton').textContent = `📊 ${translations.statsButton}`;
            document.getElementById('tournamentsButton').textContent = `🏆 ${translations.tournamentsButton}`;
            document.getElementById('settingsButton').textContent = `⚙️ ${translations.settingsButton}`;
        })
        .catch(error => {
            console.error('Ошибка при загрузке переводов:', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    loadTranslations();
    document.getElementById('languageButton').textContent = currentLanguage;
});

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('.theme-icon');
    
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        themeIcon.textContent = '🌙'; 
    } else {
        body.classList.add('light-theme');
        themeIcon.textContent = '☀️'; 
    }
    
    
    localStorage.setItem('theme', body.classList.contains('light-theme') ? 'light' : 'dark');
}

function adjustPlayers(value) {
    playerCount = Math.max(1, playerCount + value);
    document.getElementById('playerCount').textContent = playerCount;
}

function setTheme() {
    const theme = document.getElementById('themeType').value;
    document.body.classList.toggle('light-theme', theme === 'light');
}

function startGame() {
    gameStartTime = new Date();
    gameScore = parseInt(document.getElementById('gameType').value);
    playerCount = parseInt(document.getElementById('playerCount').textContent);
    legMode = document.getElementById('legMode').value;
    legsCount = parseInt(document.getElementById('legsCount').value);
    
    if (legMode === 'bestOf') {
        legsToWin = Math.ceil(legsCount / 2);
    } else { 
        legsToWin = legsCount;
    }
    
    players = Array.from({ length: playerCount }, () => ({
        score: gameScore,
        throws: 0,
        totalPoints: 0,
        history: [[]],
        legWins: 0,
        throwTimes: [],
        bestExceededScore: 0, // Лучший бросок при превышении
        bestNormalScore: 0 // Лучший бросок без превышения
    }));
    
    currentPlayer = 0;
    nextLegStartPlayer = 0;
    lastScores = [];
    currentLeg = 1;
    
    document.getElementById('score').value = '';
    
    updateScoreBoard();
    updateStatsBoard();
    document.getElementById('scoreInput').style.display = 'flex';
    document.querySelector('.settings').style.display = 'none';
    document.getElementById('restartBtn').style.display = 'inline-block';
    document.getElementById('score').focus();
    document.getElementById('statsBoard').style.display = 'flex';
}

function handleEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const scoreInput = document.getElementById('score');
        const expression = scoreInput.value;

        
        if (expression.includes('+')) {
            try {
                
                const sum = expression.split('+')
                    .map(num => parseInt(num.trim()))
                    .reduce((acc, curr) => {
                        if (isNaN(curr) || curr < 0 || curr > 60) {
                            throw new Error('Каждое число должно быть от 0 до 60');
                        }
                        return acc + curr;
                    }, 0);

                if (sum > 180) {
                    showErrorModal('Сумма не может быть больше 180');
                    return;
                }

                scoreInput.value = sum.toString();
                submitScore();
            } catch (error) {
                showErrorModal(error.message);
            }
        } else {
            
            submitScore();
        }
    }
}

function updateScoreBoard() {
    const scoreBoard = document.getElementById('scoreBoard');
    scoreBoard.innerHTML = '';

    
    const hasAnySuggestions = players.some(player => {
        const suggestions = getCheckoutSuggestions(player.score);
        return suggestions && suggestions.length > 0;
    });

    players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('score-column');
        if (index === currentPlayer) {
            playerDiv.classList.add('active-player');
        }
        
        
        const scoreElement = document.createElement('div');
        scoreElement.classList.add('score-main');
        scoreElement.innerHTML = `<span class="score-value">${player.score}</span>`;
        
        
        const suggestionsElement = document.createElement('div');
        suggestionsElement.classList.add('checkout-suggestions');
        
        
        const suggestions = getCheckoutSuggestions(player.score);
        if (suggestions && suggestions.length > 0) {
            suggestionsElement.innerHTML = suggestions.join('<br>');
        } else if (hasAnySuggestions) {
            
            suggestionsElement.innerHTML = 'Нет закрытия';
        }
        
        
        const legsElement = document.createElement('div');
        legsElement.classList.add('legs-info');
        legsElement.textContent = `Леги: ${player.legWins}${legMode === 'bestOf' ? 
            ` (до ${legsToWin})` : 
            ` / ${legsToWin}`}`;
        
        
        playerDiv.appendChild(scoreElement);
        playerDiv.appendChild(suggestionsElement);
        playerDiv.appendChild(legsElement);
        
        scoreBoard.appendChild(playerDiv);
    });
}

function showThrowsModal(playerNumber, legWins) {
    return new Promise((resolve) => {
        const modal = document.getElementById('throwsModal');
        const scoreInput = document.getElementById('score');
        
        
        scoreInput.disabled = true;
        
        const content = modal.querySelector('.modal-content');
        modal.classList.add('active');

        content.innerHTML = `
            <h2 style="font-size: 2em; margin-bottom: 20px;">За сколько бросков завершена игра?</h2>
            <p style="font-size: 1.2em; margin-bottom: 30px;">(Выберите мышью или нажмите 1, 2 или 3 на клавиатуре)</p>
            <div class="throws-buttons">
                <button class="throw-button" data-throws="1">1</button>
                <button class="throw-button" data-throws="2">2</button>
                <button class="throw-button" data-throws="3">3</button>
            </div>
        `;

        function handleThrow(throws) {
            content.innerHTML = `
                <h2 style="font-size: 2em; margin-bottom: 20px;">Игрок #${playerNumber} выиграл лег!</h2>
                <p style="font-size: 1.5em; margin-bottom: 30px;">Количество выигранных легов: ${legWins}</p>
                <button id="continueButton" style="font-size: 1.2em; padding: 10px 20px;">Продолжить</button>
            `;

            function continueGame() {
                modal.classList.remove('active');
                
                scoreInput.disabled = false;
                scoreInput.value = '';
                scoreInput.focus();
                resolve(throws);
                document.removeEventListener('keydown', handleEnterPress);
            }

            document.getElementById('continueButton').onclick = continueGame;

            function handleEnterPress(event) {
                if (event.key === 'Enter') {
                    continueGame();
                }
            }

            document.addEventListener('keydown', handleEnterPress);
        }

        const buttons = modal.querySelectorAll('.throw-button');
        buttons.forEach(button => {
            button.onclick = () => handleThrow(parseInt(button.dataset.throws));
        });

        function handleKeyPress(event) {
            if (['1', '2', '3'].includes(event.key)) {
                handleThrow(parseInt(event.key));
                document.removeEventListener('keydown', handleKeyPress);
            }
        }

        document.addEventListener('keydown', handleKeyPress);

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                document.removeEventListener('keydown', handleKeyPress);
            }
        });
    });
}

function showErrorModal(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('throwsModal');
        const content = modal.querySelector('.modal-content');
        modal.classList.add('active');

        content.innerHTML = `
            <h2 style="font-size: 2em; margin-bottom: 20px; color: #ff4444;">Ошибка</h2>
            <p style="font-size: 1.5em; margin-bottom: 30px;">${message}</p>
            <button id="continueButton" style="font-size: 1.2em; padding: 10px 20px;">OK</button>
        `;

        function closeError() {
            modal.classList.remove('active');
            document.getElementById('score').focus();
            resolve();
            document.removeEventListener('keydown', handleEnterPress);
        }

        document.getElementById('continueButton').onclick = closeError;

        function handleEnterPress(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                closeError();
            }
        }

        
        document.removeEventListener('keydown', handleEnterPress);
        
        document.addEventListener('keydown', handleEnterPress);

        
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                document.removeEventListener('keydown', handleEnterPress);
            }
        });
    });
}

function submitScore() {
    const scoreInput = document.getElementById('score');
    const score = parseInt(scoreInput.value);
    const player = players[currentPlayer];
    const currentTime = new Date();

    
    if (scoreInput.value.trim() === '') {
        scoreInput.value = '';
        scoreInput.focus();
        return;
    }

    if (isNaN(score) || score < 0 || score > 180) {
        showErrorModal('Введите корректное значение очков (0-180).');
        return;
    }
    
    if (score === player.score) {
        scoreInput.value = ''; 
        showThrowsModal(currentPlayer + 1, player.legWins + 1)
            .then(throwsToFinish => {
                
                const legScore = score; 
                player.score = 0;
                player.throws += throwsToFinish;
                player.totalPoints += legScore;
                player.history[player.history.length - 1].push(legScore);
                player.throwTimes.push(currentTime);
                player.legWins++;
                lastScores.push({ 
                    playerIndex: currentPlayer, 
                    score: legScore, 
                    legIndex: player.history.length - 1 
                });

                
                if (checkGameWin(player)) {
                    gameEndTime = new Date();
                    createConfetti();
                    setTimeout(() => {
                        showGameStats();
                    }, 1000);
                    return;
                }

                
                players.forEach(p => {
                    p.score = gameScore;
                    p.history.push([]);
                });
                nextLegStartPlayer = (nextLegStartPlayer + 1) % playerCount;
                currentPlayer = nextLegStartPlayer;
                
                updateScoreBoard();
                updateStatsBoard();
            });
        return;
    }
    
    const remainingScore = player.score - score;
    
    if (remainingScore < 0) {
        // Если игрок ввел больше очков, чем у него осталось
        showWarningModal('Вы превысили допустимое количество очков', 3000);
        player.history[player.history.length - 1].push('0 (' + score + ')'); // Записываем 0 как основное значение и превышение в скобках
        player.throws += 3; // Увеличиваем количество бросков
        player.totalPoints += 0; // Обновляем общие очки
        player.throwTimes.push(currentTime);

        // Обновляем лучший превышенный бросок
        if (score > player.bestExceededScore) {
            player.bestExceededScore = score;
        }

        lastScores.push({
            playerIndex: currentPlayer,
            score: 0,
            legIndex: player.history.length - 1
        });

        // Переход к следующему игроку
        currentPlayer = (currentPlayer + 1) % playerCount;
        scoreInput.value = '';
        updateScoreBoard();
        updateStatsBoard();
        scoreInput.focus();
        return;
    }
    if (remainingScore === 1) {
        showErrorModal('Нельзя оставить 1 очко. Введите меньшее значение.');
        return;
    }

    // Если введенное значение корректное и не превышает оставшиеся очки
    player.score = remainingScore; // Обновляем счет
    player.throws += 3; // Увеличиваем количество бросков
    player.totalPoints += score; // Обновляем общие очки
    player.history[player.history.length - 1].push(score); // Записываем результат в историю
    player.throwTimes.push(currentTime);
    lastScores.push({
        playerIndex: currentPlayer,
        score,
        legIndex: player.history.length - 1
    });

    // Обновляем лучший бросок без превышения
    if (score > player.bestNormalScore) {
        player.bestNormalScore = score;
    }

    currentPlayer = (currentPlayer + 1) % playerCount; // Переход к следующему игроку
    scoreInput.value = ''; // Очищаем поле ввода
    updateScoreBoard(); // Обновляем таблицу счета
    updateStatsBoard(); // Обновляем статистику
    scoreInput.focus(); // Фокусируем поле ввода
}

function showWarningModal(message, duration) {
    const modal = document.getElementById('throwsModal');
    const content = modal.querySelector('.modal-content');

    modal.classList.add('active');

    content.innerHTML = `
        <h2 style="font-size: 4em; margin-bottom: 20px; text-align: center; color: red;">0 очков</h2>
        <p style="font-size: 2em; margin-bottom: 30px; text-align: center; color: red;">${message}</p>
    `;

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            modal.classList.remove('active');
        }
    };

    content.addEventListener('keydown', handleKeyPress);

    setTimeout(() => {
        modal.classList.remove('active');
        content.removeEventListener('keydown', handleKeyPress);
    }, duration);
}

function checkGameWin(player) {
    if (legMode === 'bestOf') {
        
        return player.legWins >= legsToWin;
    } else {
        
        return player.legWins >= legsToWin;
    }
}       

function updateLegsCountOptions() {
    const legMode = document.getElementById('legMode').value;
    const legsCountSelect = document.getElementById('legsCount');
    legsCountSelect.innerHTML = ''; 

    if (legMode === 'bestOf') {
        
        [3, 5, 7, 9, 11].forEach(num => {
            const option = document.createElement('option');
            option.value = num;
            option.textContent = num;
            legsCountSelect.appendChild(option);
        });
    } else {
        
        for (let i = 1; i <= 10; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            legsCountSelect.appendChild(option);
        }
    }
}

function undoScore() {
    if (lastScores.length === 0) return;

    const { playerIndex, score, legIndex } = lastScores[lastScores.length - 1];
    const player = players[playerIndex];

    
    if (player.score + score > gameScore) {
        alert('Невозможно отменить этот ход, так как будет превышен максимальный счет.');
        return;
    }

    lastScores.pop();
    player.score += score;
    player.throws--;
    player.totalPoints -= score;
    player.history[legIndex].pop();

    
    if (player.history[legIndex].length === 0 && legIndex > 0) {
        player.history.pop();
    }

    currentPlayer = playerIndex;
    updateScoreBoard();
    updateStatsBoard();
}

function updateStatsBoard() {
    const statsBoard = document.getElementById('statsBoard');
    statsBoard.innerHTML = '';
    players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('stats-column');
        
        let historyHTML = player.history.map((leg, legIndex) => 
            `Лег ${legIndex + 1}: ${leg.join(', ') || 'Нет бросков'}`
        ).join('<br>');

        playerDiv.innerHTML = `
            <h3>Игрок #${index + 1}</h3>
            <p>Бросков: ${player.throws}</p>
            <p>Набрано очков: ${player.totalPoints}</p>
            <p>История бросков:<br>${historyHTML}</p>
            <p>Средний набор (1 бросок): ${(player.throws > 0 ? (player.totalPoints / player.throws).toFixed(2) : 0)}</p>
            <p>Средний набор (3 броска): ${(player.throws >= 3 
                ? (player.history.flat().filter(score => score > 0).slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, player.history.flat().filter(score => score > 0).length)).toFixed(2) 
                : 0)}
            </p>
        `;
        statsBoard.appendChild(playerDiv);
    });
}

function restartGame() {
    
    if (players.length === 0) {
        performRestart();
        return;
    }

    
    const modal = document.getElementById('throwsModal');
    const content = modal.querySelector('.modal-content');
    modal.classList.add('active');

    content.innerHTML = `
        <h2 style="font-size: 2em; margin-bottom: 20px;">Начать игру заново?</h2>
        <p style="font-size: 1.2em; margin-bottom: 30px;">Текущий прогресс будет потерян</p>
        <div style="display: flex; gap: 20px; justify-content: center;">
            <button onclick="confirmRestart(true)" 
                    style="padding: 10px 20px; font-size: 1.2em; background-color: var(--accent-color);">
                Да
            </button>
            <button onclick="confirmRestart(false)" 
                    style="padding: 10px 20px; font-size: 1.2em; background-color: #ff4444;">
                Нет
            </button>
        </div>
    `;
}

function confirmRestart(confirmed) {
    const modal = document.getElementById('throwsModal');
    modal.classList.remove('active');

    if (confirmed) {
        performRestart();
    }
}

function performRestart() {
    gameStartTime = null;
    gameEndTime = null;
    document.querySelector('.settings').style.display = 'flex';
    document.getElementById('scoreInput').style.display = 'none';
    document.getElementById('restartBtn').style.display = 'none';
    players = [];
    currentPlayer = 0;
    updateScoreBoard();
    updateStatsBoard();
}

function createConfetti() {
    if (!isConfettiActive) return;

    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const confettiCount = 50;
    
    function createSingleConfetti() {
        if (!isConfettiActive) {
            clearInterval(confettiInterval);
            return;
        }

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            const color = colors[Math.floor(Math.random() * colors.length)];
            const left = Math.random() * 100;
            const size = Math.random() * 10 + 5;
            const duration = Math.random() * 8 + 5;
            
            confetti.style.backgroundColor = color;
            confetti.style.left = left + 'vw';
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';
            confetti.style.animationDuration = duration + 's';
            
            document.body.appendChild(confetti);
            
            
            setTimeout(() => {
                confetti.remove();
            }, duration * 1000);
        }
    }

    
    createSingleConfetti();
    confettiInterval = setInterval(createSingleConfetti, 1000);
}

function showGameStats() {
    const modal = document.getElementById('gameStatsModal');
    const content = document.getElementById('gameStatsContent');
    content.innerHTML = '';

    const winner = players.reduce((prev, current, index) => {
        return (prev.legWins > current.legWins) ? prev : { ...current, index: index };
    }, { ...players[0], index: 0 });

    const winnerDiv = document.createElement('div');
    winnerDiv.className = 'player-stats winner-announcement';
    winnerDiv.style.cssText = `
        text-align: center;
        font-size: 1.5em;
        font-weight: bold;
        color: gold;
        text-transform: uppercase;
        padding: 20px;
        margin-bottom: 20px;
        background: var(--accent-color);
        grid-column: 1 / -1;
    `;
    winnerDiv.innerHTML = `
        🏆 ПОБЕДИТЕЛЬ - ИГРОК #${winner.index + 1} 🏆
        <div style="font-size: 0.8em; margin-top: 10px;">
            Выиграно легов: ${winner.legWins}
        </div>
    `;
    content.appendChild(winnerDiv);

    const gameInfo = document.createElement('div');
    gameInfo.className = 'player-stats';
 
    const formatDateTime = (date) => {
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };
    
    const calculateDuration = (start, end) => {
        const diff = Math.floor((end - start) / 1000); 
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        
        const parts = [];
        if (hours > 0) parts.push(`${hours} ч`);
        if (minutes > 0) parts.push(`${minutes} мин`);
        if (seconds > 0) parts.push(`${seconds} сек`);
        
        return parts.join(' ');
    };

    gameInfo.innerHTML = `
        <h3>Общая информация</h3>
        <div class="stat-item">Тип игры: ${gameScore}</div>
        <div class="stat-item">Режим легов: ${legMode === 'bestOf' ? 'Best of' : 'First to'} ${legsCount}</div>
        <div class="stat-item">Количество игроков: ${playerCount}</div>
        <div class="stat-item">Начало игры: ${formatDateTime(gameStartTime)}</div>
        <div class="stat-item">Окончание игры: ${formatDateTime(gameEndTime)}</div>
        <div class="stat-item">Длительность: ${calculateDuration(gameStartTime, gameEndTime)}</div>
    `;
    content.appendChild(gameInfo);
    
    players.forEach((player, index) => {
        const playerStats = document.createElement('div');
        playerStats.className = 'player-stats';
        
        if (index === winner.index) {
            playerStats.style.border = '2px solid gold';
            playerStats.style.boxShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
        }

        // Набрано очков
        const totalPoints = player.totalPoints;
        const pointsDetails = player.history.flat().join(' + ');

        // Средний набор
        const averageScore = player.throws > 0 ? (player.totalPoints / player.throws).toFixed(2) : 0;
        const averageScoreDetails = `${player.totalPoints} / ${player.throws} = ${averageScore}`;

        // Средний набор за подход
        const approaches = Math.ceil(player.throws / 3);
        const averagePerApproach = approaches > 0 ? (player.totalPoints / approaches).toFixed(2) : 0;
        const averagePerApproachDetails = `${player.totalPoints} / ${approaches} = ${averagePerApproach}`;
        
        // Среднее за последние 9 бросков
        const allThrows = player.history.flat();
        const last9Throws = allThrows.filter(score => score > 0).slice(-9); // Фильтруем нулевые значения
        const average9 = last9Throws.length > 0 
            ? (last9Throws.reduce((a, b) => a + b, 0) / last9Throws.length).toFixed(2)
            : 0;
        const average9Details = last9Throws.length > 0
            ? `(${last9Throws.join(' + ')}) / ${last9Throws.length} = ${average9}`
            : 'Недостаточно данных';

        // Среднее время на подход
        let averageThrowTime = 'N/A';
        let averageThrowTimeDetails = 'Недостаточно данных';
        if (player.throwTimes.length > 1) {
            const totalTime = (player.throwTimes[player.throwTimes.length - 1] - player.throwTimes[0]) / 1000; // в секундах
            const numberOfApproaches = Math.ceil(player.throwTimes.length / 3); // количество подходов
            averageThrowTime = (totalTime / numberOfApproaches).toFixed(2);
            averageThrowTimeDetails = `${totalTime.toFixed(2)} сек / ${numberOfApproaches} подходов = ${averageThrowTime} сек`;
        }

        // Лучший бросок
        const highestScore = allThrows.length > 0 ? Math.max(...allThrows) : 0;

        // Определяем, какой бросок отображать
        let bestThrowDisplay = '';
        let bestExceededScoreDisplay = '';

        if (player.bestExceededScore > player.bestNormalScore) {
            bestThrowDisplay = player.bestNormalScore;
            bestExceededScoreDisplay = `(${player.bestExceededScore})`;
        } else if (player.bestExceededScore === 0) {
            bestThrowDisplay = player.bestNormalScore;
            bestExceededScoreDisplay = ''; // Не отображаем (0) если нет превышающего броска
        } else {
            bestThrowDisplay = player.bestNormalScore;
            bestExceededScoreDisplay = ''; // Не отображаем превышающий бросок, если он меньше
        }

        playerStats.innerHTML = `
            <h3>Игрок #${index + 1} ${index === winner.index ? '👑' : ''}</h3>
            <div class="stat-item">Выиграно легов: ${player.legWins}</div>
            <div class="stat-item">Всего бросков: ${player.throws}</div>
            <div class="stat-item">Всего подходов: ${Math.ceil(player.throws / 3)}</div>
            <div class="stat-item">
                Набрано очков: <span class="calculation" title="${pointsDetails}">${totalPoints}</span>
            </div>
            <div class="stat-item">Лучший бросок за всю игру: 
                <span class="calculation" title="Лучший бросок, который игрок сделал в игре">${player.bestNormalScore}</span>
                <span class="calculation" title="Лучший бросок, с превышением не засчитанный в общем счете"> ${bestExceededScoreDisplay}</span>
            </div>
            <div class="stat-item">
                Средний набор: <span class="calculation" title="${averageScoreDetails}">${averageScore}</span>
            </div>
            <div class="stat-item">
                Средний набор за подход: <span class="calculation" title="${averagePerApproachDetails}">${averagePerApproach}</span>
            </div>
            <div class="stat-item">
                Среднее за последние 9 бросков: <span class="calculation" title="${average9Details}">${average9}</span>
            </div>
            <div class="stat-item">
                Среднее время на подход: <span class="calculation" title="${averageThrowTimeDetails}">${averageThrowTime} сек</span>
            </div>
            <div class="stat-item">История бросков:<br>${player.history.map((leg, legIndex) => 
                `Лег ${legIndex + 1}: ${leg.join(', ') || 'Нет бросков'}`
            ).join('<br>')}</div>
        `;
        content.appendChild(playerStats);
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.style.cssText = `
        text-align: center;
        margin-top: 20px;
        grid-column: 1 / -1;
        display: flex;
        justify-content: center;
        gap: 20px;
    `;

    const savePdfButton = document.createElement('button');
    savePdfButton.textContent = 'Сохранить PDF';
    savePdfButton.style.cssText = `
        padding: 8px 15px;
        font-size: 1em;
        background-color: var(--accent-color);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    `;
    savePdfButton.onclick = generatePDF;

    const confettiButton = document.createElement('button');
    confettiButton.textContent = 'Выключить конфетти';
    confettiButton.style.cssText = `
        padding: 8px 15px;
        font-size: 1em;
        background-color: var(--accent-color);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    `;
    confettiButton.onclick = toggleConfetti;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Закрыть';
    closeButton.style.cssText = `
        padding: 8px 15px;
        font-size: 1em;
        background-color: var(--accent-color);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    `;
    closeButton.onclick = closeGameStats;

    buttonContainer.appendChild(savePdfButton);
    buttonContainer.appendChild(confettiButton);
    buttonContainer.appendChild(closeButton);
    content.appendChild(buttonContainer);

    modal.style.display = 'block';
    document.addEventListener('keydown', handleGameStatsKeyPress);
}

function toggleConfetti() {
    isConfettiActive = !isConfettiActive;
    const confettiButton = document.querySelector('.button-container button:nth-child(2)');
    
    if (isConfettiActive) {
        confettiButton.textContent = 'Выключить конфетти';
        createConfetti();
    } else {
        confettiButton.textContent = 'Включить конфетти';
        clearInterval(confettiInterval);
        const existingConfetti = document.querySelectorAll('.confetti');
        existingConfetti.forEach(confetti => confetti.remove());
    }
}

function closeGameStats() {
    const modal = document.getElementById('gameStatsModal');
    modal.style.display = 'none';
    
    clearInterval(confettiInterval);
    isConfettiActive = true; 
    
    const existingConfetti = document.querySelectorAll('.confetti');
    existingConfetti.forEach(confetti => confetti.remove());
    
    document.removeEventListener('keydown', handleGameStatsKeyPress);
    restartGame();
}


function handleGameStatsKeyPress(event) {
    
    if (event.key === 'Enter') {
        event.preventDefault(); 
    }
}


function handleOtherModalKeyPress(event) {
    if (event.key === 'Enter') {
        closeSomeOtherModal(); 
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        closeGameStats();
    }
}

function generatePDF() {
    
    const content = document.getElementById('gameStatsContent');
    const pdfContent = content.cloneNode(true);
    
    
    const tempContainer = document.createElement('div');
    tempContainer.style.padding = '20px';
    tempContainer.style.background = 'white';
    tempContainer.style.color = 'black';
    
    
    const header = document.createElement('h1');
    header.textContent = 'Статистика игры в дартс';
    header.style.textAlign = 'center';
    header.style.color = '#000';
    header.style.marginBottom = '20px';
    
    tempContainer.appendChild(header);
    tempContainer.appendChild(pdfContent);

    
    const startTimeFormatted = gameStartTime.toLocaleString('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(/[/:]/g, '-').replace(', ', '_');

    
    const opt = {
        margin: 10,
        filename: `darts_game_stats_${startTimeFormatted}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            logging: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'landscape'
        }
    };

    
    html2pdf().set(opt).from(tempContainer).save().then(() => {
        console.log('PDF успешно создан');
    }).catch(error => {
        console.error('Ошибка при создании PDF:', error);
        alert('Произошла ошибка при создании PDF');
    });
}

function getCheckoutSuggestions(score) {
    if (score > 180 || score <= 1) return [];
    
    
    const specialCases = {
        170: ['T20 - T20 - Bull'],    
        167: ['T20 - T19 - Bull'],
        164: ['T20 - T18 - Bull'],
        161: ['T20 - T17 - Bull'],
        160: ['T20 - T20 - D20'],
        158: ['T20 - T20 - D19'],
        157: ['T20 - T19 - D20'],
        156: ['T20 - T20 - D18'],
        155: ['T20 - T19 - D19'],
        154: ['T20 - T18 - D20'],
        153: ['T20 - T19 - D18'],
        152: ['T20 - T20 - D16'],
        151: ['T20 - T17 - D20'],
        150: ['T20 - T18 - D18'],
        149: ['T20 - T19 - D16'],
        148: ['T20 - T16 - D20'],
        147: ['T20 - T17 - D18'],
        146: ['T20 - T18 - D16'],
        145: ['T20 - T15 - D20'],
        144: ['T20 - T20 - D12'],
        143: ['T20 - T17 - D16'],
        142: ['T20 - T14 - D20'],
        141: ['T20 - T19 - D12'],
        140: ['T20 - T20 - D10'],
        139: ['T20 - T13 - D20'],
        138: ['T20 - T18 - D12'],
        137: ['T20 - T19 - D10'],
        136: ['T20 - T20 - D8'],
        135: ['T20 - T17 - D12'],
        134: ['T20 - T14 - D16'],
        133: ['T20 - T19 - D8'],
        132: ['T20 - T16 - D12'],
        131: ['T20 - T13 - D16'],
        130: ['T20 - T18 - D8'],
        129: ['T19 - T16 - D12'],
        128: ['T18 - T14 - D16'],
        127: ['T20 - T17 - D8'],
        126: ['T19 - T19 - D6'],
        125: ['T20 - T19 - D4'],
        124: ['T20 - T16 - D8'],
        123: ['T19 - T16 - D9'],
        122: ['T18 - T20 - D4'],
        121: ['T20 - T11 - D14'],
        120: ['T20 - 20 - D20']
    };

    
    if (specialCases[score]) {
        return specialCases[score];
    }

    const doubles = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40];
    const singles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];
    const triples = singles.map(s => s * 3).filter(t => t <= 60);
    
    let suggestions = [];
    
    
    if (doubles.includes(score)) {
        suggestions.push(`D${score/2}`);
    }
    
    
    for (let i of [...singles, ...triples]) {
        if (i < score) {
            let remaining = score - i;
            if (doubles.includes(remaining)) {
                suggestions.push(`${formatThrow(i)} - D${remaining/2}`);
            }
        }
    }
    
    
    if (suggestions.length === 0) {
        for (let i of [...singles, ...triples]) {
            if (i < score) {
                for (let j of [...singles, ...triples]) {
                    if (i + j < score) {
                        let remaining = score - i - j;
                        if (doubles.includes(remaining)) {
                            suggestions.push(`${formatThrow(i)} - ${formatThrow(j)} - D${remaining/2}`);
                        }
                    }
                }
            }
        }
    }
    
    return suggestions.slice(0, 3);
}

function formatThrow(value) {
    if (value === 25) return 'Bull';
    if (value > 20) return 'T' + (value / 3);
    return value.toString();
}

document.getElementById('legMode').addEventListener('change', updateLegsCountOptions);


document.addEventListener('DOMContentLoaded', function() {
    updateLegsCountOptions();
});