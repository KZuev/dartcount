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
let players = Array.from(new Set(JSON.parse(localStorage.getItem('players')) || []));
let playerToRemoveIndex = null;
let isInterfaceVisible = true;
let html5QrCode;
let stream;

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация обработчика удаления игрока
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', confirmDeletePlayer);
    }

    // Проверяем и загружаем состояние из локального хранилища
    const isReportIssueVisible = localStorage.getItem('toggleReportIssue');
    const isToggleInterfaceVisible = localStorage.getItem('toggleToggleInterface');
    const isLanguageVisible = localStorage.getItem('toggleLanguage');
    const isThemeToggleVisible = localStorage.getItem('toggleTheme');

    // Устанавливаем состояние переключателей
    const toggleReportIssue = document.getElementById('toggleReportIssue');
    const toggleToggleInterface = document.getElementById('toggleToggleInterface');
    const toggleLanguage = document.getElementById('toggleLanguage');
    const toggleTheme = document.getElementById('toggleTheme');

    if (toggleReportIssue) toggleReportIssue.checked = (isReportIssueVisible === 'true') || (isReportIssueVisible === null);
    if (toggleToggleInterface) toggleToggleInterface.checked = (isToggleInterfaceVisible === 'true') || (isToggleInterfaceVisible === null);
    if (toggleLanguage) toggleLanguage.checked = (isLanguageVisible === 'true') || (isLanguageVisible === null);
    if (toggleTheme) toggleTheme.checked = (isThemeToggleVisible === 'true') || (isThemeToggleVisible === null);

    // Сохраняем состояние в локальное хранилище, если оно не было установлено
    if (isReportIssueVisible === null) localStorage.setItem('toggleReportIssue', 'true');
    if (isToggleInterfaceVisible === null) localStorage.setItem('toggleToggleInterface', 'true');
    if (isLanguageVisible === null) localStorage.setItem('toggleLanguage', 'true');
    if (isThemeToggleVisible === null) localStorage.setItem('toggleTheme', 'true');

    // Обновляем видимость кнопок
    updateButtonVisibility();

    // Обработчики событий для переключателей
    if (toggleReportIssue) toggleReportIssue.addEventListener('change', updateButtonVisibility);
    if (toggleToggleInterface) toggleToggleInterface.addEventListener('change', updateButtonVisibility);
    if (toggleLanguage) toggleLanguage.addEventListener('change', updateButtonVisibility);
    if (toggleTheme) toggleTheme.addEventListener('change', updateButtonVisibility);

    // Инициализация других элементов
    const toggleCurrentPlayerName = document.getElementById('toggleCurrentPlayerName');
    if (toggleCurrentPlayerName) {
        toggleCurrentPlayerName.addEventListener('change', function() {
            localStorage.setItem('toggleCurrentPlayerName', toggleCurrentPlayerName.checked);
        });
    }

    // Обновляем видимость текущего игрока
    updateCurrentPlayerNameVisibility();
});

function toggleQRCode() {
    const qrCodeContainer = document.getElementById('storageQRCodeContainer');
    if (qrCodeContainer.classList.contains('hidden')) {
        qrCodeContainer.classList.remove('hidden');
        generateQRCode();
    } else {
        qrCodeContainer.classList.add('hidden');
    }
}

function generateQRCode() {
    const qrCodeContainer = document.getElementById('storageQRCodeContainer');
    qrCodeContainer.innerHTML = '';

    const data = JSON.stringify(localStorage);
    console.log('Data for QR Code:', data);

    try {
        const compressedData = pako.deflate(data, { to: 'string' });
        const base64Data = btoa(String.fromCharCode.apply(null, compressedData));

        const qrCode = new QRCode(qrCodeContainer, {
            text: base64Data,
            width: 256,
            height: 256
        });
    } catch (error) {
        console.error('Failed to generate QR Code:', error);
    }
}

function restoreLocalStorageFromQRCode(base64Data) {
    try {
        const compressedData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const data = pako.inflate(compressedData, { to: 'string' });
        const parsedData = JSON.parse(data);

        for (const key in parsedData) {
            localStorage.setItem(key, parsedData[key]);
        }
        alert('Данные успешно восстановлены из QR-кода!');
        location.reload();
    } catch (error) {
        console.error('Failed to restore data from QR Code:', error);
    }
}

function scanQRCode() {
    const readerElement = document.getElementById('storageReader');

    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("storageReader");
    }

    if (readerElement.style.display === 'none' || readerElement.style.display === '') {
        readerElement.style.display = 'block';

        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            console.log('QR Code detected successfully:', decodedText);
            try {
                restoreLocalStorageFromQRCode(decodedText);
                html5QrCode.stop().then(() => {
                    console.log('Scanner stopped successfully');
                    readerElement.style.display = 'none';
                    stopCameraStream();
                }).catch(err => {
                    console.error('Failed to stop scanning:', err);
                });
            } catch (error) {
                console.error('Error processing QR code:', error);
                showErrorModal('Ошибка при обработке QR-кода. Пожалуйста, попробуйте еще раз.');
            }
        };

        const qrCodeErrorCallback = (errorMessage) => {
            console.log('QR Code scanning error:', errorMessage);
        };

        const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
        };

        // Специальная обработка для iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIOS) {
            const constraints = {
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            navigator.mediaDevices.getUserMedia(constraints)
                .then(mediaStream => {
                    stream = mediaStream;
                    console.log('Camera access granted on iOS');
                    html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        qrCodeSuccessCallback,
                        qrCodeErrorCallback
                    ).catch(err => {
                        console.error('Failed to start scanning on iOS:', err);
                        showErrorModal('Не удалось запустить сканирование. Пожалуйста, проверьте разрешения камеры.');
                    });
                })
                .catch(err => {
                    console.error('Failed to access camera on iOS:', err);
                    showErrorModal('Не удалось получить доступ к камере. Пожалуйста, проверьте настройки браузера и разрешите доступ к камере.');
                });
        } else {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                .then(mediaStream => {
                    stream = mediaStream;
                    console.log('Camera access granted');
                    html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        qrCodeSuccessCallback,
                        qrCodeErrorCallback
                    ).catch(err => {
                        console.error('Failed to start scanning:', err);
                        showErrorModal('Не удалось запустить сканирование. Пожалуйста, проверьте разрешения камеры.');
                    });
                })
                .catch(err => {
                    console.error('Failed to access camera:', err);
                    showErrorModal('Не удалось получить доступ к камере. Пожалуйста, проверьте настройки браузера и разрешите доступ к камере.');
                });
        }
    } else {
        readerElement.style.display = 'none';
        if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                console.log('Scanner stopped successfully');
                stopCameraStream();
            }).catch(err => {
                console.error('Failed to stop scanning:', err);
            });
        }
    }
}

function stopCameraStream() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// Функция для обновления состояния кнопок
function updateButtonVisibility() {
    const reportIssueButton = document.getElementById('reportIssueButton');
    const toggleInterfaceButton = document.getElementById('toggleInterfaceButton');
    const languageButton = document.getElementById('languageButton');
    const themeToggleButton = document.getElementById('themeToggle');

    const isReportIssueVisible = document.getElementById('toggleReportIssue').checked;
    const isToggleInterfaceVisible = document.getElementById('toggleToggleInterface').checked;
    const isLanguageVisible = document.getElementById('toggleLanguage').checked;
    const isThemeToggleVisible = document.getElementById('toggleTheme').checked;

    reportIssueButton.style.display = isReportIssueVisible ? 'inline-block' : 'none';
    toggleInterfaceButton.style.display = isToggleInterfaceVisible ? 'inline-block' : 'none';
    languageButton.style.display = isLanguageVisible ? 'inline-block' : 'none';
    themeToggleButton.style.display = isThemeToggleVisible ? 'inline-block' : 'none';

    // Сохраняем состояние в локальное хранилище
    localStorage.setItem('toggleReportIssue', isReportIssueVisible);
    localStorage.setItem('toggleToggleInterface', isToggleInterfaceVisible);
    localStorage.setItem('toggleLanguage', isLanguageVisible);
    localStorage.setItem('toggleTheme', isThemeToggleVisible);
}

