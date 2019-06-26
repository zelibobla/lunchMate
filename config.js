const telegramApiKey = require('./telegram.secret.js');
module.exports = {
  telegram: {
    url: `https://api.telegram.org/bot${telegramApiKey}`,
  }
};
