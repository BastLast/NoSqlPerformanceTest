const nosqlManager = require('./nosql/manager');
const sqlManager = require('./sql/manager');
const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;
let mode = 'MySQL';

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
    if (mode === "MySQL")
        await sqlManager.requestMySQL('SELECT * FROM ' + req.body.table + ';', res);
    else if (mode === "NoSQL") {
        const query = `MATCH (n:Person) RETURN n LIMIT 25`;
        const params = {};
        await nosqlManager.requestNoSQL(query, params, res);
    }
})

app.post('/ProductListFollowers', async (req, res) => {
    if (mode === "MySQL") {
        await sqlManager.requestMySQL('WITH recursive tree(node, depth) AS ( SELECT link.idFollower AS node, 1 AS depth FROM link WHERE link.idInflu = ' + req.body.userId + ' UNION ALL SELECT link.idFollower, depth + 1 FROM link JOIN tree ON tree.node = link.idInflu where depth <= ' + req.body.niveau + ') SELECT product.id AS productId, product.ref AS product, count(*) as nbAchatsfrom from product join buy on product.id = buy.idProduct join user on user.id = buy.idUser where user.id in ( SELECT DISTINCT node as followers FROM tree) GROUP by product.id', res);
    }
    else if (mode === "NoSQL") {
        const query = `MATCH (n:Person) RETURN n LIMIT 25`;
        const params = {};
        await nosqlManager.requestNoSQL(query, params, res);
    }
})

app.post('/ProductListFollowersWithSpecificProduct', async (req, res) => {
    if (mode === "MySQL") {
        await sqlManager.requestMySQL('WITH recursive tree(node, depth) AS ( SELECT link.idFollower AS node, 1 AS depth FROM link WHERE link.idInflu = ' + req.body.userId + ' UNION ALL SELECT link.idFollower, depth + 1 FROM link JOIN tree ON tree.node = link.idInflu JOIN buy ON buy.idUser = link.idInflu WHERE depth <= ' + req.body.niveau + ') SELECT product.id, product.ref, COUNT(*) AS achats FROM product JOIN buy ON product.id = buy.idProduct JOIN USER ON USER.id = buy.idUser WHERE USER.id IN ( SELECT DISTINCT node AS followers FROM tree ) AND product.id = ' + req.body.productId, res);
    }
    else if (mode === "NoSQL") {
        const query = `MATCH (n:Person) RETURN n LIMIT 25`;
        const params = {};
        await nosqlManager.requestNoSQL(query, params, res);
    }
})

app.post('/CommandListByInfluence', async (req, res) => {
    if (mode === "MySQL") {
        await sqlManager.requestMySQL('WITH RECURSIVE followersthatbought(USER, depth, parent) AS ( SELECT buy.idUser, 0, 0 FROM buy WHERE buy.idProduct = ' + req.body.productId + ' UNION ALL SELECT link.idInflu, depth + 1, USER FROM followersthatbought, link, buy WHERE USER = link.idFollower AND buy.idProduct = ' + req.body.productId + ' AND buy.idUser = link.idInflu AND link.idInflu != parent AND link.idFollower != parent AND depth < ' + req.body.niveau + ' ) SELECT depth, COUNT(USER) AS nbAchat FROM ( SELECT DISTINCT USER,  depth FROM followersthatbought ) AS ud GROUP BY depth', res);
    }
    else if (mode === "NoSQL") {
        const query = `MATCH (n:Person) RETURN n LIMIT 25`;
        const params = {};
        await nosqlManager.requestNoSQL(query, params, res);
    }
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

const createNoSQL = async function(){
    const session = driver.session();
    const params = {
    };
    let users = [];
    let products = [];
    let queryBuilderConstraintProduct = `CREATE INDEX person_id_index IF NOT EXISTS FOR (p:Person) ON (p.id)`;
    queryBuilderConstraintProduct = `CREATE CONSTRAINT productConstraint ON (p: Product) ASSERT p.id IS UNIQUE `;

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
    }
    let transaction;
    let nbrInsert = 1000000;
    transaction = session.beginTransaction();
    for(let i=0; i < nbrInsert; i++){
        if(i%1000==0){
            await transaction.commit();
            transaction = session.beginTransaction();
        }
        let user = {};
        user.firstName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
        user.lastName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
        users.push(user);
        let queryBuilder =
            `CREATE (p: Person {id: ` + i + `, firstName: \"`+ user.firstName + `\" ,lastName: \"`+ user.firstName + `\"}) `;
        const params = {
        };
        await transaction.run(queryBuilder, params);
    }
    await transaction.commit();
    if(users.length > 20){
        let queryBuilder = `MATCH (f:Person) WITH DISTINCT collect(f) as followers, range(0,20) as followersRange
            MATCH (i:Person) WITH i, apoc.coll.randomItems(followers, apoc.coll.randomItem(followersRange)) as followers
            FOREACH (follower in followers | CREATE (follower)-[:FOLLOW]->(i))`
        await session.run(queryBuilder, params);
    }
    if(products.length > 20){
        let queryBuilder = `MATCH (f:Product) WITH DISTINCT collect(f) as products, range(0,5) as productsRange
            MATCH (i:Person) WITH i, apoc.coll.randomItems(products, apoc.coll.randomItem(productsRange)) as products
            FOREACH (product in products | CREATE (product)<-[:BUY]-(i))`
        await session.run(queryBuilder, params);
    }
    await session.close();
}