document.getElementById('toggleCurrentPlayerName').addEventListener('change', function() {
    localStorage.setItem('toggleCurrentPlayerName', document.getElementById('toggleCurrentPlayerName').checked);
});

// Функция для обновления видимости текущего и следующего игрока в процессе игры
function updateCurrentPlayerNameVisibility() {
    const currentPlayerNameDiv = document.getElementById('currentPlayerName');
    const isCurrentPlayerNameVisible = document.getElementById('toggleCurrentPlayerName').checked;
    currentPlayerNameDiv.style.display = isCurrentPlayerNameVisible ? 'block' : 'none';
}

function openIssuePage() {
    const repoUrl = 'https://github.com/kzuev/dartcount/issues/new'; // Замените USERNAME и REPO на ваши данные
    window.open(repoUrl, '_blank');
}

// Обработчик события для кнопки "Сохранить изменения"
document.getElementById('savePlayersButton').addEventListener('click', function() {
    savePlayers(); // Сохраняем изменения игроков
    closePlayersModal(); // Закрываем модальное окно
});

document.getElementById('newPlayerName').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Предотвращаем действие по умолчанию
        addPlayer(); // Вызов функции добавления игрока
    }
});

function finishLeg() {
    const player = players[currentPlayer];
    const currentTime = new Date();

    // Обновляем данные игрока
    const legScore = player.score;
    player.throws += 1;
    player.totalPoints += legScore;
    player.history[player.history.length - 1].push(legScore);
    player.throwTimes.push(currentTime);
    player.legWins += 1;
  
    // Проверяем лучший бросок
    if (legScore > player.bestNormalScore) {
        player.bestNormalScore = legScore;
    }

    // Показываем модальное окно с количеством бросков
    showThrowsModal(currentPlayer + 1, player.legWins)
        .then(throwsToFinish => {
            // Обновляем статистику игрока на основе данных из модального окна
            player.throws += throwsToFinish - 1; // Учитываем дополнительные броски

            // Проверка на победу в игре
            if (checkGameWin(player)) {
                player.gameWins += 1; // Увеличиваем количество побед в играх
                gameEndTime = new Date();
                createConfetti();
                setTimeout(showGameStats, 1000);
                return;
            }

            // Подготовка к следующему легу
            players.forEach(p => {
                p.score = gameScore; // Сбрасываем счет для всех игроков
                p.history.push([]); // Создаем новую историю бросков
            });

            nextLegStartPlayer = (nextLegStartPlayer + 1) % playerCount; // Переход к следующему игроку
            currentPlayer = nextLegStartPlayer; // Обновляем текущего игрока
            scoreInput.value = ''; // Очищаем поле ввода
            scoreInput.focus(); // Устанавливаем фокус на поле ввода

            updateScoreBoard();
            updateStatsBoard();
        });
}

function closeAverageTrendModal() {
    document.getElementById('averageTrendModal').style.display = 'none'; // Скрываем модальное окно
}

function showAverageTrend(playerName) {
    // Находим игрока в массиве players
    const results = JSON.parse(localStorage.getItem('players')) || [];
    const player = results.find(p => p.name === playerName);

    // Проверяем, существует ли игрок и есть ли у него данные о среднем наборе
    if (!player) {
        alert(`Нет данных по игроку.`);
        return;
    }

    if (!player.averageScores || player.averageScores.length === 0) {
        alert(`У игрока ${playerName} нет данных о среднем наборе.`);
        return;
    }

    const ctx = document.getElementById('averageTrendChart').getContext('2d');
    const chartData = {
        labels: player.averageScores.map((_, index) => `Игра ${index + 1}`),
        datasets: [{
            label: 'Средний набор',
            data: player.averageScores,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: false
        }]
    };

    const chartOptions = {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: chartOptions
    });

    document.getElementById('averageTrendModal').style.display = 'block'; // Показываем модальное окно с графиком
}

function showAverageApproachTrend(playerName) {
    const results = JSON.parse(localStorage.getItem('players')) || [];
    const player = results.find(p => p.name === playerName);

    if (!player) {
        alert(`Нет данных по игроку.`);
        return;
    }

    if (!player.averageApproachScores || player.averageApproachScores.length === 0) {
        alert(`У игрока ${playerName} нет данных о среднем наборе за подход.`);
        return;
    }

    const ctx = document.getElementById('averageApproachTrendChart').getContext('2d');
    const chartData = {
        labels: player.averageApproachScores.map((_, index) => `Игра ${index + 1}`),
        datasets: [{
            label: 'Средний набор за подход',
            data: player.averageApproachScores,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: false
        }]
    };

    const chartOptions = {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: chartOptions
    });

    document.getElementById('averageApproachTrendModal').style.display = 'block';
}

function closeAverageApproachTrendModal() {
    document.getElementById('averageApproachTrendModal').style.display = 'none';
}

