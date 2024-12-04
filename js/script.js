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

function finishLeg(currentPlayer) {
    const player = players[currentPlayer];
    const currentTime = new Date();

    const legScore = player.score; // Сохраняем текущий счет как результат лега

    // Обновляем данные игрока
    player.throws += 1; // Увеличиваем количество бросков
    player.totalPoints += legScore; // Добавляем очки к общему счету
    player.history[player.history.length - 1].push(legScore); // Записываем результат в историю
    player.throwTimes.push(currentTime); // Записываем время броска
    player.legWins += 1; // Увеличиваем количество выигранных легов

    // Проверяем лучший бросок
    if (legScore > player.bestNormalScore) {
        player.bestNormalScore = legScore;
    }

    // Сбросить счет для следующего лега
    player.score = gameScore; // Сбросить счет до начального значения
    player.history.push([]); // Начинаем новую историю бросков для следующего лега

    // Обновляем интерфейс
    updateScoreBoard(); // Обновляем отображение счета
    updateStatsBoard(); // Обновляем статистику
}

// Функция для открытия модального окна со статистикой
function showStatsModal() {
    const playersStatsContent = document.getElementById('playersStatsContent');
    playersStatsContent.innerHTML = ''; // Очищаем предыдущее содержимое

    // Проверяем, есть ли игроки
    if (players.length === 0) {
        const noPlayersMessage = document.createElement('div');
        noPlayersMessage.textContent = 'Игроки не созданы, статистика отсутствует.';
        noPlayersMessage.style.textAlign = 'center'; // Центрируем текст
        noPlayersMessage.style.fontSize = '1.5em'; // Увеличиваем размер шрифта
        playersStatsContent.appendChild(noPlayersMessage);
        document.getElementById('statsModal').style.display = 'flex'; // Показываем модальное окно
        return; // Завершаем выполнение функции
    }

    // Определяем лучшего игрока
    let bestPlayer = null;
    let maxLegWins = 0;
    let isTie = false;

    players.forEach(player => {
        if (player.legWins > maxLegWins) {
            maxLegWins = player.legWins;
            bestPlayer = player;
            isTie = false; // Сбросить признак ничьей
        } else if (player.legWins === maxLegWins && player.legWins > 0) {
            isTie = true; // Обнаружена ничья
        }
    });

    players.forEach(player => {
        const playerStatDiv = document.createElement('div');
        playerStatDiv.classList.add('player-stat');

        // Добавляем класс для лучшего игрока, если он единственный
        if (player === bestPlayer && !isTie && player.legWins > 0) {
            playerStatDiv.classList.add('best-player');
        }

        playerStatDiv.innerHTML = `
            <h4>${player.name} ${player === bestPlayer && !isTie ? '👑' : ''}</h4>
            <p>Бросков: ${player.throws}</p>
            <p>Набрано очков: ${player.totalPoints}</p>
            <p>Выигранные леги: ${player.legWins}</p>
            <p>Средний набор: ${player.averagePerApproach}</p>
            <p>Лучший бросок: ${player.bestNormalScore > 0 ? player.bestNormalScore : 'Нет данных'}</p>
        `;
        playersStatsContent.appendChild(playerStatDiv);
    });

    document.getElementById('statsModal').style.display = 'flex'; // Показываем модальное окно
}

// Функция для закрытия модального окна со статистикой
function closeStatsModal() {
    document.getElementById('statsModal').style.display = 'none'; // Скрываем модальное окно
}

function saveGameResults() {
    const savedResults = localStorage.getItem('dartGameResults');
    let results = savedResults ? JSON.parse(savedResults) : [];

    players.forEach(player => {
        const existingPlayer = results.find(p => p.name === player.name);
        if (existingPlayer) {
            // Суммируем значения
            existingPlayer.throws += player.throws;
            existingPlayer.totalPoints += player.totalPoints;
            existingPlayer.legWins += player.legWins;
            // Обновляем лучший бросок
            if (player.bestNormalScore > existingPlayer.bestNormalScore) {
                existingPlayer.bestNormalScore = player.bestNormalScore;
            }
        } else {
            // Если игрок новый, добавляем его в результаты
            results.push({ ...player });
        }
    });

    localStorage.setItem('dartGameResults', JSON.stringify(results));
}

