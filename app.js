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

const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
app.use(express.static(__dirname + '/'));
app.use(bodyParser.urlencoded({extend:true}));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);


app.get('/', (req, res) => {
    res.redirect('/Base');
});

app.get('/Base', (req,res) => {
    res.render('index.html', {mode: 'Not connected'});
})
app.post('/SetMode', (req, res) => {
    if(req.body.mode == 'SGBDR'){
        res.render('index.html', {mode: 'SGBDR'});
    }
    else if(req.body.mode == 'NoSQL') {
        res.render('index.html', {mode: 'NoSQL'});
    }
});

app.listen(port, () => {
    console.log(`Application exemple à l'écoute sur le port ${port}!`)
});