function showStatsModal() { 
    const playersStatsContent = document.getElementById('playersStatsContent'); 
    playersStatsContent.innerHTML = ''; // Очищаем предыдущее содержимое 

    // Проверяем наличие игроков
    if (players.length === 0) {
        const noPlayersMessage = document.createElement('div');
        noPlayersMessage.className = 'no-players-message';
        noPlayersMessage.textContent = 'Нет игроков'; // Сообщение о отсутствии игроков
        playersStatsContent.appendChild(noPlayersMessage);
        document.getElementById('statsModal').style.display = 'flex'; // Показываем модальное окно 
        return; // Завершаем выполнение функции
    }

    // Загружаем всех игроков из localStorage 
    checkPlayers = localStorage.getItem('players'); 

    // Загружаем всех игроков из localStorage 
    players = Array.from(new Set(JSON.parse(localStorage.getItem('players')) || [])); 

    // Загружаем результаты из localStorage 
    const savedResults = localStorage.getItem('players'); 
    const results = savedResults ? JSON.parse(savedResults) : []; 

    // Определяем лучшего игрока внутри цикла
    let bestPlayer = null;
    let maxLegWins = 0;
    let maxGameWins = 0;
    let isTie = false;

    results.forEach(player => {
        if (player.gameWins > maxGameWins) {
            maxGameWins = player.gameWins;
            bestPlayer = player; // Назначаем нового лучшего игрока
            isTie = false;
        } else if (player.gameWins === maxGameWins && player.gameWins > 0) {
            isTie = true; // Обнаружена ничья
            bestPlayer = null;
        }
    });

    // Рассчитываем процент побед для каждого игрока
    results.forEach(player => {
        const gamesPlayed = Array.isArray(player.averageScores) ? player.averageScores.length : 0;
        player.winPercentage = gamesPlayed > 0 ? ((player.gameWins / gamesPlayed) * 100).toFixed(2) : 0;
    });

    // Сортируем игроков по проценту побед в порядке убывания
    results.sort((a, b) => b.winPercentage - a.winPercentage);

    // Назначаем рейтинг каждому игроку на основе его позиции в отсортированном списке
    results.forEach((player, index) => {
        player.rating = index + 1;
    });

    results.forEach(player => {
        const playerStatDiv = document.createElement('div');
        playerStatDiv.classList.add('player-stat');

        // Выделяем только лучшего игрока
        if (player.name === bestPlayer?.name) {
            playerStatDiv.classList.add('best-player');
        }

        // Проверка наличия averageScores и корректного значения
        const averageScore = Array.isArray(player.averageScores) && player.averageScores.length > 0
            ? parseFloat(player.averageScores[player.averageScores.length - 1]).toFixed(1)
            : 0;
        
        // Проверка наличия averageApproachScores и корректного значения
        const averageApproachScore = Array.isArray(player.averageApproachScores) && player.averageApproachScores.length > 0
            ? parseFloat(player.averageApproachScores[player.averageApproachScores.length - 1]).toFixed(1)
            : 0;
        
        // Подсчет количества сыгранных игр на основе данных в среднем наборе
        const gamesPlayed = Array.isArray(player.averageScores) ? player.averageScores.length : 0;

         // Расчет процента побед
         const winPercentage = gamesPlayed > 0 ? ((player.gameWins / gamesPlayed) * 100).toFixed(2) : 0;

        playerStatDiv.innerHTML = `
            <h4><span class="player-name" onclick="editPlayerName('${player.name}', this)">${player.name}</span> ${player.name === bestPlayer?.name ? '👑' : ''}</h4>
            <p>Рейтинг: ${player.rating}</p>
            <p>Всего бросков: ${player.throws}</p>
            <p>Набрано очков: ${player.totalPoints}</p>
            <p>Всего игр: ${gamesPlayed}</p>
            <p>Выигранные леги: ${player.legWins}</p>
            <p>Победы в играх: ${player.gameWins}</p>
            <p>Процент побед: ${winPercentage}%</p>
            <p>Средний набор: <span class="average-score" onclick="showAverageTrend('${player.name}')">${averageScore} 📊</span></p>
            <p>Средний набор подхода: <span class="average-score" onclick="showAverageApproachTrend('${player.name}')">${averageApproachScore} 📊</span></p>
            <p>Лучший набор подхода: ${player.bestNormalScore > 0 ? player.bestNormalScore : 'Нет данных'}</p>
        `;
        playersStatsContent.appendChild(playerStatDiv); 
    }); 

    document.getElementById('statsModal').style.display = 'flex'; // Показываем модальное окно 
}

// ... existing code ...

// Изменяем обработчик кнопки "Добавить игрока" в модальном окне статистики
document.getElementById('statsAddPlayerButton').addEventListener('click', function() {
    closeStatsModal(); // Закрываем модальное окно статистики
    showPlayersModal(); // Открываем модальное окно управления игроками
});

function deletePlayer(index) {
    if (index !== -1) {
        players.splice(index, 1);
        savePlayers();
        loadPlayers();
    }
}

function confirmDeletePlayer() {
    if (playerToRemoveIndex !== null) {
        deletePlayer(playerToRemoveIndex); // Удаляем игрока из массива
        closeConfirmDeleteModal(); // Закрываем модальное окно
    }
}

function closeConfirmDeleteModal() {
    document.getElementById('confirmDeleteModal').style.display = 'none'; // Закрываем модальное окно
}

function editPlayerName(currentName, element) {
    const container = document.createElement('div');
    container.className = 'edit-container';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'edit-player-name';
    input.onblur = function() {
        savePlayerName(currentName, input.value, container);
    };
    input.onkeydown = function(event) {
        if (event.key === 'Enter') {
            savePlayerName(currentName, input.value, container);
        }
    };

    const deleteIcon = document.createElement('span');
    deleteIcon.className = 'delete-icon';
    deleteIcon.textContent = '🗑️';
    deleteIcon.addEventListener('click', function() {
        playerToRemoveIndex = players.findIndex(p => p.name === currentName);
        const confirmDeleteModal = document.getElementById('confirmDeleteModal');
        if (confirmDeleteModal) {
            confirmDeleteModal.style.display = 'block';
        } else {
        }
    });

    container.appendChild(input);
    container.appendChild(deleteIcon);
    element.replaceWith(container);
    input.focus();
}

function savePlayerName(oldName, newName, inputElement) {
    if (newName.trim() === '') {
        alert('Имя не может быть пустым.');
        inputElement.replaceWith(createPlayerNameSpan(oldName)); // Возвращаем старое имя
        return;
    }

    const player = players.find(p => p.name === oldName);
    if (player) {
        player.name = newName;
        savePlayers();
    }

    const span = createPlayerNameSpan(newName);
    inputElement.replaceWith(span);
}

function createPlayerNameSpan(name) {
    const span = document.createElement('span');
    span.className = 'player-name';
    span.textContent = name;
    span.title = 'Нажмите, чтобы изменить имя'; // Добавляем подсказку
    span.onclick = function() {
        editPlayerName(name, span);
    };
    return span;
}

// Функция для закрытия модального окна со статистикой
function closeStatsModal() {
    document.getElementById('statsModal').style.display = 'none'; // Скрываем модальное окно
}

// Функция для обновления временной метки
async function updateLastModified() {
    const currentTime = Date.now().toString();
    localStorage.setItem('lastModified', currentTime);
    
    // Обновляем метку на сервере
    const { sessionId } = sessions.getSessionFromLocalStorage();
    if (sessionId) {
        try {
            await database.ref(`sessions/${sessionId}`).update({
                lastModified: currentTime
            });
        } catch (error) {
            console.error('Ошибка при обновлении временной метки на сервере:', error);
        }
    }
}

// Добавляем вызов updateLastModified() после каждого изменения данных
function savePlayers() {
    localStorage.setItem('players', JSON.stringify(players));
    updateLastModified();
}

function saveGameResults() {
    const results = loadGameResults() || [];
    results.push({
        timestamp: Date.now(),
        players: players.slice(0, playerCount),
        scores: lastScores,
        gameType: gameScore,
        legMode: legMode,
        legsCount: legsCount,
        startTime: gameStartTime,
        endTime: gameEndTime
    });
    localStorage.setItem('gameResults', JSON.stringify(results));
    updateLastModified();
}

function loadGameResults() {
    const savedResults = localStorage.getItem('players');
    if (savedResults) {
        const results = JSON.parse(savedResults);
        results.forEach(savedPlayer => {
            const existingPlayer = players.find(p => p.name === savedPlayer.name);
            if (existingPlayer) {
                // Обновляем существующего игрока
                existingPlayer.throws = savedPlayer.throws || 0;
                existingPlayer.totalPoints = savedPlayer.totalPoints || 0;
                existingPlayer.legWins = savedPlayer.legWins || 0;
                existingPlayer.gameWins = savedPlayer.gameWins || 0;

                // Обновляем средний набор
                const averageScore = existingPlayer.throws > 0 ? (existingPlayer.totalPoints / existingPlayer.throws).toFixed(2) : 0;
                if (!existingPlayer.averageScores) {
                    existingPlayer.averageScores = []; // Инициализация, если поле отсутствует
                }
                existingPlayer.averageScores.push(averageScore); // Добавляем новое значение

                // Обновляем средний набор за подход
                const approaches = Math.ceil(existingPlayer.throws / 3);
                const averageApproachScore = approaches > 0 ? (existingPlayer.totalPoints / approaches).toFixed(2) : 0;
                if (!existingPlayer.averageApproachScores) {
                    existingPlayer.averageApproachScores = [];
                }
                existingPlayer.averageApproachScores.push(averageApproachScore);


                if (savedPlayer.bestNormalScore > existingPlayer.bestNormalScore) {
                    existingPlayer.bestNormalScore = savedPlayer.bestNormalScore;
                }
            } else {
                // Если игрока нет, добавляем его
                players.push({ ...savedPlayer });
            }
        });
        updateStatsBoard(); // Обновляем отображение результатов
    }
}

