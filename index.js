const router = require('./services/routerService.js');

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const { action, data } = router.detectAction(event);
  try {
    await action(data);
    return { statusCode: 200 };
  } catch (error) {
    console.log(error);
    return { statusCode: 200 };
  }
};
