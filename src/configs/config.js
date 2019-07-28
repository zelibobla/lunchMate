const telegramApiKey = require('./telegram.secret.js');
module.exports = {
  defaults: {
    delay: 5, //minutes
    timeout: 1, //minutes
  },
  telegram: {
    url: `https://api.telegram.org/bot${telegramApiKey}`,
  }
};