// Загрузка результатов при загрузке страницы
window.onload = loadGameResults; 

// Загрузка результатов при загрузке страницы
window.onload = function() {
    const storedPlayers = JSON.parse(localStorage.getItem('players')) || [];
    players = storedPlayers.map(player => ({
        ...player,
        averageScores: player.averageScores || [] // Обеспечиваем наличие поля averageScores
    }));
    loadPlayers(); // Загружаем игроков
};

// Функция для загрузки списка игроков
function loadPlayers() {
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = ''; // Очищаем список перед обновлением
    players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.innerHTML = `
            <input type="text" value="${player.name}" onchange="editPlayer(${index}, this.value)">
            <button onclick="removePlayer(${index})">Удалить</button>
        `;
        playersList.appendChild(playerDiv);
    });
}

// Функция для добавления игрока
document.getElementById('addPlayerButton').addEventListener('click', addPlayer);

function addPlayer() {
    const playerName = document.getElementById('newPlayerName').value.trim(); // Убираем пробелы

    // Проверка на пустое имя
    if (playerName === '') {
        alert('Имя игрока не может быть пустым.');
        return; // Завершаем выполнение функции
    }

    // Проверка на уникальность имени
    if (players.some(player => player.name.toLowerCase() === playerName.toLowerCase())) {
        alert('Игрок с таким именем уже существует. Пожалуйста, выберите другое имя.');
        return; // Завершаем выполнение функции, если игрок с таким именем уже существует
    }

    // Если имя уникально, добавляем игрока
    players.push({ 
        name: playerName, // Имя игрока
        score: gameScore, // Начальный счет
        throws: 0, // Количество бросков
        totalPoints: 0, // Общие очки
        history: [[]], // История бросков
        legWins: 0, // Выигранные леги
        gameWins: 0, // Инициализация количества побед
        throwTimes: [], // Время бросков
        bestExceededScore: 0, // Лучший бросок при превышении
        bestNormalScore: 0, // Лучший бросок без превышения
        averageScores: [], // Средний набор
        averageApproachScores: [] // Средний набор за подход
    });
    document.getElementById('newPlayerName').value = ''; // Очищаем поле ввода
    savePlayers(); // Сохраняем изменения
    loadPlayers(); // Обновляем список игроков, чтобы отобразить новые данные
}

function editPlayer(index, newName) {
    players[index].name = newName;
    savePlayers();
}

function removePlayer(index) {
    players.splice(index, 1);
    savePlayers();
    loadPlayers();
}

function savePlayers() {
    // Удаляем дубликаты перед сохранением
    const uniquePlayers = Array.from(new Set(players));
    uniquePlayers.forEach(player => {
        if (!player.averageScores) {
            player.averageScores = []; // Инициализация, если поле отсутствует
        }
    });
    localStorage.setItem('players', JSON.stringify(uniquePlayers));
}

document.getElementById('closePlayersModal').addEventListener('click', closePlayersModal);

function showPlayersModal() {
    loadPlayers();
    document.getElementById('playersModal').style.display = 'block';
}

function closePlayersModal() {
    document.getElementById('playersModal').style.display = 'none';
}

document.getElementById('playerCount').textContent = playerCount;

function updatePlayerSelectionFields() {
    const selectPlayersContainer = document.getElementById('selectPlayersContainer');
    selectPlayersContainer.innerHTML = ''; // Очищаем контейнер
    const selectWidth = 100 / playerCount + '%'; // Рассчитываем ширину селекта

    // Создаем массив для отслеживания выбранных игроков
    const selectedPlayers = new Array(playerCount).fill(null);

    for (let i = 0; i < playerCount; i++) {
        const select = document.createElement('select');
        select.className = 'select-player'; // Добавляем CSS-класс
        select.style.width = selectWidth; // Устанавливаем ширину

        // Добавляем пустой вариант по умолчанию
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Выберите игрока';
        select.appendChild(emptyOption);

        // Добавляем всех игроков в селектор
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = player.name;
            select.appendChild(option);
        });

        // Обработчик изменения выбора
        select.addEventListener('change', function() {
            const selectedValue = this.value;

            // Обновляем массив выбранных игроков
            selectedPlayers[i] = selectedValue;

            // Обновляем другие селекторы
            const allSelects = document.querySelectorAll('.select-player');
            allSelects.forEach((otherSelect, index) => {
                if (index !== i) {
                    // Удаляем уже выбранных игроков из других селекторов
                    Array.from(otherSelect.options).forEach(option => {
                        if (selectedPlayers.includes(option.value) && option.value !== '') {
                            option.disabled = true; // Делаем опцию недоступной
                        } else {
                            option.disabled = false; // Включаем опцию обратно
                        }
                    });
                }
            });
        });

        selectPlayersContainer.appendChild(select);
    }
}

document.getElementById('startNewGameButton').addEventListener('click', function() {
    updatePlayerSelectionFields();
});

function editPlayer(index, newName) {
    players[index].name = newName;
    savePlayers();
    updatePlayerSelectionFields(); // Обновляем поля выбора игроков
}

function removePlayer(index) {
    playerToRemoveIndex = index; // Сохраняем индекс игрока
    document.getElementById('confirmDeleteModal').style.display = 'block'; // Показываем модальное окно подтверждения
}

function confirmDeletePlayer() {
    if (playerToRemoveIndex !== null) {
        players.splice(playerToRemoveIndex, 1); // Удаляем игрока из массива
        savePlayers(); // Сохраняем изменения
        loadPlayers(); // Обновляем список игроков
        closeConfirmDeleteModal(); // Закрываем модальное окно
    }
}

function closeConfirmDeleteModal() {
    document.getElementById('confirmDeleteModal').style.display = 'none'; // Закрываем модальное окно
}

// Добавляем обработчик события для кнопки подтверждения удаления
document.getElementById('confirmDeleteButton').addEventListener('click', confirmDeletePlayer);

function updatePlayerSelectionFields() {
    const selectPlayersContainer = document.getElementById('selectPlayersContainer');
    selectPlayersContainer.innerHTML = ''; // Очищаем контейнер

    // Создаем массив для отслеживания выбранных игроков
    const selectedPlayers = new Array(playerCount).fill(null);

    for (let i = 0; i < playerCount; i++) {
        const select = document.createElement('select');
        select.className = 'select-player'; // Добавляем CSS-класс

        // Добавляем пустой вариант по умолчанию
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Выберите игрока';
        select.appendChild(emptyOption);

        // Добавляем всех игроков в селектор, исключая уже выбранных
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = player.name;
            select.appendChild(option);
        });

        // Обработчик изменения выбора
        select.addEventListener('change', function() {
            const selectedValue = this.value;

            // Обновляем массив выбранных игроков
            selectedPlayers[i] = selectedValue;

            // Обновляем другие селекторы
            const allSelects = document.querySelectorAll('.select-player');
            allSelects.forEach((otherSelect, index) => {
                if (index !== i) {
                    // Удаляем уже выбранных игроков из других селекторов
                    Array.from(otherSelect.options).forEach(option => {
                        if (selectedPlayers.includes(option.value) && option.value !== '') {
                            option.disabled = true; // Делаем опцию недоступной
                        } else {
                            option.disabled = false; // Включаем опцию обратно
                        }
                    });
                }
            });
        });

        selectPlayersContainer.appendChild(select);
    }
}

