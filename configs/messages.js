module.exports = {
  help: 'Here is the list of available commands:\n/start\n/createList\n/add\n/remove\n/help\n/delete',
  start: name => `Hello ${name}! I've remembered you. Somebody now can find you ` +
    `in my database and add you into the invitations list, so you can be invited. Would you like to ` +
    `create your own list?`,
  createList: `Just type 'add <id>', where <id> is the username or phone of a telegram user you want to add into list`,
  dontCreateList: `No worries, just type /start when you'd like to create the list`,
  undefined: 'Sorry, I don\'t get you. Type /help for the list of available commands',
  delete: name => `It\'s sad to delete you ${name}. But well, as you wish. Deleted`,
}