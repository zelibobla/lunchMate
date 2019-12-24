const db = require('../services/dbService.js');

module.exports = {
  async parseRouteAndData(event) {
    let rawData = {};
    let data = {};
    let route = '/undefined';
    let user;
    if (event.resources && event.resources[0] && event.resources[0].indexOf('regular_check') !== -1) {
      route = '/process_invitations';
      console.log('Route defined', route);
      return { route, data };
    }
    if (!event.body) {
      console.log('Route defined', route);
      return { route, data };
    }
    try {
      rawData = JSON.parse(event.body);
    } catch (error) {
      console.log('Telegram hook parsing error:', error);
    }
    const userId = rawData.message
      ? rawData.message.from.id
      : rawData.callback_query.from.id;
    if (userId) {
      user = await db.get('id', userId, 'users');
    }
    if (rawData.message &&
      rawData.message.text &&
      rawData.message.text[0] !== '/') {
      if (user) {
        route = user.state.route;
      }
      data = rawData;
    } else {
      if (rawData.message) {
        data = rawData;
        route = rawData.message.contact ? '/start' : rawData.message.text;
      } else if (rawData.callback_query && rawData.callback_query.data) {
        const parts = rawData.callback_query.data.split('?');
        route = parts[0];
        data = rawData.callback_query;
        if (parts[1]) {
          data.query_params = parts[1].split('&').reduce((memo, element) => {
            const [paramName, paramValue] = element.split('=');
            memo[paramName] = decodeURIComponent(paramValue);
            return memo;
          }, {});
        }
      }
      if (user && user.state) {
        delete user.state.route;
        await db.upsert(user.id, user, 'users');
      }
    }
    console.log('Route defined', route);
    data.user = user;
    return { route, data };
  }
}
