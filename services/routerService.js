const actions = {
  '/start': require('../actions/startAction.js'),
  '/create_list': require('../actions/createListAction.js'),
  '/dont_create_list': require('../actions/dontCreateListAction.js'),
  '/help': require('../actions/helpAction.js'),
  '/undefined': require('../actions/undefinedAction.js')
};

module.exports = {
  detectAction(eventBody){
    let rawData = {};
    let data = {};
    let actionName = '/undefined';
    try {
      rawData = JSON.parse(eventBody);
    } catch (error) {
      console.log('Telegram hook parsing error:', error);
    }
    if (rawData.message) {
      actionName = rawData.message.text;
      data = rawData;
      if (!actions.hasOwnProperty(actionName)) {
        actionName = '/undefined';
      }
    } else if (rawData.callback_query) {
      actionName = rawData.callback_query.data;
      data = rawData.callback_query;
      if (!actions.hasOwnProperty(actionName)) {
        actionName = '/undefined';
      }
    }
    console.log('Action defined:', actionName);
    const action = actions[actionName];
    return { action, data };
  }
}
