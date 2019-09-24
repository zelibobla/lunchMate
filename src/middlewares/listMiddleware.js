const db = require('../services/dbService.js');
const UserInputError = require('../errors/userInputError.js');

module.exports = {
  normalizeUserLists: async (input) => {
    const output = JSON.parse(JSON.stringify(input));
    if (!output.user.lists) {
      output.user.lists = [{ name: 'default'}];
      await db.upsert(output.user.username, output.user, 'users');
    }
    return output;
  },
  defineListToAddMates: async (input) => {
    const output = JSON.parse(JSON.stringify(input));
    if (!output.user.lists) {
      output.user.lists = [{ name: 'default' }];
      output.list = output.user.lists[0];
    } else if (output.user.lists.length === 1) {
      output.list = output.user.lists[0];
    }
    return output;
  },
  defineListName: async (input) => {
    const output = JSON.parse(JSON.stringify(input));
    if (output.query_params && output.query_params.list_name){
      output.listName = output.query_params.list_name;
    } else {
      output.listName = output.message.text;
    }
    if (!output.user.lists) {
      output.user.lists = [];
    }
    return output;
  },
  defineListFromState: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    const { listName } = output.user.state;
    if (!listName) {
      throw new UserInputError(message);
    }
    output.list = output.user.lists.find(l => l.name === listName);
    if (!output.list) {
      throw new UserInputError(message);
    }
    return output;
  },
  findListByName: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    const name = output.message.text;
    output.list = output.user.lists.find(l => l.name.toLowerCase() === name.toLowerCase());
    if (!output.list) {
      throw new UserInputError(message);
    }
    return output;
  },
  ifListNameBusy: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    if (output.user.lists.find(l => l.name === output.listName)) {
      throw new UserInputError(message);
    }
    return output;
  },
  ifNoList: async (input, message) => {
    const output = JSON.parse(JSON.stringify(input));
    if (!output.user.lists || !output.user.lists.length) {
      throw new UserInputError(message);
    }
    return output;
  }
}
