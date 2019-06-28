module.exports = {
  help: 'Here is the list of available commands:\n/start\n/help\n/delete',
  start: name => `Hello ${name}! I've remembered you. Somebody now can find you ` +
    `in my database and add you into the invitations list, so you can be invited. Would you like to ` +
    `create your own list?`,
  undefined: 'Sorry, I don\'t get you. Type /help for the list of available commands',
  delete: name => `It\'s sad to delete you ${name}. But well, as you wish. Deleted`,
}