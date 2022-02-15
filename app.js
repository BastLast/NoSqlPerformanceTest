const mysql = require('mysql');
const neo4j = require('neo4j-driver');
const connectionMYSQL = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tpbdd'
});

const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'neo4j'));
connectionMYSQL.connect((err) => {
    if (err) {
        throw err;
    }
});
const session = driver.session();
const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
let mode = 'SGBDR';

function formatResponse(resultObj) {
    const result = [];
    if (resultObj.records.length > 0) {
        resultObj.records.map(record => {
            result.push(record._fields[0].properties);
        });
    }
    return result;
}

async function executeCypherQuery(statement, params = {}) {
    try {
        const result = session.run(statement, params);
        await session.close();
        return result;
    } catch (error) {
        throw error; // we are logging this error at the time of calling this method
    }
}

app.get('/', (req, res) => {
    res.redirect('/Base');
});

app.use(express.static(__dirname + '/'));
app.use(bodyParser.urlencoded({extend: true}));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);

app.get('/Error', (req, res) => {
    res.render('index.html', {mode: 'connection error', time: '0', requestResult: ''});
})

app.get('/Base', (req, res) => {
    res.render('index.html', {mode: mode, time: '0', requestResult: ''});
})

app.post('/RequestSelect', async (req, res) => {
    if(mode === "SGBDR")
        await requestMySQL('SELECT * FROM ' + req.body.table + ';', res);
    else if(mode === "NoSQL") {
        const query = `MATCH (n:Movie) RETURN n LIMIT 25`;
        const params = {
        };
        let pre_query = new Date().getTime();
        const resultObj = await executeCypherQuery(query, params);
        let post_query = new Date().getTime();
        // calculate the duration in seconds
        let duration = (post_query - pre_query) / 1000;
        const result = formatResponse(resultObj);
        res.render('index.html', {mode: 'NoSQL', time: duration, requestResult: result});

    }
        //await requestNoSQL('SELECT * FROM ' + req.body.table + ';', res);
})

app.post('/SetMode', (req, res) => {
    if (req.body.mode === 'SGBDR') {
        mode = "SGBDR";
        res.render('index.html', {mode: 'SGBDR', time: '0', requestResult: ''});
    } else if (req.body.mode === 'NoSQL') {
        mode = "NoSQL";
        res.render('index.html', {mode: 'NoSQL', time: '0', requestResult: ''});
    }
});

app.listen(port, () => {
    console.log(`Application exemple à l'écoute sur le port ${port}!`)
});

const requestMySQL = async function (query, res) {
    let pre_query = new Date().getTime();
    await connectionMYSQL.query(query, function (err, result, fields) {
        if (err) {
            res.render('index.html', {mode: 'SGBDR', time: '0', requestResult: err});
            throw err;
        }
        let post_query = new Date().getTime();
        // calculate the duration in seconds
        let duration = (post_query - pre_query) / 1000;
        console.log(result);
        res.render('index.html', {mode: 'SGBDR', time: duration, requestResult: result});
    });
}

const requestNoSQL = async function (query, res) {
    //TODO
}
