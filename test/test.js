var assert = require('assert');
var redis = require('redis');
var service = require('../redisService');
var fakeredis = require('fakeredis');
var sinon = require('sinon');

describe('redis service', function() {
  before(function(){
    sinon.stub(redis, 'createClient', fakeredis.createClient);
    client = redis.createClient();
    service = service(client);
  });
  after(function(){
    redis.createClient.restore();
  });
  afterEach(function(done){
    client.flushdb(function(err){
      done();
    })
  });

  it("should correctly shorten url without hash collision", function(done){
    service.shortenUrl("http://www.google.com", function(finalUrl){
      assert.equal("253d1", finalUrl);
      done();
    });
  });
  
  it("should correctly shorten url with hash collision", function(done){
    client.hmset('253d1', 'url', 'http://www.yahoo.com', function() {
      service.shortenUrl("http://www.google.com", function(finalUrl){
        assert.equal("253d14", finalUrl);
        done();
      });
    });
  });

  it('should correct shorten url with multiple hash collisions', function(done){
    client.hmset('253d1', 'url', 'http://yahoo.com', function(){
      client.hmset('253d14', 'url', 'http://bing.com', function(){
        service.shortenUrl("http://www.google.com", function(finalUrl){
          assert.equal('253d142', finalUrl);
          done();
        });
      });
    });
  });

  it('should get correct url given hash', function(done){
    client.hset('253d1', 'url', 'http://google.com', function(){
      service.getUrl('253d1', function(res){
        assert.equal(res, 'http://google.com');
        done();
      });
    });
  });

  it('should return null if url is not in redis', function(done){
    service.getUrl('253d1', function(res){
      assert.equal(null, res);
      done();
    });
  });
  
  it('should increment both counters for a new unique visit', function(done){
    client.hmset('253d1', 'url', "http://google.com", 'ucount', 100, 'tcount', 100, function(){
      service.logVisit('253d1', "123.123.123.123", function(){
        service.getCounters('253d1', function(res){
          assert.equal(101, res.ucount);
          assert.equal(101, res.tcount);
          done();
        });
      });
    });
  });

  it('should increment only total counter for a non-unique visit', function(done){
    client.hmset('253d1', 'url', "http://google.com", 'ucount', 100, 'tcount', 100, function(){
      client.sadd('253d1+ip','123.123.123.123', function(){
        service.logVisit('253d1', '123.123.123.123', function(){
          service.getCounters('253d1', function(res){
            assert.equal(100, res.ucount);
            assert.equal(101, res.tcount);
            done();
          });
        });
      });
    });
  })
});