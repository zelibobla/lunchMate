module.exports = {
  alreadyRunning: `I'm already working with your list, just wait till I done, please`,
  createList: `Just type '/add <username>', where <username> is the username of a telegram user you want to add into list`,
  added: name => `${name} added into your list`,
  delete: name => `It\'s sad to delete you ${name}. But well, as you wish. Deleted`,
  dontCreateList: `No worries, just type /start when you'd like to create the list`,
  emptyList: name => `You have no list yet ${name}. Type /create_list first.`,
  invitePending: (username, mateUsername, invite) =>
    `Hi ${mateUsername}, aren't you hungry? ${username} invites you to ${invite.eatPlace} for lunch. See you in the ${invite.meetPlace} in ${invite.delay} minutes. ` +
    `You have ${invite.timeout} minutes to accept this invitation. Going?`,
  help: 'Here is the list of available commands:\n/start\n/createList\n/add\n/remove\n/help\n/delete',
  mateNotFound: name => `Sorry, there is no ${name} in my database. Are you sure he found me and typed /start ?`,
  registerFirst: name => `Hey ${name}, I don't find you in my DB. Did you type /start first?`,
  removed: name => `${name} removed from your list`,
  run: name => `Great ${name}, I've started working with your list. I'll be back...`,
  start: name => `Hello ${name}! I've remembered you. Somebody now can find you ` +
    `in my database and add you into the invitations list, so you can be invited. Would you like to ` +
    `create your own list?`,
  startFromBot: name => `Hello bot ${name}! We can't start working sorry. I'll see you in another life when we are both cats.`,
  undefined: 'Sorry, I don\'t get you. Type /help for the list of available commands',
  usernameUndefined: name => `Hello ${name}! We can't start working sorry. This is because you haven't set username in ` +
    `your telegram account settings. Thus people couldn't find you by this unique username. Add it please and ` +
    `return back.`,
}