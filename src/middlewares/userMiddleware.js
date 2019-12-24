const db = require('../services/dbService.js');
const UserInputError = require('../errors/userInputError.js');

module.exports = {
  defineUser: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    if (output.user) {
      return output;
    }
    const { id } = output.message.from;
    const user = await db.get('id', id, 'users');
    if (!user && message) {
      throw new UserInputError(message);
    }
    output.user = user;
    return output;
  },
  defineUserFromQuery: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    if (!output.query_params ||
      !output.query_params.id) {
      throw new UserInputError(message);
    }
    const user = await db.get('id', +input.query_params.id, 'users');
    if (!user) {
      throw new UserInputError(message);
    }
    output.queryUser = user;
    return output;
  },
  defineUserFromTyped: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    const usernameTerm = output.message.text.replace(/^@/, '').toLowerCase();
    const usernameMatch = await db.get('username', usernameTerm, 'users');
    const phoneTerm = output.message.text.replace(/[^\d]/, '').replace(/^8/, '7');
    const phoneMatch = await db.get('phone', phoneTerm, 'users');
    output.mate = usernameMatch || phoneMatch;
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
  }
}
