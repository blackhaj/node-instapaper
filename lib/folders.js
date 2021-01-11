/* eslint-disable func-names */
const Folders = function Folders(client) {
  this.client = client;
};

Folders.prototype.list = function (params, callback) {
  return this.client.request('/folders/list', params, callback);
};

Folders.prototype.add = function (title, callback) {
  return this.client.request('/folders/add', { title }, callback);
};

Folders.prototype.delete = function (id, callback) {
  return this.client.request('/folders/delete', { folder_id: id }, callback);
};

// Maybe add set order one day

module.exports = Folders;
