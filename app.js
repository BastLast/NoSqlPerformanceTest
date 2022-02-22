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

const createNoSQL = async function () {
    let pre_query = new Date().getTime();
    const session = driver.session();
    let users = [];
    let products = [];
    let queryBuilderConstraintProduct = `CREATE CONSTRAINT productConstraint ON (p: Product) ASSERT p.id IS UNIQUE `;
    const params = {};
    await session.run(queryBuilderConstraintProduct, params);
    let queryBuilderConstraintUser = `CREATE CONSTRAINT userConstraint ON (pers: Person) ASSERT pers.id IS UNIQUE `;
    await session.run(queryBuilderConstraintUser, params);
    for (let j = 0; j < 10000; j++) {
        let refProd = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
        products.push(refProd);
        let queryBuilderProduct = `CREATE (p: Product {id: ` + j + `, reference: \"` + refProd + `\"})`;
        const params = {};
        await session.run(queryBuilderProduct, params);
        //console.log("nombre de produit inséré : " + j);
    }
    let transaction;
    let nbrInsert = 4000;
    let pre_query2 = new Date().getTime();
    transaction = session.beginTransaction();
    for (let i = 0; i < nbrInsert; i++) {
        if (i % 1000 == 0) {
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
            `CREATE (p: Person {id: ` + i + `, firstName: \"` + user.firstName + `\" ,lastName: \"` + user.firstName + `\"}) `;
        //let nbrBuy = Math.floor(Math.random() * (5 - 0 + 1)) + 0;
        let nbrBuy = 5;
        let nbrFollower = 20;
        //let nbrFollower = Math.floor(Math.random() * (20 - 0 + 1)) + 0;
        for (let h = 0; h < nbrBuy; h++) {
            let randNumber = Math.floor(Math.random() * (9999 - 0 + 1)) + 0;
            queryBuilder = queryBuilder + `WITH p as p MATCH (product` + h + `) WHERE product` + h + `.id = ` + randNumber + ` CREATE (p)-[:BUY]->(product` + h + `) `;
            if (h == nbrBuy - 1 && nbrFollower > 0 && users.length > 20)
                queryBuilder = queryBuilder + `WITH p as p `;
        }
        for (let n = 0; n < nbrFollower; n++) {
            console.log("n: " + n);
            if (users.length > 20) {
                let randNumber2 = Math.floor(Math.random() * (users.length - 0 + 1)) + 0;
                if (n == (nbrFollower - 1))
                    queryBuilder = queryBuilder + `MATCH (follower` + n + `) WHERE follower` + n + `.id = ` + randNumber2 + ` CREATE (p)<-[:FOLLOW]-(follower` + n + `) `;
                else
                    queryBuilder = queryBuilder + `MATCH (follower` + n + `) WHERE follower` + n + `.id = ` + randNumber2 + ` CREATE (p)<-[:FOLLOW]-(follower` + n + `) WITH follower` + n + ` as follower` + n + `, p as p `;
            }
        }
        const params = {};
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