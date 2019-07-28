const https = require('https');
const config = require('../configs/config.js');

const toString = (value) => {
  const result = typeof value !== 'object' ? value + '' : JSON.stringify(value);
  return encodeURIComponent(result);
}

module.exports = {
  send(method, params) {
    const queryParams = Object.keys(params).reduce(
      (memo, key) => memo + `${key}=${toString(params[key])}&`,
      '',
    );
    return new Promise((resolve, reject) => {
      const url = `${config.telegram.url}/${method}?${queryParams}`;
      console.log('Telegram url requested:', url);
      https.get(url, function(result) {
        if (result.statusCode !== 200) {
          return reject(result);
        }
        return resolve(result);
      }).on('error', function(error) {
        return reject(error);
      });
    });
  },
}
