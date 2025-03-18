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
const auth = firebase.auth();

// Проверка состояния аутентификации
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('Пользователь авторизован:', user.email);
    } else {
        console.log('Пользователь не авторизован');
    }
});

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
            // Создаем пользователя с паролем сессии
            const userCredential = await auth.createUserWithEmailAndPassword(
                `${sessionId}@dartcount.com`,
                password
            );

            // Сохраняем данные сессии
            await database.ref(`sessions/${sessionId}`).set(sessionData);
            this.saveSessionToLocalStorage(sessionId, password);
            return { sessionId, password };
        } catch (error) {
            console.error('Ошибка при создании сессии:', error);
            if (error.code === 'auth/configuration-not-found') {
                console.error('Ошибка конфигурации Firebase: не включена аутентификация по email/password');
            }
            throw error;
        }
    },

    // Подключение к существующей сессии
    connect: async function(sessionId, password) {
        try {
            // Аутентифицируем пользователя
            await auth.signInWithEmailAndPassword(
                `${sessionId}@dartcount.com`,
                password
            );

            const snapshot = await database.ref(`sessions/${sessionId}`).once('value');
            const sessionData = snapshot.val();

            if (!sessionData) {
                throw new Error('Сессия не найдена');
            }

            this.saveSessionToLocalStorage(sessionId, password);
            this.updateLocalStorageData(sessionData.data);
            return sessionData;
        } catch (error) {
            console.error('Ошибка при подключении к сессии:', error);
            throw error;
        }
    },

    // Синхронизация данных
    sync: async function() {
        const { sessionId, password } = this.getSessionFromLocalStorage();
        if (!sessionId || !password) {
            console.log('Нет активной сессии для синхронизации');
            return;
        }

        try {
            // Проверяем текущее состояние аутентификации
            if (!auth.currentUser) {
                console.log('Попытка повторной аутентификации...');
                try {
                    await auth.signInWithEmailAndPassword(
                        `${sessionId}@dartcount.com`,
                        password
                    );
                    console.log('Аутентификация успешна');
                } catch (authError) {
                    console.error('Ошибка аутентификации:', authError);
                    if (authError.code === 'auth/invalid-login-credentials') {
                        console.log('Неверные учетные данные, очищаем сессию');
                        await this.clearSession();
                        return;
                    }
                    throw authError;
                }
            }

            // Проверяем существование сессии в базе данных
            const sessionRef = database.ref(`sessions/${sessionId}`);
            const snapshot = await sessionRef.once('value');
            const sessionData = snapshot.val();

            if (!sessionData) {
                console.log('Сессия не найдена в базе данных, очищаем локальную сессию');
                await this.clearSession();
                return;
            }

            const localData = this.getLocalStorageData();
            await sessionRef.update({
                data: localData,
                lastSync: Date.now()
            });
            console.log('Синхронизация успешно завершена');
        } catch (error) {
            console.error('Ошибка при синхронизации:', error);
            if (error.code === 'auth/configuration-not-found') {
                console.error('Ошибка конфигурации Firebase: не включена аутентификация по email/password');
            } else if (error.code === 'auth/user-not-found') {
                console.error('Пользователь не найден');
                await this.clearSession();
            } else if (error.code === 'auth/wrong-password') {
                console.error('Неверный пароль');
                await this.clearSession();
            } else if (error.code === 'auth/invalid-login-credentials') {
                console.error('Неверные учетные данные');
                await this.clearSession();
            }
            throw error;
        }
    },

    // Получение данных из Firebase
    fetch: async function() {
        const { sessionId, password } = this.getSessionFromLocalStorage();
        if (!sessionId || !password) return;

        try {
            // Проверяем аутентификацию
            if (!auth.currentUser) {
                await auth.signInWithEmailAndPassword(
                    `${sessionId}@dartcount.com`,
                    password
                );
            }

            const snapshot = await database.ref(`sessions/${sessionId}`).once('value');
            const sessionData = snapshot.val();

            if (!sessionData) {
                throw new Error('Сессия не найдена');
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
    clearSession: async function() {
        const { sessionId } = this.getSessionFromLocalStorage();
        if (sessionId) {
            try {
                await auth.signOut();
            } catch (error) {
                console.error('Ошибка при выходе из сессии:', error);
            }
        }
        localStorage.removeItem('currentSessionId');
        localStorage.removeItem('currentSessionPassword');
    }
}; 