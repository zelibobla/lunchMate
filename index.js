const actions = {
  '/start': require('./actions/startAction.js'),
  '/help': require('./actions/helpAction.js'),
  '/undefined': require('./actions/undefinedAction.js')
};

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const data = JSON.parse(event.body);
  let action = data.message.text;
  if (!actions.hasOwnProperty(action)){
    action = '/undefined';
  }
  console.log('Action defined:', action);
  const response = await actions[action](data);
  return response;
};
