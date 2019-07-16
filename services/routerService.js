module.exports = {
  parseRouteAndData(event){
    let rawData = {};
    let data = {};
    let route = '/undefined';
    let query_params;
    if (event.body) {
      try {
        rawData = JSON.parse(event.body);
      } catch (error) {
        console.log('Telegram hook parsing error:', error);
      }
      if (rawData.message) {
        [ route, query_params_raw ] = rawData.message.text.split(/\s(.+)/);
        query_params = query_params_raw ? query_params_raw.split(',') : [];
        data = rawData;
        data.query_params = query_params;
      } else if (rawData.callback_query && rawData.callback_query.data) {
        const parts = rawData.callback_query.data.split('?');
        route = parts[0];
        data = rawData.callback_query;
        if (parts[1]) {
          data.query_params = parts[1].split('&').reduce((memo, element) => {
            const [paramName, paramValue] = element.split('=');
            memo[paramName] = paramValue;
            return memo;
          }, {});
        }
      }
    } else if (event.resources && event.resources[0] && event.resources[0].indexOf('regular_check') !== -1) {
      route = '/process_invitations';
    }
    console.log('Route defined', route);
    return { route, data };
  }
}
