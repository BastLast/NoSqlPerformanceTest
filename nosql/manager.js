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

module.exports = {
    requestNoSQL: requestNoSQL
}