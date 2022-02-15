const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tpbdd'
});
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
});

const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.listen(port, () => {
    console.log(`Application exemple à l'écoute sur le port ${port}!`)
});
