const AWS = require('aws-sdk');

let documentClient = new AWS.DynamoDB.DocumentClient({ 'region': 'us-east-2' });
module.exports = {
  get(key, value, table) {
    if (!table) throw 'table needed';
    if (typeof key !== 'string') throw `key was not string and was ${JSON.stringify(key)} on table ${table}`;
    if (typeof value !== 'string') throw `value was not string and was ${JSON.stringify(value)} on table ${table}`;
    return new Promise((resolve, reject) => {
      let params = { TableName: table, Key: { [key]: value } };
      documentClient.get(params, function(err, data) {    
        if (err) {        
          console.log(`There was an error fetching the data for ${key} ${value} on table ${table}`, err);
          return reject(err);
        }
        return resolve(data.Item);
      });
    })
  },
  upsert(ID, data, table) {
    return new Promise((resolve, reject) => {
      if (typeof ID !== 'number') throw `the id must be a number and not ${ID}`;
      if (!data) throw "data is needed";
      if (!table) throw 'table name is needed';
      let params = { TableName: table, Item: { ...data, id: ID } };
      documentClient.put(params, function(err, result) {
        if (err) {
          console.log("Err in writeForCall writing messages to dynamo:", err);
          return reject(err);
        }
        return resolve({ ...result.Attributes, ...params.Item });
      });
    });
  },
  delete(ID, table) {
    return new Promise((resolve, reject) => {
      if (typeof ID !== 'number') throw `the id must be a number and not ${ID}`;
      if (!table) throw 'table name is needed';
      let params = { TableName: table, Item: { ...data, id: ID } };
      documentClient.delete(params, function(err, result) {
        if (err) {
          console.log("Err in writeForCall writing messages to dynamo:", err);
          return reject(err);
        }
        return resolve({ ...result.Attributes, ...params.Item });
      });
    });
  }
}
