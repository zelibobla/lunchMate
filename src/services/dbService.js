const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient({ 'region': 'us-east-2' });

const get = (key, value, table) => {
  if (!table) throw 'table needed';
  return new Promise((resolve, reject) => {
    let params = { TableName: table, Key: { [key]: value } };
    let method = 'get';
    if (key !== 'id') {
      params['IndexName'] = `${key}-index`;
      params['KeyConditionExpression'] = `${key} = :val`;
      params['Select'] ='ALL_PROJECTED_ATTRIBUTES';
      params['ExpressionAttributeValues'] = { ':val' : value };
      delete params.Key;
      method = 'query';
    }
    documentClient[method](params, function(err, data) {    
      if (err) {
        console.log(`There was an error fetching the data for ${key} ${value} on table ${table}`, err);
        return reject(err);
      }
      const item = data.Items ? data.Items[0] : data.Item;
      return resolve(item);
    });
  })
}

const getAll = (params, table) => {
  if (!table) throw 'table needed';
  if (!params || typeof params.filterExpression === 'undefined' || params.expressionAttributes === 'undefined') {
    throw `params ${JSON.stringify(params)} are invalid`;
  }
  params.TableName = table;
  return new Promise((resolve, reject) => {
    documentClient.scan(params, function(err, data) {
      if (err) {
        console.log(`There was an error scanning the table ${table} with params ${JSON.stringify(params)}`, err);
        return reject(err);
      }
      return resolve(data.Items);
    });
  });
}

const upsert = (id, data, table, force = true) => {
  return new Promise((resolve, reject) => {
    if (typeof id !== 'number') return reject(`the id must be a number and not ${typeof id}`);
    if (!data) return reject('data is needed');
    if (!table) return reject('table name is needed');
    const forceUpsert = () => {
      const params = { TableName: table, Item: { ...data, id } };
      console.log('Force upsert:', params);
      documentClient.put(params, function(err, result) {
        if (err) {
          console.log("Err in writeForCall writing messages to dynamo:", err);
          return reject(err);
        }
        return resolve({ ...result.Attributes, ...params.Item });
      });
    }
    if (!force) {
      get('id', id, table).then(result => {
        if (result) {
          return resolve(result);
        } else {
          forceUpsert();
        }
      }).catch(e => {
        return reject(e);
      });
    } else {
      forceUpsert();
    }
  });
}

const del = (id, table) => {
  return new Promise((resolve, reject) => {
    if (typeof id !== 'number') throw `the id must be a number and not ${id}`;
    if (!table) throw 'table name is needed';
    let params = { TableName: table, Key: { id } };
    documentClient.delete(params, function(err, result) {
      if (err) {
        console.log("Err in writeForCall writing messages to dynamo:", err);
        return reject(err);
      }
      return resolve({ ...result.Attributes, ...params.Item });
    });
  });
}

module.exports = { get, getAll, upsert, delete: del };
