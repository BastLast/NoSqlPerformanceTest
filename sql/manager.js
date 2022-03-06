const mysql = require("mysql");

const connectionMYSQL = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tpbdd'
});

connectionMYSQL.connect((err) => {
    if (err) {
        throw err;
    }
});

const createSQL = async function () {

}

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

module.exports = {
    createSQL : createSQL(),
    requestMySQL: requestMySQL
}