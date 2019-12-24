const invitation = (username, invite) =>
  `${username} invites you to ${invite.eat_place} ` +
  `for a lunch. See you in the ${invite.meet_place} in ${invite.delay} minutes. ` +
  `You have ${invite.timeout} minutes to accept this invitation. Going?`;

const templateBrief = template => `${template.eat_place}, ${template.meet_place}, ${template.timeout} mins to think, ${template.delay} mins to reach`;

const displayLists = lists => Object.keys(lists).reduce((memo, key) => {
  memo += `${lists[key].name}: ${displayList(lists[key])}\n`;
  return memo;
}, '');

const displayList = list => list.mates.map(m => `${m.first_name} (${(m.username || m.phone)})` ).join(' -> ');

const displayTemplates = templates => Object.keys(templates).reduce((memo, key) => {
  memo += `${templates[key].name}: ${templateBrief(templates[key])}\n`;
  return memo;
}, '');

module.exports = {
  alreadyRunning: `I'm already working with your list. Just wait till I done, please, or type /stop.`,
  addUserChooseList: lists => `Choose the list, where to add a user, please:\n${displayLists(lists)}`,
  addUserListNotFound: (name, lists) => `List «${name}» not found. Type it again please:\n${displayLists(lists)}`,
  addUserToOneList: name => `You have one list «${name}». Will add user to it. Just type the username of a telegram ` +
    `user you want to add`,
  addUserToUndefinedList: `No list defined to add the user. Start again please`,
  addUserToList: name => `Well, the list is «${name}». Now type the username of a telegram ` +
    `user you want to add`,
  added: (name, list) => `${name} added into the «${list.name}» list.\n Now it looks as follows:\n${displayList(list)}\n` +
    `Type the next username or phone if you want to add more or click «run» to run the invitation`,
  askPhone: name => `${name}, without your phone others couldn't find you. Click the button «Show phone», please`,
  chooseList: `Please, click on the list to use for invitation`,
  chooseTemplate: `Please, click on the template to use for invitation or type /create_template`,
  chooseListToDelete: `Choose the list to delete, please:`,
  chooseTemplateToDelete: `Choose the template to delete, please:`,
  createList: `Type the name of the list, or skip for default name`,
  delete: name => `It\'s sad to delete you ${name}. But well, as you wish. Deleted`,
  deleteListTyped: name => `List «${name}» deleted`,
  dontCreateList: `No worries, just type /create_list when you'd like to create the list`,
  emptyList: name => `You have no list yet ${name}. Type /create_list first.`,
  help: 'Here is the list of available commands:\n/start\n/create_list\n/create_template\n/help\n/delete',
  invitePending: (username, mateUsername, invite) =>
    `Hi ${mateUsername}, aren't you hungry? ${invitation(username, invite)}`,
  invalidQueryParams: queryParams => `Provided query params are invalid ${JSON.stringify(queryParams)}`,
  invitationNotFound: `You reacted on the invitation, but it's already outdated, sorry. ` +
    `Reaction ignored`,
  listCreated: name => `The list «${name}» created. Now type the username or phone of a user you want to add into this list`,
  listDeleted: name => `The list «${name}» deleted`,
  listEnded: name => `Sorry ${name}, nobody accepted your invitation :(`,
  listNameNotFound: name => `Sorry, the list «${name}» not found`,
  listNotFound: name => `You reacted on the invitation, but you're not in the list of ${name}. ` +
    `Reaction ignored. Maybe this is because the invitation is outdated?`,
  listNameBusy: name => `Sorry, the name «${name}» is aleady exists in your lists`,
  mateNotFound: name => `Sorry, there is no ${name} in my database. Are you sure he found me ` +
    `and typed /start ?`,
  mateNotSpecified: name => `The mate should be specified in query string.`,
  nicknameNeeded: name => `Ooops, ${name}, I need your telegram name to go, but it's not defined. Open your ` +
    `settings in telegram and set up your nick, please. Come back after that please. I'm already missing.`,
  noListsToDelete: `You have no lists, nothing to delete`,
  noListsToShow: `You have no lists yet. Type /create_list`,
  noTemplates: `There is no any invitation template. Click «Create template» to create first template`,
  nothingToStop: `There was nothing to stop, no worries`,
  oneListShouldStay: `Only one list left, let's keep it`,
  oneTemplateShouldStay: `Only one template left, let's keep it`,
  registerFirst: `I don't find you in my DB. Did you type /start first?`,
  removed: name => `${name} removed from your list`,
  run: (name, invite) => `Great ${name}, I've started working with your list «${invite.list.name}»\n. ` +
    `The invitation will be as follows:\n«${invitation(name, invite)}»\n` +
    `Type /stop if you want to stop inviting.`,
  start: name => `Hello ${name}! I've remembered you. Somebody now can find you ` +
    `in my database and add you into the invitations list, so you can be invited. Would you like to ` +
    `create your own list?`,
  startExisting: name => `Hello ${name}! You're already in my memory. Type /help if you've got lost`,
  startFromBot: name => `Hello bot ${name}! We can't start working sorry. I'll see you in another ` +
    `life when we are both cats.`,
  showLists: displayLists,
  showTemplates: displayTemplates,
  stopped: `Ok. I've stopped the list`,
  typeTemplateName: `Type the template name, please`,
  typeEatPlace: `Where do you going for a lunch?`,
  typeMeetPlace: `Where do you going to meet a mate before going together?`,
  typeDelay: `How many minutes mate has to reach the meeting place?`,
  typeTimeout: `How many minutes the invitation waiting before considered as declined?`,
  templateBrief,
  templateCreated: (username, template) => `The template created. It will look like follows:\n${invitation(username, template)}` +
    `\nClick «Run» to start invite mates by list`,
  templateDeleted: name => `The template «${name}» deleted`,
  templateNameBusy: name => `Sorry, the name «${name}» is aleady exists in your templates`,
  templateNotFound: `Sorry, the template not found`,
  undefined: 'Sorry, I don\'t get you. Type /help for the list of available commands',
  yourInvitationAccepted: (name, mateName) => `${name}, your invitation is accepted by ${mateName}. Go!`,
  youAccepted: (name, mateName) => `Cool, ${mateName}! You accepted the invitation of ${name}. Go!`,
  youDeclined: (name, mateName) => `Thank you for not ignoring, ${mateName}! This helps ${name} to find mate faster.`,
}