document.getElementById('startNewGameButton').addEventListener('click', function() {
    updatePlayerSelectionFields(); // Обновляем поля выбора игроков при начале новой игры
});

function showStorageModal() {
    document.getElementById('storageModal').style.display = 'block';
    generateQRCode();
}

function closeStorageModal() {
    document.getElementById('storageModal').style.display = 'none';
}

function saveLocalStorageToFile() {
    const data = JSON.stringify(localStorage); // Преобразуем localStorage в строку JSON
    const blob = new Blob([data], { type: 'application/json' }); // Создаем Blob
    const now = new Date(); // Получаем текущую дату и время

    // Форматируем дату и время в нужном формате
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const fileName = `dartcount_${year}${month}${day}-${hours}${minutes}${seconds}.json`; // Формируем имя файла

    const url = URL.createObjectURL(blob); // Создаем URL для Blob

    const a = document.createElement('a'); // Создаем элемент <a>
    a.href = url; // Устанавливаем URL
    a.download = fileName; // Устанавливаем имя файла
    document.body.appendChild(a); // Добавляем элемент в DOM
    a.click(); // Имитируем клик для загрузки файла
    document.body.removeChild(a); // Удаляем элемент из DOM
    URL.revokeObjectURL(url); // Освобождаем URL
}

function restoreLocalStorageFromFile(event) {
    const file = event.target.files[0]; // Получаем файл из события
    const reader = new FileReader(); // Создаем FileReader

    reader.onload = function(e) {
        const data = e.target.result; // Получаем содержимое файла
        const parsedData = JSON.parse(data); // Парсим JSON
        for (const key in parsedData) {
            localStorage.setItem(key, parsedData[key]); // Восстанавливаем данные в localStorage
        }
        alert('Данные успешно восстановлены из файла!'); // Уведомление об успешном восстановлении
        
        // Обновляем страницу для отображения данных
        location.reload();
    };

    reader.readAsText(file); // Читаем файл как текст
}

function clearLocalStorage() {
    if (confirm('Вы уверены, что хотите очистить все данные? Это действие необратимо.')) {
        localStorage.clear(); // Очищаем localStorage
        alert('Хранилище очищено!'); // Уведомление об успешной очистке
        location.reload(); // Обновляем страницу для отражения изменений
    }
}

// Обработчики событий для кнопок
// document.getElementById('playersButton').addEventListener('click', showModal);
// document.getElementById('statsButton').addEventListener('click', showModal);
document.getElementById('tournamentsButton').addEventListener('click', showModal);
// document.getElementById('settingsButton').addEventListener('click', showModal);

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

function toggleInterface() {
    const interfaceElements = document.querySelectorAll('.container, .modal-content, .confetti');
    
    isInterfaceVisible = !isInterfaceVisible;
    interfaceElements.forEach(element => {
        element.classList.toggle('hidden', !isInterfaceVisible);
    });

    const body = document.body; 

    if (isInterfaceVisible) {
        body.classList.remove('hidden-background');
        body.style.backgroundImage = "url('./img/bg.jpeg')";
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundRepeat = 'no-repeat';
    } else {
        body.classList.add('hidden-background');
        body.style.backgroundImage = 'none';
    }
}

document.getElementById('toggleInterfaceButton').addEventListener('click', toggleInterface);

document.addEventListener('keydown', function(event) {
    if (event.key === 'F9') {
        event.preventDefault();
        toggleInterface();
    }
});

document.addEventListener('click', function(event) {
    const interfaceElements = document.querySelectorAll('.container, .modal-content, .confetti');
    const isClickOnInterface = Array.from(interfaceElements).some(element => element.contains(event.target));

    if (!isClickOnInterface && !isInterfaceVisible) {
        isInterfaceVisible = true;
        interfaceElements.forEach(element => {
            element.classList.remove('hidden');
        });
        const body = document.body;
        body.classList.remove('hidden-background');
        body.style.backgroundImage = "url('./img/bg.jpeg')";
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundRepeat = 'no-repeat';
    }
});

