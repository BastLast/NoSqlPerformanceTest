const neo4j = require('neo4j-driver');

const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'root'), {
    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 2 * 60 * 1000, // 120 seconds
    disableLosslessIntegers: true
});

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
        const session = driver.session();
        const result = await session.run(statement, params);
        await session.close();
        return result;
    } catch (error) {
        throw error; // we are logging this error at the time of calling this method
    }
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
    const session = driver.session();
    const params = {
    };
    let users = [];
    let products = [];
    let nbrInsertProd = 10000;
    let allFollow = [];
    let allBuy = [];
    const nbRelationMax = 20;
    for(let j=0; j<nbrInsertProd; j++){
        let prod = {};
        prod.refProd = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
        prod.idProd = j;
        products.push(prod);
    }
    let productsMapped = products.map((product) => ({
        idProd: product.idProd, refProd: product.refProd
    }));
    let nbrInsert = 1000000;
    for(let i=0; i < nbrInsert; i++){
        let user = {};
        user.idPers = i;
        user.firstName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
        user.lastName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
        users.push(user);
    }
    let personsMapped = users.map((user) => ({
        idPers: user.idPers, firstname: user.firstName, lastname: user.lastName
    }));
    let pre_query = new Date().getTime();
    console.log("Debut insert product");
    await session.writeTransaction((tx) => {
        tx.run(
            'UNWIND $map AS map CREATE (p:Product) SET p = map',
            {
                map: productsMapped,
            }
        );
    });

    console.log("debut insert person");
    await session.writeTransaction((tx) => {
        tx.run(
            'UNWIND $map AS map CREATE (p:Person) SET p = map',
            {
                map: personsMapped,
            }
        );
    });
    let query = `MATCH (n:Person) RETURN count(n)`;
    let response = await session.run(query, {});
    let jsonObject = JSON.parse(JSON.stringify(response));
    const nbPersons = jsonObject['records'][0]["_fields"][0];

    query = 'MATCH (n:Product) RETURN count(n)';
    response = await session.run(query, {});
    jsonObject = JSON.parse(JSON.stringify(response));
    const nbProducts = jsonObject['records'][0]["_fields"][0];

    query = `MATCH (n:Person) RETURN min(id(n))`;
    response = await session.run(query, {});
    jsonObject = JSON.parse(JSON.stringify(response));
    const idMinPerson = jsonObject['records'][0]["_fields"][0];
    query = 'MATCH (n:Product) RETURN min(id(n))';
    response = await session.run(query, {});
    jsonObject = JSON.parse(JSON.stringify(response));
    const idMinProduct = jsonObject['records'][0]["_fields"][0];

    let followersList = [];
    let randomFollow;

    for (let i = 0; i < nbPersons; i++) {
        let randNbRelation = Math.floor(Math.random() * nbRelationMax);
        for (let j = 0; j < randNbRelation; j++) {
            do {
                randomFollow = Math.floor(Math.random() * nbPersons) + idMinPerson;
            } while (followersList.includes(randomFollow) || randomFollow === i + idMinPerson);

            followersList.push(randomFollow);
        }
        allFollow.push({
            userId: i + idMinPerson,
            followers: followersList
        })
        followersList = []
    }
    let buysList = [];
    let randomOrder;

    for (let i = 0; i < nbPersons; i++) {
        let numberOfOrder = Math.floor(Math.random() * 5);
        for (let j = 0; j < numberOfOrder; j++) {
            do {
                randomOrder = Math.floor(Math.random() * nbProducts) + idMinProduct;
            } while (buysList.includes(randomOrder) || randomOrder === i + nbProducts);

            buysList.push(randomOrder);
        }
        allBuy.push({
            userId: i + idMinPerson,
            buys: buysList
        });
        buysList = [];
    }
    console.log("debut buy");
    await session.writeTransaction((tx) => {
        tx.run(
            `UNWIND $buys as buys
           MATCH (p1:Person) WHERE ID(p1) = buys.userId
           UNWIND buys.buys as buy
           MATCH (p2:Product) WHERE ID(p2) = buy
           CREATE (p1)-[:BUY]->(p2)
           RETURN p1,p2`,
            {
                buys: allBuy
            });
    });
    console.log("debut follower");
    await session.writeTransaction((tx) => {
        tx.run(
            `UNWIND $follows as follows
         MATCH (p1:Person) WHERE ID(p1) = follows.userId
         UNWIND follows.followers as follower
         MATCH (p2:Person) WHERE ID(p2) = follower
         CREATE (p1)<-[:FOLLOW]-(p2)
         RETURN p1, p2`,
            {
                follows: allFollow
            });
    });

    let post_query = new Date().getTime();
    let duration = (post_query - pre_query) / 1000;
    console.log("Fin des insertions");
    console.log(duration);
    await session.close();
}

module.exports = {
    requestNoSQL: requestNoSQL,
    createNoSQL: createNoSQL
}