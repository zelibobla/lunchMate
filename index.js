const router = require('./services/routerService.js');

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const { action, data } = router.detectAction(event.body);
  return await action(data);
};
