const invitation = (username, invite) =>
  `@${username} invites you to ${invite.eat_place} ` +
  `for a lunch. See you in the ${invite.meet_place} in ${invite.delay} minutes. ` +
  `You have ${invite.timeout} minutes to accept this invitation. Going?`;

const templateBrief = template => `${template.timeout} mins to think, ${template.delay} mins to get ` +
  `${template.meet_place}, going to ${template.eat_place}`;

const templateRules = `To create template type /create_template <meetPlace>,<eatPlace>,<delay>,<timeout>\n` +
`<meetPlace> is the place where you meet, ex. 1st floor near elevator\n` +
`<eatPlace> is the place where you invite to, ex. MarketPlace\n` +
`<delay> is how many minutes delay you waiting after the invitation accepted, ex. 5\n` +
`<timeout> is how many minutes can go after invitation sent and not replied to consider it's declined, ex. 1`;

module.exports = {
  alreadyRunning: `I'm already working with your list. Just wait till I done, please, or type /stop.`,
  createList: `Just type '/add <username>', where <username> is the username of a telegram ` +
    `user you want to add into list`,
  added: name => `${name} added into your list`,
  chooseTemplate: `Please, click on the template to use for invitation or type /create_template`,
  delete: name => `It\'s sad to delete you ${name}. But well, as you wish. Deleted`,
  dontCreateList: `No worries, just type /start when you'd like to create the list`,
  emptyList: name => `You have no list yet ${name}. Type /create_list first.`,
  invitePending: (username, mateUsername, invite) =>
    `Hi ${mateUsername}, aren't you hungry? ${invitation(username, invite)}`,
  help: 'Here is the list of available commands:\n/start\n/create_list\n/add\n/remove\n/help\n/delete',
  listEnded: name => `Sorry ${name}, nobody accepted your invitation :(`,
  invalidTemplate: `I can't recognize the template you provided\n${templateRules}`,
  invitationNotFound: `You reacted on the invitation, but it's already outdated, sorry. ` +
    `Reaction ignored`,
  listNotFound: name => `You reacted on the invitation, but you're not in the list of ${name}. ` +
    `Reaction ignored. Maybe this is because the invitation is outdated?`,
  mateNotFound: name => `Sorry, there is no ${name} in my database. Are you sure he found me ` +
    `and typed /start ?`,
  noTemplates: `There is no any invitation template.\n${templateRules}`,
  nothingToStop: `There was nothing to stop, no worries`,
  registerFirst: name => `Hey ${name}, I don't find you in my DB. Did you type /start first?`,
  removed: name => `${name} removed from your list`,
  run: (name, invite) => `Great ${name}, I've started working with your list. ` +
    `The invitation will be as follows:\n«${invitation(name, invite)}»\n` +
    `Type /stop if you want to stop inviting.`,
  start: name => `Hello ${name}! I've remembered you. Somebody now can find you ` +
    `in my database and add you into the invitations list, so you can be invited. Would you like to ` +
    `create your own list?`,
  startFromBot: name => `Hello bot ${name}! We can't start working sorry. I'll see you in another ` +
    `life when we are both cats.`,
  templateBrief,
  templateCreated: template => `The template created. It will look like follows:\n${invitation('Bob', template)}`,
  templateDeleted: template => `The template deleted: ${templateBrief(template)}`,
  templateNotFound: `The template not found`,
  stopped: `Ok. I've stopped the list`,
  undefined: 'Sorry, I don\'t get you. Type /help for the list of available commands',
  usernameUndefined: name => `Hello ${name}! We can't start working sorry. This is because you haven't ` +
    `set username in your telegram account settings. Thus people couldn't find you by this unique ` +
    `username. Add it please and return back.`,
  yourInvitationAccepted: (name, mateName) => `${name}, your invitation is accepted by @${mateName}. Go!`,
  youAccepted: (name, mateName) => `Cool, ${mateName}! You accepted the invitation of @${name}. Go!`,
  youDeclined: (name, mateName) => `Thank you for not ignoring, ${mateName}! This helps @${name} to find mate faster.`,
}