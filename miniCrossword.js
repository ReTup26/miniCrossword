const fs = require('fs');
var words;

//Проверка возможности размещения слова в кроссворде
function possiblePlaceWord(field, row, col, word) {
    //Проверка идет по строкам
    let lengthPos = 0; //Слово должно либо иметь размер строки, либо быть меньше, если есть *
    while (lengthPos < field[0].length - col && field[row][col + lengthPos] !== '*'){
        lengthPos++;
    }
    if (word.length !== lengthPos){
        return false;
    }
    
    //Проверка столбцов на возможность существования в них слов, с учетом нового символа из проверяемого слова
    for (let i = 0; i < word.length; ++i) {
        let verticalStr = '';
        let possibleLength = field.length;
        let startPos = (row > 0 && field[row - 1][col + i] === '*') ? row : 0; //Если * посреди строки, слова до и после разделяются
        for (let j = startPos; j < field.length; ++j) {
            if (field[j][col + i] === '*'){
                if (j === startPos) {
                    startPos++; //Если в начале есть несколько *, их необходимо пропустить 
                    possibleLength--;
                }
                else{
                    possibleLength = j - startPos;
                    break; 
                }
            }
            else if (field[j][col + i] !== '_') {
                verticalStr += field[j][col + i];
            }
        }

        flagPosWord = false;
        if (verticalStr.length < possibleLength) {
            verticalStr += word[i]; 
            //Если в стоблце изначально ничего не было и нет *, можно использовать любой символ
            //Если есть слова, начинающиеся на буквы в столбце, слово может подходить
            for (let possibleWord of words.filter(pW => pW.length === possibleLength)) {
                if (possibleWord.startsWith(verticalStr)){
                    flagPosWord = true; 
                    break;
                }
            }
        }
        if (!flagPosWord) return false;
    }
    return true; //Если не было нарушений условий, слово считается допустимым
}

function possibleCrossword(field){
    let minLengthWord = Math.min(...words.map(e => e.length)); //Длина самого короткого слова
    let isPossible = true;
    //Если строка или столбец короче самого короткого слова, кроссворд считается незаполнимым
    if (field.length < minLengthWord || field[0].length < minLengthWord)
        isPossible = false;
    else{
        //Если в строке или столбце есть *, которая отделяет слишком короткое слово, кроссворд считается незаполнимым
        for (let row = 0; row < field.length; ++row) {
            let prevRowPosStar = -1;
            let curRowPosStar = -1;
            for (let col = 0; col < field[row].length; ++col) {
                if (field[row][col] === '*'){
                    prevRowPosStar = curRowPosStar;
                    curRowPosStar = col;
                    let lengthPlace = curRowPosStar - prevRowPosStar - 1;
                    if (lengthPlace !== 0 && lengthPlace < minLengthWord){
                        isPossible = false;
                        break;
                    }
                } 
            }
        }
        for (let col = 0; col < field[0].length; ++col) {
            let prevColPosStar = -1;
            let curColPosStar = -1;
            for (let row = 0; row < field.length; ++row) {
                if (field[row][col] === '*'){
                    prevColPosStar = curColPosStar;
                    curColPosStar = row;
                    let lengthPlace = curColPosStar - prevColPosStar - 1;
                    if (lengthPlace !== 0 && lengthPlace < minLengthWord){
                        isPossible = false;
                        break;
                    }
                } 

            }
        }
    }
    return isPossible;
}


function generateCrossword(inputField, maxAttempts = 100) {
    try {
        let field = inputField.map(row => row.split("")); //Сохранение сетки кроссворда
        if (field.length === 0) return false;

        //Выбор слов, которые могут быть использованны в кроссворде
        //Слова выбираются из файла words.txt или collins.txt
        words = fs.readFileSync((fs.existsSync('./words.txt') ? './words.txt' : './collins.txt'), 'utf8')
            .trim().split('\n').filter(x => x.length <= Math.max(field.length, field[0].length));
        let flagNotFull = true; //Флаг для проверки на заполненность сетки
        
        if (possibleCrossword(field)){
            //Перебор порядков слов в словаре для нахождения разных решений
            for (let attempt = 0; attempt < maxAttempts; ++attempt){
                //Алгоритм Фишера-Йетса для перемешивания словаря
                let countWords = words.length;
                while (countWords) {
                    const index = Math.floor(Math.random() * countWords--);
                    [words[countWords], words[index]] = [words[index], words[countWords]];
                }

                field = inputField.map(row => row.split(""));
                let usedWords = []; //Необходимо отслеживать, какие слова уже были использованны в каждой попытке
                for (let row = 0; row < field.length; ++row) {
                    for (let col = 0; col < field[0].length; ++col) {
                        //Рассматривается каждая позиция, на случай, если встречаются *
                        if (field[row][col] === "_") {
                            let checkChangeSymb = false;
                            for (let word of words) {
                                //Слово проверено canPlaceWord и не использовалось раньше
                                if (!usedWords.includes(word) && possiblePlaceWord(field, row, col, word)) { 
                                    for (let i = 0; i < word.length; ++i) {
                                        field[row][col + i] = word[i];
                                    }
                                    checkChangeSymb = true;
                                    usedWords.push(word);
                                    break;
                                }  
                            }
                            if (!checkChangeSymb){
                                break; //Если последний символ не изменился, то решения не будет найдено
                            }
                            //console.log(field); //Пошаговое отображение заполнения сетки
                        }
                    }
                }
                //Выход из перебора при нахождении решения кроссворда
                flagNotFull = false;
                for (let row of field){
                    if (row.includes('_')){
                        flagNotFull = true;
                        break;
                    }
                }
            }
        }
        return flagNotFull ? false : field.map(row => row.join('')).join('\n'); //Возвращение решенного кроссворда или false
    } catch (error) {
        console.error(error);
    }
}


// Тест решения кроссворда
(async () => {
    const readline = require("readline");
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    //Переменная с сеткой кроссворда
    const fieldInput = [];
    //Чтение поля кроссворда с консоли
    await new Promise((resolve) => {
        console.log('Введите формат поля кроссворда. Для завершения ввода введите пустую строку:');
        rl.on('line', (line) => {
            if (line.trim() === '') {
                resolve();
                rl.close();
            }
            else 
                fieldInput.push(line.trim());
        });
    });
    
    console.log('Генерация кроссворда:');
    const crossword = await generateCrossword(fieldInput); //Необязательный параметр - количество попыток генерации, по умолчанию - 100
    //Время выполнения зависит от размера сетки, а также от случайного выбора порядка перебора словаря
    console.log(crossword ? crossword : 'Решение не найдено'); //Вывод решенного кроссворда или сообщение об отсутствии решения
})();