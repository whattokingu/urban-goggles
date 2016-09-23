var redis = require("redis");
var SHA256 = require("crypto-js/sha256");

var DEFAULT_URL_LENGTH = 5;
var IP_SET_APPEND = "+ip";
module.exports = function(client) {
  if(this.service === undefined) {
    this.service = new service(client);
  }
  return this.service;
};


var shortenUrl = function(url, callback) {
  var urlHash = SHA256(url).toString();
  ensureNoHashCollisionAndUrlNotExist(this.client, urlHash, url, DEFAULT_URL_LENGTH, function(finalUrl, hasKey){
    if(!hasKey) {
      this.client.hmset(finalUrl, 'url', url, 'ucount', 0, 'tcount', 0);
    }
    callback(finalUrl);
  }.bind(this));

};

var ensureNoHashCollisionAndUrlNotExist = function(redis, urlHash, url, length, callback) {
  var shortenedHash = urlHash.substring(0, length);
  redis.hget(shortenedHash, 'url', function(err, res) {
    //check that either key do not exist, or that the key contains the same url
    if(res === null || res === url) {
      callback(shortenedHash, res === url);
    } else {
      ensureNoHashCollisionAndUrlNotExist(redis, urlHash, url, length + 1, callback);
    }
  });
};

var getUrl = function(shortUrl, callback) {
  this.client.hget(shortUrl, 'url', function(err, res){
    if(err != null){
      callback(null);
    } else {
      callback(res);
    }
  });
};

var incrementCounters = function(shortUrl, ip, callback){
  var urlCounter = shortUrl+IP_SET_APPEND;
  var redis = this.client;
  this.client.sismember(urlCounter, ip, function(err, notUnique){

    if(notUnique === 0) {
      redis.sadd(urlCounter, ip);
      redis.hmget(shortUrl, 'ucount', 'tcount', function(err,res){
        if(err === null) {
          redis.hmset(shortUrl, 'ucount', parseInt(res[0]) + 1, 'tcount', parseInt(res[1]) + 1, callback);
        }
      });
    }else{
      redis.hget(shortUrl, 'tcount', function(err, res){
        if(err === null){
          redis.hset(shortUrl, 'tcount', parseInt(res) + 1, callback);
        }
      });
    }
  });
};

var getCounters = function(key, callback){
  var client = this.client;
  client.hmget(key, 'ucount', 'tcount', function(err, res){
    if(err !== null || res[0] === null || res[1] === null) {
      callback(null);
    }else {
      callback({'ucount': parseInt(res[0]), 'tcount': parseInt(res[1])});
    }
  });
}

var service = function(client){
  if(client === null || client === undefined) {
    var client = redis.createClient();
    client.on("error", function (err) {
      console.log("Error " + err);
    });
    this.client = client;
  }else{
    this.client = client;
  }
  this.shortenUrl = shortenUrl.bind(this);
  this.getUrl = getUrl.bind(this);
  this.logVisit = incrementCounters.bind(this);
  this.getCounters = getCounters.bind(this);
};
