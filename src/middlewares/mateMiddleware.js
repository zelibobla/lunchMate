const UserInputError = require('../errors/userInputError.js');

module.exports = {
  defineListToAddMates: async (input) => {
    const output = JSON.parse(JSON.stringify(input));
    if (output.user.lists.length === 1) {
      output.list = output.user.lists[0];
    }
    return output;
  },
}
