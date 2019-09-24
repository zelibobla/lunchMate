const db = require('../services/dbService.js');
const UserInputError = require('../errors/userInputError.js');

module.exports = {
  defineUser: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    if (output.user) {
      return output;
    }
    const { username } = output.message.from;
    const user = await db.get('username', username, 'users');
    if (!user && message) {
      throw new UserInputError(message);
    }
    output.user = user;
    return output;
  },
  defineUserFromQuery: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    if (!output.query_params ||
      !output.query_params.username) {
      throw new UserInputError(message);
    }
    const user = await db.get('username', input.query_params.username, 'users');
    if (!user) {
      throw new UserInputError(message);
    }
    output.queryUser = user;
    return output;
  },
  defineUserFromTyped: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    const term = output.message.text.replace(/^@/, '').toLowerCase();
    output.mate = await db.get('username', term, 'users');
    if (!output.mate) {
      throw new UserInputError(message);
    }
    return output;
  },
  ifBot: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    if (input.message.from.is_bot) {
      throw new UserInputError(message);
    }
    return output;
  },
  ifNoUsername: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    if (!input.message.from.username) {
      throw new UserInputError(message);
    }
    return output;
  }
}
