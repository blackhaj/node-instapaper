/* eslint-disable func-names */
const Bookmarks = function Bookmarks(client) {
  this.client = client;
};

/* 
limit: Optional. A number between 1 and 500, default 25.
folder_id: Optional. Possible values are unread (default), starred, archive, or a folder_id value from /api/1.1/folders/list.
have: Optional. A concatenation of bookmark_id values that the client already has from the specified folder. See below.
highlights: Optional. A '-' delimited list of highlight IDs that the client already has from the specified bookmarks.
 */
Bookmarks.prototype.list = function (params, callback) {
  return this.client.request('/bookmarks/list', params, callback);
};

Bookmarks.prototype.delete = function (id, callback) {
  return this.client.request('/bookmarks/delete', { bookmark_id: id }, callback);
};

Bookmarks.prototype.star = function (id, callback) {
  return this.client.request('/bookmarks/star', { bookmark_id: id }, callback);
};

Bookmarks.prototype.unstar = function (id, callback) {
  return this.client.request('/bookmarks/unstar', { bookmark_id: id }, callback);
};

Bookmarks.prototype.archive = function (id, callback) {
  return this.client.request('/bookmarks/archive', { bookmark_id: id }, callback);
};

Bookmarks.prototype.unarchive = function (id, callback) {
  return this.client.request('/bookmarks/unarchive', { bookmark_id: id }, callback);
};

Bookmarks.prototype.getText = function (id, callback) {
  return this.client.request('/bookmarks/get_text', { bookmark_id: id }, callback);
};

/*
Bookmarks.prototype.move = function(id, folder, callback) {
};
*/
module.exports = Bookmarks;
