const mysql = require('mysql');
const neo4j = require('neo4j-driver');
const connectionMYSQL = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tpbdd'
});

const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'root'), {
    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 2 * 60 * 1000, // 120 seconds
    disableLosslessIntegers: true
});

connectionMYSQL.connect((err) => {
    if (err) {
        throw err;
    }
});

const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
let mode = 'MySQL';

function formatResponse(resultObj) {
    const result = [];
    if (resultObj.records.length > 0) {
        resultObj.records.map(record => {
            result.push(record._fields[0].properties);
        });
    }
    return result;
}
let A = 0;
async function executeCypherQuery(statement, params = {}) {
    try {
        const session = driver.session();
        const result = await session.run(statement, params);
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
    if(mode === "MySQL")
        await requestMySQL('SELECT * FROM ' + req.body.table + ';', res);
    else if(mode === "NoSQL") {
        const query = `MATCH (n:Person) RETURN n LIMIT 25`;
        const params = {
        };
        await requestNoSQL(query, params, res);
    }
        //await requestNoSQL('SELECT * FROM ' + req.body.table + ';', res);
})

app.post('/ProductListFollowers', async (req, res) => {
    if(mode === "MySQL")
        await requestMySQL('SELECT * FROM ' + req.body.table + ';', res);
    else if(mode === "NoSQL") {
        const query = `MATCH (n:Person) RETURN n LIMIT 25`;
        const params = {
        };
        await requestNoSQL(query, params, res);
    }
    //await requestNoSQL('SELECT * FROM ' + req.body.table + ';', res);
})

app.post('/SetMode', (req, res) => {
    if (req.body.mode === 'MySQL') {
        mode = "MySQL";
        res.render('index.html', {mode: 'MySQL', time: '0', requestResult: ''});
    } else if (req.body.mode === 'NoSQL') {
        mode = "NoSQL";
        res.render('index.html', {mode: 'NoSQL', time: '0', requestResult: ''});
    }
});
app.post('/FillNoSQL', (req, res) => {
    createNoSQL();
    res.render('index.html', {mode: 'NoSQL', time: '0', requestResult: ''});

});
app.listen(port, () => {
    console.log(`Application exemple à l'écoute sur le port ${port}!`)
});

const requestMySQL = async function (query, res) {
    let pre_query = new Date().getTime();
    await connectionMYSQL.query(query, function (err, result, fields) {
        if (err) {
            res.render('index.html', {mode: 'MySQL', time: '0', requestResult: err});
            throw err;
        }
        let post_query = new Date().getTime();
        // calculate the duration in seconds
        let duration = (post_query - pre_query) / 1000;
        console.log(result);
        res.render('index.html', {mode: 'MySQL', time: duration, requestResult: result});
    });
}

const requestNoSQL = async function (query, params, res) {
    let pre_query = new Date().getTime();
    const resultObj = await executeCypherQuery(query, params);
    let post_query = new Date().getTime();
    // calculate the duration in seconds
    let duration = (post_query - pre_query) / 1000;
    const result = formatResponse(resultObj);
    res.render('index.html', {mode: 'NoSQL', time: duration, requestResult: result});
}


const createNoSQL = async function(){
    let pre_query = new Date().getTime();
    const session = driver.session();
    let users = [];
    let products = [];
    let queryBuilderConstraintProduct = `CREATE CONSTRAINT productConstraint ON (p: Product) ASSERT p.id IS UNIQUE `;
    const params = {
    };
    await session.run(queryBuilderConstraintProduct, params);
    let queryBuilderConstraintUser = `CREATE CONSTRAINT userConstraint ON (pers: Person) ASSERT pers.id IS UNIQUE `;
    await session.run(queryBuilderConstraintUser, params);
    for(let j=0; j<10000; j++){
        let refProd = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
        products.push(refProd);
        let queryBuilderProduct = `CREATE (p: Product {id: ` + j + `, reference: \"`+ refProd + `\"})`;
        const params = {
        };
        await session.run(queryBuilderProduct, params);
        //console.log("nombre de produit inséré : " + j);
    }
    let transaction;
    let nbrInsert = 4000;
    let pre_query2 = new Date().getTime();
    transaction = session.beginTransaction();
    for(let i=0; i < nbrInsert; i++){
        if(i%1000==0){
            await transaction.commit();
            transaction = session.beginTransaction();
            let post_query2 = new Date().getTime();
            // calculate the duration in seconds
            let duration2 = (post_query2 - pre_query2) / 1000;
            console.log(i + " user inséré en : " + duration2);
            pre_query2 = new Date().getTime();
        }
        let user = {};
        user.firstName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
        user.lastName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
        users.push(user);
        let queryBuilder =
            `CREATE (p: Person {id: ` + i + `, firstName: \"`+ user.firstName + `\" ,lastName: \"`+ user.firstName + `\"}) `;
        //let nbrBuy = Math.floor(Math.random() * (5 - 0 + 1)) + 0;
        let nbrBuy = 5;
        let nbrFollower = 20;
        //let nbrFollower = Math.floor(Math.random() * (20 - 0 + 1)) + 0;
        for(let h=0; h<nbrBuy; h++) {
            let randNumber = Math.floor(Math.random() * (9999 - 0 + 1)) + 0;
            queryBuilder = queryBuilder + `WITH p as p MATCH (product` + h + `) WHERE product` + h + `.id = ` + randNumber + ` CREATE (p)-[:BUY]->(product` + h + `) `;
            if(h==nbrBuy-1 && nbrFollower > 0 && users.length > 20)
                queryBuilder = queryBuilder + `WITH p as p `;
        }
        for(let n=0; n<nbrFollower; n++){
            console.log("n: " + n);
            if(users.length > 20){
                let randNumber2 = Math.floor(Math.random() * (users.length - 0 + 1)) + 0;
                if(n==(nbrFollower-1))
                    queryBuilder = queryBuilder + `MATCH (follower` + n + `) WHERE follower` + n + `.id = ` + randNumber2 + ` CREATE (p)<-[:FOLLOW]-(follower` + n + `) `;
                else
                    queryBuilder = queryBuilder + `MATCH (follower` + n + `) WHERE follower` + n + `.id = ` + randNumber2 + ` CREATE (p)<-[:FOLLOW]-(follower` + n + `) WITH follower` + n + ` as follower` + n + `, p as p `;
            }
        }
        const params = {
        };
        //console.log(queryBuilder + "\n\n");
        //return;
        console.log("debut transac");
        await transaction.run(queryBuilder, params);
        console.log("fin transac");
    }
    await transaction.commit();
    await session.close();
    let post_query = new Date().getTime();
    // calculate the duration in seconds
    let duration = (post_query - pre_query) / 1000;
    console.log("FINI EN : " + duration);
}