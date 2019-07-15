const actions = {
  '/accept': require('../actions/acceptAction.js'),
  '/add': require('../actions/addAction.js'),
  '/create_template': require('../actions/createTemplateAction.js'),
  '/create_list': require('../actions/createListAction.js'),
  '/decline': require('../actions/declineAction.js'),
  '/dont_create_list': require('../actions/dontCreateListAction.js'),
  '/help': require('../actions/helpAction.js'),
  '/processInvitations': require('../actions/processInvitationsAction.js'),
  '/run': require('../actions/runAction.js'),
  '/start': require('../actions/startAction.js'),
  '/stop': require('../actions/stopAction.js'),
  '/undefined': require('../actions/undefinedAction.js')
};

module.exports = {
  detectAction(event){
    let rawData = {};
    let data = {};
    let actionName = '/undefined';
    let query_params;
    if (event.body) {
      try {
        rawData = JSON.parse(event.body);
      } catch (error) {
        console.log('Telegram hook parsing error:', error);
      }
      if (rawData.message) {
        [ actionName, query_params_raw ] = rawData.message.text.split(/\s(.+)/);
        query_params = query_params_raw ? query_params_raw.split(',') : [];
        data = rawData;
        if (!actions.hasOwnProperty(actionName)) {
          actionName = '/undefined';
        }
        data.query_params = query_params;
      } else if (rawData.callback_query && rawData.callback_query.data) {
        const parts = rawData.callback_query.data.split('?');
        actionName = parts[0];
        data = rawData.callback_query;
        data.query_params = parts[1].split('&').reduce((memo, element) => {
          const [paramName, paramValue] = element.split('=');
          memo[paramName] = paramValue;
          return memo;
        }, {});
        if (!actions.hasOwnProperty(actionName)) {
          actionName = '/undefined';
        }
      }
    } else if (event.resources && event.resources[0] && event.resources[0].indexOf('regular_check') !== -1) {
      actionName = '/processInvitations';
    }
    console.log('Action defined:', actionName);
    const action = actions[actionName];
    return { action, data };
  }
}
