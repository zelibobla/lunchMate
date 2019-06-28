const https = require('https');
const config = require('../configs/config.js');

module.exports = {
  send(method, params) {
    const queryParams = Object.keys(params).reduce((memo, key) => memo + `${key}=${params[key]}&`, '');
    return new Promise((resolve, reject) => {
      https.get(`${config.telegram.url}/${method}?${queryParams}`, function(result) {
        return resolve(result);
      }).on('error', function(error) {
        return reject(error);
      });
    });
  },
}
