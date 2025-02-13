const express = require('express');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

// Инициализируем приложение Express
const app = express();
const port = 3000;

// Мидлвар для обработки JSON данных
app.use(express.json());

// Мидлвар для логирования запросов в файл
morgan.token('date', () => new Date().toISOString());
app.use(morgan(':date :method :url :status', {
    stream: fs.createWriteStream(path.join(__dirname, 'logs/request.log'), { flags: 'a' })
}));

// Путь до файла с данными
const dataFilePath = path.join(__dirname, 'data/todo-list.json');

// Функция для чтения данных из файла
const readDataFromFile = () => {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
};

// Функция для записи данных в файл
const writeDataToFile = (data) => {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

// Валидация объекта задачи
const validateTodo = (todo) => {
    if (!todo || !todo.text || typeof todo.text !== 'string' || todo.text.trim() === '') {
        return false;
    }
    return true;
};

// Получить все объекты (GET)
app.get('/todos', (req, res) => {
    const todos = readDataFromFile();
    res.json(todos);
});

// Добавить новый объект (POST)
app.post('/todos', (req, res) => {
    const newTodo = req.body;

    // Проверка на корректность данных
    if (!validateTodo(newTodo)) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    const todos = readDataFromFile();
    
    // Генерация нового id (следующее свободное число)
    const newId = todos.length > 0 ? Math.max(...todos.map(todo => todo.id)) + 1 : 1;

    todos.push({ id: newId, text: newTodo.text });
    writeDataToFile(todos);
    res.status(201).json({ message: 'Todo added successfully' });
});

// Обновить объект (PUT)
app.put('/todos/:id', (req, res) => {
    const { id } = req.params;
    const updatedTodo = req.body;

    // Проверка на корректность данных
    if (!validateTodo(updatedTodo)) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    const todos = readDataFromFile();
    const index = todos.findIndex(todo => todo.id === parseInt(id));
    
    if (index === -1) {
        return res.status(404).json({ error: 'Todo not found' });
    }

    todos[index].text = updatedTodo.text;
    writeDataToFile(todos);
    res.json({ message: 'Todo updated successfully' });
});

// Удалить объект (DELETE)
app.delete('/todos/:id', (req, res) => {
    const { id } = req.params;
    const todos = readDataFromFile();

    // Находим задачу по ID
    const index = todos.findIndex(todo => todo.id === parseInt(id));
    
    if (index === -1) {
        return res.status(404).json({ error: 'Todo not found' });
    }

    // Удаляем задачу
    todos.splice(index, 1);

    // Перераспределяем id для красивого чтения 
    for (let i = 0; i < todos.length; i++) {
        todos[i].id = i + 1;  // Перезаписываем id с 1 и далее
    }

    writeDataToFile(todos);
    res.json({ message: 'Todo deleted and IDs renumbered successfully' });
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
