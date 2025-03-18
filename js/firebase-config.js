// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCNTf5OD1T0nAU1ZBDsKSwxHcHYABkJhOs",
    authDomain: "dartcount-e63d2.firebaseapp.com",
    databaseURL: "https://dartcount-e63d2-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "dartcount-e63d2",
    storageBucket: "dartcount-e63d2.appspot.com",
    messagingSenderId: "329421909163",
    appId: "1:329421909163:web:ae62ea44fb8a3d64075bee"
  };

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Функции для работы с сессиями
const sessions = {
    // Создание новой сессии
    create: async function() {
        const sessionId = this.generateSessionId();
        const password = this.generatePassword();
        
        const sessionData = {
            id: sessionId,
            password: password,
            createdAt: Date.now(),
            lastSync: Date.now(),
            data: this.getLocalStorageData()
        };

        try {
            await database.ref(`sessions/${sessionId}`).set(sessionData);
            this.saveSessionToLocalStorage(sessionId, password);
            return { sessionId, password };
        } catch (error) {
            console.error('Ошибка при создании сессии:', error);
            throw error;
        }
    },

    // Подключение к существующей сессии
    connect: async function(sessionId, password) {
        try {
            const snapshot = await database.ref(`sessions/${sessionId}`).once('value');
            const sessionData = snapshot.val();

            if (!sessionData || sessionData.password !== password) {
                throw new Error('Неверный ID сессии или пароль');
            }

            this.saveSessionToLocalStorage(sessionId, password);
            return sessionData;
        } catch (error) {
            console.error('Ошибка при подключении к сессии:', error);
            throw error;
        }
    },

    // Синхронизация данных
    sync: async function() {
        const { sessionId, password } = this.getSessionFromLocalStorage();
        if (!sessionId || !password) return;

        try {
            const localData = this.getLocalStorageData();
            await database.ref(`sessions/${sessionId}`).update({
                data: localData,
                lastSync: Date.now()
            });
        } catch (error) {
            console.error('Ошибка при синхронизации:', error);
            throw error;
        }
    },

    // Получение данных из Firebase
    fetch: async function() {
        const { sessionId, password } = this.getSessionFromLocalStorage();
        if (!sessionId || !password) return;

        try {
            const snapshot = await database.ref(`sessions/${sessionId}`).once('value');
            const sessionData = snapshot.val();

            if (!sessionData || sessionData.password !== password) {
                throw new Error('Неверный ID сессии или пароль');
            }

            this.updateLocalStorageData(sessionData.data);
            return sessionData;
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
            throw error;
        }
    },

    // Генерация уникального ID сессии
    generateSessionId: function() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    },

    // Генерация пароля
    generatePassword: function() {
        return Math.random().toString(36).substring(2, 8);
    },

    // Получение данных из localStorage
    getLocalStorageData: function() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // Пропускаем служебные ключи Firebase
            if (key.startsWith('firebase:') || key.startsWith('_firebase')) {
                continue;
            }
            try {
                const value = localStorage.getItem(key);
                // Проверяем, является ли значение объектом
                if (value && value.startsWith('{')) {
                    data[key] = JSON.parse(value);
                } else {
                    data[key] = value;
                }
            } catch (e) {
                console.warn(`Ошибка при обработке ключа ${key}:`, e);
                data[key] = localStorage.getItem(key);
            }
        }
        return data;
    },

    // Обновление данных в localStorage
    updateLocalStorageData: function(data) {
        for (const key in data) {
            // Пропускаем служебные ключи Firebase
            if (key.startsWith('firebase:') || key.startsWith('_firebase')) {
                continue;
            }
            try {
                if (typeof data[key] === 'object') {
                    localStorage.setItem(key, JSON.stringify(data[key]));
                } else {
                    localStorage.setItem(key, data[key]);
                }
            } catch (e) {
                console.warn(`Ошибка при сохранении ключа ${key}:`, e);
            }
        }
    },

    // Сохранение информации о сессии в localStorage
    saveSessionToLocalStorage: function(sessionId, password) {
        localStorage.setItem('currentSessionId', sessionId);
        localStorage.setItem('currentSessionPassword', password);
    },

    // Получение информации о сессии из localStorage
    getSessionFromLocalStorage: function() {
        return {
            sessionId: localStorage.getItem('currentSessionId'),
            password: localStorage.getItem('currentSessionPassword')
        };
    },

    // Очистка информации о сессии
    clearSession: function() {
        localStorage.removeItem('currentSessionId');
        localStorage.removeItem('currentSessionPassword');
    }
}; 