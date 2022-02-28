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
    let pre_query = new Date().getTime();
    const session = driver.session();
    const params = {
    };
    let users = [];
    let products = [];
    let queryBuilderConstraintProduct = `CREATE INDEX person_id_index IF NOT EXISTS FOR (p:Person) ON (p.id)`;
    queryBuilderConstraintProduct = `CREATE CONSTRAINT productConstraint ON (p: Product) ASSERT p.idProd IS UNIQUE `;
    await session.run(queryBuilderConstraintProduct, params);
    let queryBuilderConstraintUser = `CREATE CONSTRAINT userConstraint ON (pers: Person) ASSERT pers.idPers IS UNIQUE `;
    await session.run(queryBuilderConstraintUser, params);
    let nbrInsertProd = 100;
    for(let j=0; j<nbrInsertProd; j++){
        let prod = {};
        prod.refProd = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
        prod.idProd = j;
        products.push(prod);
        let queryBuilderProduct = `CREATE (p: Product {idProd: ` + prod.idProd + `, reference: \"`+ prod.refProd + `\"})`;
        const params = {
        };
        await session.run(queryBuilderProduct, params);
    }
    let transaction;
    let nbrInsert = 1000;
    transaction = session.beginTransaction();
    for(let i=0; i < nbrInsert; i++){
        if(i%1000==0){
            await transaction.commit();
            transaction = session.beginTransaction();
        }
        let user = {};
        user.idPers = i;
        user.firstName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
        user.lastName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 15);
        user.products = [];
        user.followers = [];
        users.push(user);
        let queryBuilder =
            `CREATE (p: Person {idPers: ` +  user.idPers + `, firstName: \"`+ user.firstName + `\" ,lastName: \"`+ user.firstName + `\"}) `;
        const params = {
        };
        await transaction.run(queryBuilder, params);
    }
    await transaction.commit();
    for(let h=0; h<users.length; h++){
        let nbrBuy = Math.floor(Math.random() * 6);
        for(let k=0; k<nbrBuy; k++){
            let product = Math.floor(Math.random() * nbrInsertProd);
            users[h].products.push(products[product].idProd);
        }
        let nbrFollowers = Math.floor(Math.random() * 21);
        for(let l=0; l<nbrFollowers; l++){
            let u = h;
            while(u == h){
                u = Math.floor(Math.random() * nbrInsert);
            }
            users[h].followers.push(users[u].idPers);
        }
    }
    for(let l=0; l<users.length; l++){
        transaction = session.beginTransaction();
        for(let m=0; m<users[l].followers.length; m++){
            let queryBuilder =
                `MATCH (p1:Person) WHERE p1.idPers=` + users[l].idPers +
                ` MATCH (p2:Person) WHERE p2.idPers=` + users[l].followers[m] +
                ` CREATE (p2)-[:FOLLOW]->(p1);`;
            const params = {
            };
            await transaction.run(queryBuilder, params);
        }
        await transaction.commit();
        transaction = session.beginTransaction();
        for(let n=0; n<users[l].products.length; n++){
            let queryBuilder = `MATCH (p1:Person) WHERE p1.idPers=` + users[l].idPers +
                                ` MATCH (p2:Product) WHERE p2.idProd=` + users[l].products[n] +
                                ` CREATE (p1)-[:BUY]->(p2);`;
            const params = {
            };
            await transaction.run(queryBuilder, params);
        }
        await transaction.commit();

    }
    /*if(users.length > 20){
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
    }*/
    let post_query = new Date().getTime();
    // calculate the duration in seconds
    let duration = (post_query - pre_query) / 1000;
    console.log(duration);
    await session.close();
}

module.exports = {
    requestNoSQL: requestNoSQL,
    createNoSQL: createNoSQL
}