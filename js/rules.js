const rulesContent = `
<h2>Добро пожаловать в DartCount!</h2>
<p class="rule -text">
    DartCount — веб-приложение для подсчета очков в игре в дартс. 
    Оно позволяет вам легко отслеживать свои результаты и статистику, а также 
    управлять игрой с несколькими игроками. 
    Здесь вы найдете правила для популярных игр, таких как 101, 301 и 501.
</p>
<h2>Правила игры в дартс</h2>
<h3>Игры 101, 301 и 501</h3>
<p class="rule-text">
    В этих играх цель состоит в том, чтобы сбросить свои очки до нуля, набирая очки с помощью бросков дротиков.
</p>
<h4>Общие правила:</h4>
<p class="rule-text">
    Каждый игрок начинает с определенного количества очков: 101, 301 или 501.<br>
    Игроки бросают по три дротика за один подход.<br>
    Игроки должны завершить игру, попав в двойное поле (D) или в мишень (Bull).<br>
    Если игрок набирает больше очков, чем у него осталось, то его ход считается недействительным, и он остается на прежнем счете.<br>
    Игроки по очереди делают броски, пока один из них не достигнет нуля.<br>
</p>
<h4>Секторы и очки:</h4>
<p class="rule-text">
    Мишень (Bull): 50 очков<br>
    Внешний круг (Outer Bull): 25 очков<br>
    Секторы от 1 до 20: Каждый сектор имеет значение от 1 до 20. Попадание в сектор дает столько очков, сколько указано на нем.<br>
    Двойные (D): Попадание в двойное поле сектора дает удвоенное количество очков. Например, попадание в D20 дает 40 очков.<br>
    Тройные (T): Попадание в тройное поле сектора дает утроенное количество очков. Например, попадание в T20 дает 60 очков.
</p>
<h4>Завершение игры:</h4>
<p class="rule-text">
    Чтобы завершить игру, игрок должен сбросить свои очки до нуля, попав в двойное поле. Например:<br>
    Для 101: можно закончить, набрав 1 очко, попав в D1.<br>
    Для 301: можно закончить, набрав 2 очка, попав в D1.<br>
    Для 501: можно закончить, набрав 40 очков, попав в D20.<br>
    <br>
    Важно отметить, что игроки не могут завершить игру, если у них остается 1 очко. В этом случае игрок должен набрать больше очков, чтобы снова получить возможность завершить игру. Например, если у игрока 1 очко, он может бросить дротик в любой сектор, кроме двойного, чтобы увеличить свой счет.<br>
    <br>
    Если игрок случайно превышает свои очки и не может завершить игру, его ход считается недействительным, и он остается на прежнем счете. Это правило добавляет элемент стратегии, так как игроки должны тщательно планировать свои броски, чтобы избежать ненужных потерь.<br>
    <br>
    После завершения игры игроки могут подсчитать свои леги и определить, кто стал победителем. Игра может продолжаться в формате "лучший из трех" или "первый до N", что добавляет дополнительную напряженность и интерес в соревнование между игроками.
</p>
<h4>Леги:</h4>
<p class="rule-text">
    Игра может проходить в формате "лучший из трех" или "первый до N". 
    Игроки могут выигрывать леги, и тот, кто выиграет больше легов, становится победителем.
</p>
`;

function openRules() {
    const modal = document.getElementById('rulesModal');
    const content = modal.querySelector('.modal-content');
    content.innerHTML = rulesContent + '<div class="modal-footer"><button onclick="closeRules()">Закрыть</button></div>';
    modal.style.display = 'block';
}

function closeRules() {
    const modal = document.getElementById('rulesModal');
    modal.style.display = 'none';
}

document.addEventListener("DOMContentLoaded", function() {
    
});