function loadGameResults() {
    const savedResults = localStorage.getItem('dartGameResults');
    if (savedResults) {
        const results = JSON.parse(savedResults);
        results.forEach(savedPlayer => {
            const existingPlayer = players.find(p => p.name === savedPlayer.name);
            if (existingPlayer) {
                // Обновляем существующего игрока
                existingPlayer.throws += savedPlayer.throws;
                existingPlayer.totalPoints += savedPlayer.totalPoints;
                existingPlayer.legWins += savedPlayer.legWins;
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
    console.log('Текущий массив игроков:', players); // Отладка
    if (players.some(player => player.name.toLowerCase() === playerName.toLowerCase())) {
        alert('Игрок с таким именем уже существует. Пожалуйста, выберите другое имя.');
        return; // Завершаем выполнение функции, если игрок с таким именем уже существует
    }

    // Если имя уникально, добавляем игрока
    players.push({ name: playerName, throws: 0, totalPoints: 0, legWins: 0, history: [[]] });
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
    localStorage.setItem('players', JSON.stringify(uniquePlayers));
}

document.getElementById('playersButton').addEventListener('click', showPlayersModal);
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

function savePlayers() {
    localStorage.setItem('players', JSON.stringify(players));
}

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
        throwTimes: [], // Время бросков
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
    const currentTime = new Date();

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
        finishLeg(currentPlayer); // Обновляем данные игрока
        showThrowsModal(currentPlayer + 1, player.legWins)
            .then(throwsToFinish => {
                const legScore = score; 
                player.score = 0; // Счет игрока обнуляется
                player.throws += throwsToFinish; // Увеличиваем количество бросков
                player.totalPoints += legScore; // Добавляем очки
                player.history[player.history.length - 1].push(legScore); // Записываем результат
                player.throwTimes.push(currentTime); // Записываем время броска
                // player.legWins++; // Увеличиваем количество выигранных легов
                lastScores.push({ 
                    playerIndex: currentPlayer, 
                    score: legScore, 
                    legIndex: player.history.length - 1 
                });

                // Проверяем, выиграл ли игрок игру
                if (checkGameWin(player)) {
                    gameEndTime = new Date();
                    createConfetti(); // Создаем конфетти
                    setTimeout(() => {
                        showGameStats(); // Показываем статистику игры
                    }, 1000);
                    return; // Завершаем выполнение функции
                }

                // Обновляем состояние для следующего лега
                players.forEach(p => {
                    p.score = gameScore; // Сбрасываем счет для всех игроков
                    p.history.push([]); // Создаем новую историю бросков
                });
                nextLegStartPlayer = (nextLegStartPlayer + 1) % playerCount; // Переход к следующему игроку
                currentPlayer = nextLegStartPlayer; // Обновляем текущего игрока
                
                saveGameResults();
                updateScoreBoard(); // Обновляем таблицу результатов
                updateStatsBoard(); // Обновляем статистику
            });
        return; // Завершаем выполнение функции
    }

    // Если игрок не завершил лег, проверяем оставшиеся очки
    const remainingScore = player.score - score;

    if (remainingScore < 0) {
        // Если игрок ввел больше очков, чем у него осталось
        showWarningModal('Вы превысили допустимое количество очков', 3000);
        player.history[player.history.length - 1].push('0 (' + score + ')'); // Записываем 0 как основное значение и превышение в скобках
        player.throws += 3; // Увеличиваем количество бросков
        player.totalPoints += 0; // Обновляем общие очки
        player.throwTimes.push(currentTime); // Записываем время броска

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
        scoreInput.value = ''; // Очищаем поле ввода
        updateScoreBoard(); // Обновляем таблицу результатов
        updateStatsBoard(); // Обновляем статистику
        scoreInput.focus(); // Фокусируем поле ввода
        return; // Завершаем выполнение функции
    }

    if (remainingScore === 1) {
        showErrorModal('Нельзя оставить 1 очко. Введите меньшее значение.');
        return; // Завершаем выполнение функции
    }

    // Если введенное значение корректное и не превышает оставшиеся очки
    player.score = remainingScore; // Обновляем счет
    player.throws += 3; // Ув величиваем количество бросков
    player.totalPoints += score; // Обновляем общие очки
    player.history[player.history.length - 1].push(score); // Записываем результат в историю
    player.throwTimes.push(currentTime); // Записываем время броска
    lastScores.push({
        playerIndex: currentPlayer,
        score,
        legIndex: player.history.length - 1
    });

    // Обновляем лучший бросок без превышения
    if (score > player.bestNormalScore) {
        player.bestNormalScore = score;
    }

    // Переход к следующему игроку
    currentPlayer = (currentPlayer + 1) % playerCount; 
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
    statsBoard.innerHTML = ''; // Очищаем предыдущие данные

    players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('stats-column');
        
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
            <h3>Игрок #${index + 1}: ${player.name}</h3>
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
    document.querySelector('.settings').style.display = 'flex'; // Показываем настройки
    document.getElementById('scoreInput').style.display = 'none'; // Скрываем ввод очков
    document.getElementById('restartBtn').style.display = 'none'; // Скрываем кнопку перезапуска
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
            <h3>${player.name} #${index + 1} ${index === winner.index ? '👑' : ''}</h3>
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
        console.log('PDF успешно создан');
    }).catch(error => {
        console.error('Ошибка при создании PDF:', error);
        alert('Произошла ошибка при создании PDF');
    });
}

function getCheckoutSuggestions(score) {
    if (score > 180 || score <= 1) return [];
    
    const specialCases = {
        170: ['T20 - T20 - 50'],    
        167: ['T20 - T19 - 50'],
        164: ['T20 - T18 - 50'],
        161: ['T20 - T17 - 50'],
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
                const suggestion = `${formatThrow(i)} - D${remaining / 2}`;
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
                            const suggestion = `${formatThrow(i)} - ${formatThrow(j)} - D${remaining / 2}`;
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

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker зарегистрирован с областью:', registration.scope);
        })
        .catch((error) => {
          console.error('Ошибка регистрации Service Worker:', error);
        });
    });
  }