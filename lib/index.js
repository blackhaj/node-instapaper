const assert = require('assert');
const lodash = require('lodash');
const { OAuth } = require('mashape-oauth');
const request = require('request');
const logger = require('winston');
const qs = require('querystring');
const { Promise } = require('bluebird');
const Bookmarks = require('./bookmarks');
const Folders = require('./folders');

const errors = require('./errors');

Promise.longStackTraces();

const DEFAULTS = {
  apiUrl: 'https://www.instapaper.com/api/1',
  logLevel: 'info',
};

const Instapaper = function Instapaper(consumerKey, consumerSecret, opts) {
  if (!(this instanceof Instapaper)) {
    return new Instapaper(consumerKey, consumerSecret, opts);
  }
  assert(consumerKey, 'missing consumerKey');
  assert(consumerSecret, 'missing consumerSecret');

  this.consumerKey = consumerKey;
  this.consumerSecret = consumerSecret;

  // Merge options with defaults
  this.opts = lodash.merge({}, DEFAULTS, opts);

  // Create a request instance with the proper defaults.
  this.req = request.defaults({
    pool: { maxSockets: this.opts.poolSize },
    timeout: this.opts.timeout,
    headers: {},
  });

  // Attach Bookmarks and Folders classes.
  this.bookmarks = new Bookmarks(this);
  this.folders = new Folders(this);

  // Set log level
  logger.level = this.opts.logLevel;
  logger.debug('initialized');
};

Instapaper.prototype.setUserCredentials = function (username, password) {
  this.username = username;
  this.password = password;
  return this;
};

Instapaper.prototype.setOAuthCredentials = function (token, secret) {
  this.oauth = { token: token, secret: secret };
  return this;
};

Instapaper.prototype.authenticate = function (callback) {
  // Create OAuth client?
  const oa = (this.oa =
    this.oa ||
    new OAuth({
      consumerKey: this.consumerKey,
      consumerSecret: this.consumerSecret,
      accessUrl: this.opts.apiUrl + '/oauth/access_token',
      signatureMethod: 'HMAC-SHA1',
    }));
  this.POST = Promise.promisify(oa.post, oa);

  const client = this;
  return new Promise(function (resolve, reject) {
    // If we already have access tokens, we're done.
    if (client.oauth) {
      return resolve(client.oauth);
    }

    // Get oauth access token.
    oa.getXAuthAccessToken(client.username, client.password, function (
      err,
      oauth_token,
      oauth_token_secret,
      res
    ) {
      if (err) return reject(err);
      if (!oauth_token || !oauth_token_secret) {
        err = new Error('Failed to get OAuth access token');
        err.res = res;
        return reject(err);
      }
      client.oauth = { token: oauth_token, secret: oauth_token_secret };
      return resolve(client.oauth);
    });
  }).nodeify(callback);
};

Instapaper.prototype.request = function (endpoint, body, callback) {
  if (body instanceof Function) {
    callback = body;
    body = {};
  }
  let opts = { body: qs.stringify(body || {}) };
  return this.authenticate()
    .bind(this)
    .then(function (oauth) {
      opts.oauth_token = oauth.token;
      opts.oauth_token_secret = oauth.secret;
      opts.url = this.opts.apiUrl + endpoint;

      logger.debug('making API request', opts);
      return this.POST(opts);
    })
    .spread(function (body, response) {
      if (response.headers['content-type'] === 'application/json') {
        return JSON.parse(body);
      }
      return body;
    })
    .catch(function (err) {
      try {
        let data = JSON.parse(err.data)[0];
        err = errors[data.error_code];
      } catch (_err) {
        err = errors[0];
      }
      throw new err();
    })
    .nodeify(callback);
};

Instapaper.prototype.verifyCredentials = function (callback) {
  return this.request('/account/verify_credentials')
    .then(function (result) {
      return Array.isArray(result) ? result[0] : result;
    })
    .nodeify(callback);
};

module.exports = Instapaper;
