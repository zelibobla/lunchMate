const db = require('../services/dbService.js');

module.exports = {
  defineUser: async (data) => {
    if (data.user) {
      return data;
    }
    const newData = {...data};
    const { username } = newData.message.from;
    const user = await db.get('username', username, 'users');
    newData.user = user;
    return newData;
  },
}