document.addEventListener('keydown', function(event) {
    // Проверяем, нажата ли клавиша Ctrl (или Command на Mac)
    const isCtrlPressed = event.ctrlKey || event.metaKey; 

    // Получаем код нажатой клавиши
    const key = event.key.toLowerCase(); // Приводим к нижнему регистру для унификации

    // Проверяем, была ли нажата клавиша "Z"
    if (isCtrlPressed && key === 'z') {
        event.preventDefault(); // Предотвращаем стандартное поведение
        undoScore(); // Вызов функции отмены
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
            document.getElementById('statsButton').textContent = `👥 ${translations.statsButton}`;
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
    playerCount = Math.max(1, Math.min(6, playerCount + value)); // Ограничиваем количество игроков от 1 до 6
    document.getElementById('playerCount').textContent = playerCount; // Обновляем отображаемое количество игроков
    updatePlayerSelectionFields(); // Обновляем поля выбора игроков
}

// function setTheme() {
//     const theme = document.getElementById('themeType').value;
//     document.body.classList.toggle('light-theme', theme === 'light');
// }

function startGame() {
    // Получаем все поля выбора игроков
    const playerSelects = document.querySelectorAll('.select-player');

    // Проверяем, что все поля выбора игроков заполнены
    const allPlayersSelected = Array.from(playerSelects).every(select => select.value !== '');

    // Инициализация состояния видимости текущего и следующего игрока в процессе игры
    const isCurrentPlayerNameVisible = localStorage.getItem('toggleCurrentPlayerName') === 'true';
    document.getElementById('toggleCurrentPlayerName').checked = isCurrentPlayerNameVisible;
    updateCurrentPlayerNameVisibility();

    // Обработчик события для состояния видимости текущего и следующего игрока в процессе игры
    document.getElementById('toggleCurrentPlayerName').addEventListener('change', function() {
        localStorage.setItem('toggleCurrentPlayerName', document.getElementById('toggleCurrentPlayerName').checked);
    });

    // Если не все поля заполнены, выводим предупреждение
    if (!allPlayersSelected) {
        alert('Пожалуйста, выберите игрока для каждого поля перед началом игры.');
        return; // Завершаем выполнение функции
    }

    // Если все поля заполнены, продолжаем с началом игры
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
    
    // Создаем массив игроков с их именами и результатами
    players = Array.from({ length: playerCount }, (_, index) => ({
        name: playerSelects[index].value, // Имя игрока
        score: gameScore, // Начальный счет
        throws: 0, // Количество бросков
        totalPoints: 0, // Общие очки
        history: [[]], // История бросков
        legWins: 0, // Выигранные леги
        gameWins: 0, // Инициализация количества побед
        throwTimes: [], // Время бросков
        bestExceededScore: 0, // Лучший бросок при превышении
        bestNormalScore: 0 // Лучший бросок без превышения
    }));
    
    currentPlayer = 0;
    nextLegStartPlayer = 0;
    lastScores = [];
    currentLeg = 1;
    
    updateScoreBoard();
    updateStatsBoard();

    // Показываем элементы, связанные с игрой 
    // document.getElementById('currentPlayerName').style.display = 'flex';
    document.getElementById('scoreBoard').style.display = 'flex'; // Показы ваем табло счета 
    document.getElementById('scoreInput').style.display = 'flex'; // Показываем ввод очков 
    document.getElementById('restartBtn').style.display = 'inline-block'; // Показываем кнопку перезапуска 
    document.querySelector('.stats-board').style.display = 'flex'; // Показываем статистику 
    document.querySelector('.settings').style.display = 'none'; // Скрываем настройки 
    document.getElementById('score').focus();
    document.getElementById('score').value = '';
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

    const nextPlayerIndex = (currentPlayer + 1) % players.length;
    const currentPlayerName = document.getElementById('currentPlayerName');
    currentPlayerName.innerHTML = `<span style="color: grey;">Игрок: </span><span style="color: white; font-weight: bold;">${players[currentPlayer].name}</span><span style="color: grey;"> ➟ ${players[nextPlayerIndex].name}</span>`;
     
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
        legsElement.textContent = `${player.legWins}${legMode === 'bestOf' ? 
            ` / ${legsToWin}` : 
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
            <h2>За сколько бросков завершена игра?</h2>
            <h5>(Выберите мышью или нажмите 1, 2 или 3 на клавиатуре)</h5>
            <div class="throws-buttons">
                <button class="throw-button" data-throws="1">1</button>
                <button class="throw-button" data-throws="2">2</button>
                <button class="throw-button" data-throws="3">3</button>
            </div>
        `;

        function handleThrow(throws) {
            content.innerHTML = `
                <h2>Игрок #${playerNumber} выиграл лег!</h2>
                <h5>Количество выигранных легов: ${legWins}</h5>
                <div class="button-container">
                    <button id="continueButton">Продолжить</button>
                </div>
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
            <h5>${message}</h5>
            <div class="button-container">
                <button id="continueButton">OK</button>
            </div>
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

    // Проверяем, пустое ли поле ввода
    if (scoreInput.value.trim() === '') {
        scoreInput.value = '';
        scoreInput.focus();
        return;
    }

    // Проверяем, корректное ли значение очков
    if (isNaN(score) || score < 0 || score > 180) {
        showErrorModal('Введите корректное значение очков (0-180).');
        return;
    }

    // Если игрок завершает лег (его счет равен 0)
    if (score === player.score) {
        scoreInput.value = ''; // Очищаем поле ввода
        finishLeg(currentPlayer); // Вызываем finishLeg
        return;
    }

    // Если игрок не завершил лег, проверяем оставшиеся очки
    const remainingScore = player.score - score;

    if (remainingScore < 0) {
        // Если игрок ввел больше очков, чем у него осталось
        showWarningModal('Вы превысили допустимое количество очков', 3000);
        // player.history[player.history.length - 1].push('0 (' + score + ')'); // Записываем 0 как основное значение и превышение в скобках
        // player.throws += 3; // Увеличиваем количество бросков
        // player.throwTimes.push(new Date()); // Записываем время броска

        // // Переход к следующему игроку
        // currentPlayer = (currentPlayer + 1) % playerCount;
        // scoreInput.value = ''; // Очищаем поле ввода
        // updateScoreBoard();
        // updateStatsBoard();
        // scoreInput.focus();
        return;
    }

    if (remainingScore === 1) {
        showErrorModal('Нельзя оставить 1 очко. Введите меньшее значение.');
        return;
    }

    // Сохраняем текущее состояние перед изменением
    lastScores.push({ playerIndex: currentPlayer, score: score, legIndex: player.history.length - 1 }); // Сохраняем фактические очки

    // Если введенное значение корректное и не превышает оставшиеся очки
    player.score = remainingScore;
    player.throws += 3;
    player.totalPoints += score;
    player.history[player.history.length - 1].push(score);
    player.throwTimes.push(new Date());

    // Обновляем лучший бросок без превышения
    if (score > player.bestNormalScore) {
        player.bestNormalScore = score;
    }

    // Переход к следующему игроку
    currentPlayer = (currentPlayer + 1) % playerCount;
    scoreInput.value = '';
    updateScoreBoard();
    updateStatsBoard();
    scoreInput.focus();
}

function showWarningModal(message, duration) {
    const modal = document.getElementById('throwsModal');
    const content = modal.querySelector('.modal-content');

    modal.classList.add('active');

    content.innerHTML = `
        <!-- <h2 style="font-size: 4em; margin-bottom: 20px; text-align: center; color: red;">0 очков</h2> -->
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
    if (lastScores.length === 0) {
        alert('Отмена ввода невозможна');
        return;
    }

    const { playerIndex, score, legIndex } = lastScores.pop(); // Извлекаем последний элемент и удаляем его из массива
    const player = players[playerIndex];

    // Проверяем, не превышает ли восстановленный счет максимальный
    if (player.score + score < 0) { 
        alert('Невозможно отменить этот ход, так как счет не может быть отрицательным.');
        return;
    }

    // Проверяем, не превышает ли восстановленный счет максимальный счет игры
    if (player.score + score > gameScore) {
        alert(`Невозможно отменить этот ход, так как счет не может превышать ${gameScore}.`);
        return;
    }

    // Восстанавливаем счет игрока
    player.score += score; // Уменьшаем счет на введенные очки
    player.throws--; // Уменьшаем количество бросков
    player.totalPoints -= score; // Уменьшаем общие очки
    player.history[legIndex].pop(); // Удаляем последний бросок из истории

    // // Если история лега пуста, удаляем лег
    // if (player.history[legIndex].length === 0 && legIndex > 0) {
    //     player.history.pop();
    // }

    currentPlayer = playerIndex; // Устанавливаем текущего игрока
    updateScoreBoard(); // Обновляем табло счета
    updateStatsBoard(); // Обновляем статистику
}

function updateStatsBoard() {
    const statsBoard = document.getElementById('statsBoard');
    statsBoard.innerHTML = ''; // Очищаем предыдущие данные

    players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('stats-column');
        
        // Добавляем класс active-player для текущего игрока
        if (index === currentPlayer) {
            playerDiv.classList.add('active-player');
        }
        
        // Формируем историю бросков
        let historyHTML = player.history.map((leg, legIndex) => 
            `Лег ${legIndex + 1}: ${leg.join(', ') || 'Нет бросков'}`
        ).join('<br>');

        // Расчет среднего набора за 1 бросок
        const averageScore = player.throws > 0 ? (player.totalPoints / player.throws).toFixed(2) : 0;

        // Расчет среднего набора за последние 3 броска
        const lastScores = player.history.flat().filter(score => score > 0);
        const averageLast3 = lastScores.length >= 3 
            ? (lastScores.slice(-3).reduce((a, b) => a + b, 0) / 3).toFixed(2) 
            : (lastScores.length > 0 ? (lastScores.reduce((a, b) => a + b, 0) / lastScores.length).toFixed(2) : 0);

        playerDiv.innerHTML = `
            <h2>Игрок #${index + 1}: ${player.name}</h2>
            <p>Бросков: ${player.throws}</p>
            <p>Набрано очков: ${player.totalPoints}</p>
            <p>История бросков:<br>${historyHTML}</p>
            <p>Средний набор (1 бросок): ${averageScore}</p>
            <p>Средний набор (последние 3 броска): ${averageLast3}</p>
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
        <h2>Начать игру заново?</h2>
        <h5>Текущий прогресс будет потерян</h5>
        <div class="button-container">
            <button onclick="confirmRestart(true)" 
                    style="font-size: 1.2em; background-color: var(--accent-color);">
                Да
            </button>
            <button onclick="confirmRestart(false)" 
                    style="font-size: 1.2em; background-color: #ff4444;">
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
    } else {
        // Восстанавливаем состояние игры, если игрок выбрал "Нет"
        if (lastScores.length > 0) {
            const lastScore = lastScores[lastScores.length - 1];
            const player = players[lastScore.playerIndex];
            player.score = lastScore.score; // Восстанавливаем счет
            currentPlayer = lastScore.playerIndex; // Возвращаемся к последнему игроку
            updateScoreBoard(); // Обновляем табло счета
            updateStatsBoard(); // Обновляем статистику
        }
    }
}

function performRestart() {
    gameStartTime = null;
    gameEndTime = null;
    currentPlayer = 0; // Сброс текущего игрока
    nextLegStartPlayer = 0; // Сброс следующего игрока для начала лега
    lastScores = []; // Очистка последних результатов
    currentLeg = 1; // Сброс текущего лега

    // Сброс данных игроков, но не удаление их из массива players
    players.forEach(player => {
        player.throws = 0;
        player.totalPoints = 0;
        player.legWins = 0;
        player.history = [[]];
        player.score = gameScore; // Установка начального счета
    });

    updateScoreBoard(); // Обновляем табло счета
    updateStatsBoard(); // Обновляем статистику

    // Скрываем элементы, связанные с игрой

    document.getElementById('currentPlayerName').style.display = 'none'; // Скрывать счет
    document.getElementById('scoreBoard').style.display = 'none'; // Скрывать счет
    document.getElementById('scoreInput').style.display = 'none'; // Скрываем ввод очков 
    document.getElementById('restartBtn').style.display = 'none'; // Скрываем кнопку перезапуска 
    document.querySelector('.stats-board').style.display = 'none'; // Скрываем статистику 
    document.querySelector('.settings').style.display = 'flex'; // Показываем настройки 
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
        🏆 ПОБЕДИТЕЛЬ - ИГРОК #${winner.index + 1} (${winner.name}) 🏆
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
            <h3>${player.name} ${index === winner.index ? '👑' : ''}</h3>
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
    saveGameResults();
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

    }).catch(error => {
        console.error('Ошибка при создании PDF:', error);
        alert('Произошла ошибка при создании PDF');
    });
}

function getCheckoutSuggestions(score) {
    if (score > 180 || score <= 1) return [];
    
    const specialCases = {
        170: ['T20-T20-50'],    
        167: ['T20-T19-50'],
        164: ['T20-T18-50'],
        161: ['T20-T17- 50'],
        157: ['T20-T19-D20'],
        158: ['T20-T20-D19'],
        160: ['T20-T20-D20'],
        156: ['T20-T20-D18'],
        155: ['T20-T19-D19'],
        154: ['T20-T18-D20'],
        153: ['T20-T19-D18'],
        152: ['T20-T20-D16'],
        151: ['T20-T17-D20'],
        150: ['T20-T18-D18'],
        149: ['T20-T19-D16'],
        148: ['T20-T16-D20'],
        147: ['T20-T17-D18'],
        146: ['T20-T18-D16'],
        145: ['T20-T15-D20'],
        144: ['T20-T20-D12'],
        143: ['T20-T17-D16'],
        142: ['T20-T14-D20'],
        141: ['T20-T19-D12'],
        140: ['T20-T20-D10'],
        139: ['T20-T13-D20'],
        138: ['T20-T18-D12'],
        137: ['T20-T19-D10'],
        136: ['T20-T20-D8'],
        135: ['T20-T17-D12'],
        134: ['T20-T14-D16'],
        133: ['T20-T19-D8'],
        132: ['T20-T16-D12'],
        131: ['T20-T13-D16'],
        130: ['T20-T18-D8'],
        129: ['T19-T16-D12'],
        128: ['T18-T14-D16'],
        127: ['T20-T17-D8'],
        126: ['T19-T19-D6'],
        125: ['T20-T19-D4'],
        124: ['T20-T16-D8'],
        123: ['T19-T16-D9'],
        122: ['T18-T20-D4'],
        121: ['T20-T11-D14'],
        120: ['T20-20-D20']
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
                const suggestion = `${formatThrow(i)}-D${remaining / 2}`;
                if (!suggestions.includes(suggestion)) {
                    suggestions.push(suggestion);
                }
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
                            const suggestion = `${formatThrow(i)}-${formatThrow(j)}-D${remaining / 2}`;
                            if (!suggestions.includes(suggestion)) {
                                suggestions.push(suggestion);
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Убираем дробные значения
    return suggestions.filter(suggestion => !suggestion.includes('.')).slice(0, 3);
}

function formatThrow(value) {
    // if (value === 50) return 'Bull';
    // if (value === 25) return 'Outer Bull';
    if (value > 20) return 'T' + (value / 3);
    return value.toString();
}

document.getElementById('legMode').addEventListener('change', updateLegsCountOptions);


document.addEventListener('DOMContentLoaded', function() {
    updateLegsCountOptions();
});

// Функции для работы с сессиями
function showSessionsModal() {
    const modal = document.getElementById('sessionsModal');
    modal.style.display = 'flex';
    updateSessionStatus();
    updateSyncHistory();
}

function closeSessionsModal() {
    const modal = document.getElementById('sessionsModal');
    modal.style.display = 'none';
}

async function createNewSession() {
    try {
        const { sessionId, password } = await sessions.create();
        showSessionQR(sessionId, password);
        updateSessionStatus();
        addSyncHistory('Создана новая сессия');
    } catch (error) {
        showErrorModal('Ошибка при создании сессии: ' + error.message);
    }
}

function showSessionQR() {
    const modal = document.getElementById('sessionQRModal');
    const container = document.getElementById('sessionQRCodeContainer');
    container.innerHTML = '';
    container.classList.remove('hidden');

    // Получаем данные текущей сессии
    const sessionId = localStorage.getItem('currentSessionId');
    const password = localStorage.getItem('currentSessionPassword');

    if (!sessionId || !password) {
        container.innerHTML = '<p style="color: #333; font-size: 1.2em;">Нет активной сессии. Создайте новую сессию.</p>';
        modal.style.display = 'flex';
        return;
    }

    const qrData = JSON.stringify({ sessionId, password });
    const qrCode = new QRCode(container, {
        text: qrData,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
        quietZone: 15,
        quietZoneColor: '#ffffff'
    });

    // Показываем модальное окно
    modal.style.display = 'flex';
}

function closeSessionQRModal() {
    const modal = document.getElementById('sessionQRModal');
    modal.style.display = 'none';
}

// Обработчик закрытия модального окна с QR-кодом при клике вне его области
window.addEventListener('click', function(event) {
    const modal = document.getElementById('sessionQRModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

function scanSessionQR() {
    const modal = document.getElementById('scanQRModal');
    const reader = document.getElementById('qrReader');
    reader.innerHTML = '';
    reader.style.display = 'flex';
    modal.style.display = 'block';

    // Создаем новый экземпляр сканера и сохраняем его глобально
    window.html5QrCode = new Html5Qrcode('qrReader');
    const config = { 
        fps: 10, 
        qrbox: { width: 200, height: 400 },
        aspectRatio: 1.0
    };

    const qrCodeSuccessCallback = async (decodedText) => {
        try {
            const data = JSON.parse(decodedText);
            if (data.sessionId && data.password) {
                await sessions.connect(data.sessionId, data.password);
                updateSessionStatus();
                closeScanQRModal(); // Закрываем модальное окно после успешного сканирования
                addSyncHistory('Подключение к сессии через QR-код');
            }
        } catch (error) {
            console.error('Ошибка при обработке QR-кода:', error);
            showWarningModal('Ошибка при сканировании QR-кода', 3000);
        }
    };

    const qrCodeErrorCallback = (errorMessage) => {
        console.error('Ошибка сканирования QR-кода:', errorMessage);
    };

    window.html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        qrCodeErrorCallback
    ).catch((err) => {
        console.error("Ошибка при запуске сканера:", err);
        showWarningModal('Ошибка при запуске камеры', 3000);
    });
}

function closeScanQRModal() {
    const modal = document.getElementById('scanQRModal');
    const reader = document.getElementById('qrReader');
    
    // Проверяем, существует ли экземпляр сканера
    if (window.html5QrCode) {
        window.html5QrCode.stop().then(() => {
            window.html5QrCode = null;
            modal.style.display = 'none';
            reader.innerHTML = '';
            reader.style.display = 'none';
        }).catch((error) => {
            console.error("Ошибка при остановке сканера:", error);
            // Даже если произошла ошибка, все равно закрываем модальное окно
            window.html5QrCode = null;
            modal.style.display = 'none';
            reader.innerHTML = '';
            reader.style.display = 'none';
        });
    } else {
        // Если сканер не существует, просто закрываем модальное окно
        modal.style.display = 'none';
        reader.innerHTML = '';
        reader.style.display = 'none';
    }
}

// Обработчик закрытия модального окна сканирования при клике вне его области
window.addEventListener('click', function(event) {
    const modal = document.getElementById('scanQRModal');
    if (event.target === modal) {
        closeScanQRModal();
    }
});

function updateSessionStatus() {
    const currentSessionId = document.getElementById('currentSessionId');
    const currentSessionPassword = document.getElementById('currentSessionPassword');
    const currentSessionStatus = document.getElementById('currentSessionStatus');
    const currentDataVersion = document.getElementById('currentDataVersion');
    const disconnectBtn = document.getElementById('disconnectSessionBtn');
    
    const { sessionId, password } = sessions.getSessionFromLocalStorage();
    const lastModified = localStorage.getItem('lastModified');
    
    if (sessionId) {
        currentSessionId.textContent = sessionId;
        currentSessionPassword.textContent = password;
        currentSessionStatus.textContent = 'Подключено';
        currentSessionStatus.style.color = '#4CAF50';
        disconnectBtn.style.display = 'block';
        
        // Форматируем временную метку
        if (lastModified) {
            const date = new Date(parseInt(lastModified));
            currentDataVersion.textContent = date.toLocaleString();
        } else {
            currentDataVersion.textContent = 'Нет данных о версии';
        }
    } else {
        currentSessionId.textContent = '-';
        currentSessionPassword.textContent = '-';
        currentSessionStatus.textContent = 'Не синхронизировано';
        currentSessionStatus.style.color = '';
        disconnectBtn.style.display = 'none';
        currentDataVersion.textContent = '-';
    }
}

function updateSyncHistory() {
    const history = JSON.parse(localStorage.getItem('syncHistory') || '[]');
    const historyContainer = document.getElementById('syncHistory');
    historyContainer.innerHTML = '';

    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'sync-history-item';
        historyItem.textContent = `${new Date(item.timestamp).toLocaleString()} - ${item.action}`;
        historyContainer.appendChild(historyItem);
    });
}

function addSyncHistory(action) {
    const history = JSON.parse(localStorage.getItem('syncHistory') || '[]');
    history.unshift({
        timestamp: Date.now(),
        action: action
    });
    
    // Оставляем только последние 50 записей
    if (history.length > 50) {
        history.pop();
    }
    
    localStorage.setItem('syncHistory', JSON.stringify(history));
    updateSyncHistory();
}

// Автоматическая синхронизация
function startAutoSync() {
    const syncInterval = 30000; // 30 секунд
    let lastSyncTime = 0;
    let syncInProgress = false;

    setInterval(async () => {
        const now = Date.now();
        if (now - lastSyncTime >= syncInterval && !syncInProgress) {
            syncInProgress = true;
            try {
                await sessions.sync();
                lastSyncTime = now;
            } catch (error) {
                console.error('Ошибка автоматической синхронизации:', error);
                // Не обновляем lastSyncTime при ошибке, чтобы попробовать снова в следующем интервале
            } finally {
                syncInProgress = false;
            }
        }
    }, 1000); // Проверяем каждую секунду
}

function stopAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
    }
}

// Обработчик изменения настройки автоматической синхронизации
document.getElementById('autoSync').addEventListener('change', function(e) {
    if (e.target.checked) {
        startAutoSync();
    } else {
        stopAutoSync();
    }
});

// Инициализация автоматической синхронизации при загрузке страницы
if (document.getElementById('autoSync').checked) {
    startAutoSync();
}

// Обработчик закрытия модального окна с QR-кодом
document.querySelector('#sessionModal .close').addEventListener('click', function() {
    document.getElementById('sessionModal').style.display = 'none';
});

// Закрытие модального окна при клике вне его области
window.addEventListener('click', function(event) {
    const modal = document.getElementById('sessionModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

async function disconnectSession() {
    try {
        await sessions.clearSession();
        updateSessionStatus();
        addSyncHistory('Отключение от сессии');
        showWarningModal('Сессия успешно завершена', 2000);
    } catch (error) {
        console.error('Ошибка при отключении от сессии:', error);
        showWarningModal('Ошибка при отключении от сессии', 2000);
    }
}

function updateSessionStatus() {
    const currentSessionId = document.getElementById('currentSessionId');
    const currentSessionPassword = document.getElementById('currentSessionPassword');
    const currentSessionStatus = document.getElementById('currentSessionStatus');
    const currentDataVersion = document.getElementById('currentDataVersion');
    const disconnectBtn = document.getElementById('disconnectSessionBtn');
    
    const { sessionId, password } = sessions.getSessionFromLocalStorage();
    const lastModified = localStorage.getItem('lastModified');
    
    if (sessionId) {
        currentSessionId.textContent = sessionId;
        currentSessionPassword.textContent = password;
        currentSessionStatus.textContent = 'Подключено';
        currentSessionStatus.style.color = '#4CAF50';
        disconnectBtn.style.display = 'block';
        
        // Форматируем временную метку
        if (lastModified) {
            const date = new Date(parseInt(lastModified));
            currentDataVersion.textContent = date.toLocaleString();
        } else {
            currentDataVersion.textContent = 'Нет данных о версии';
        }
    } else {
        currentSessionId.textContent = '-';
        currentSessionPassword.textContent = '-';
        currentSessionStatus.textContent = 'Не синхронизировано';
        currentSessionStatus.style.color = '';
        disconnectBtn.style.display = 'none';
        currentDataVersion.textContent = '-';
    }
}

async function connectToSession() {
    const sessionId = document.getElementById('sessionIdInput').value.trim();
    const password = document.getElementById('sessionPasswordInput').value.trim();

    if (!sessionId || !password) {
        showWarningModal('Пожалуйста, введите ID и пароль сессии', 2000);
        return;
    }

    try {
        await sessions.connect(sessionId, password);
        updateSessionStatus();
        addSyncHistory('Подключение к сессии');
        showWarningModal('Успешное подключение к сессии', 2000);
        
        // Очищаем поля ввода
        document.getElementById('sessionIdInput').value = '';
        document.getElementById('sessionPasswordInput').value = '';
    } catch (error) {
        console.error('Ошибка при подключении к сессии:', error);
        showWarningModal('Ошибка при подключении к сессии. Проверьте ID и пароль.', 2000);
    }
}