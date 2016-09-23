var express = require('express');
var service = require('../redisService')();
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'URL Shortener' });
});

router.post('/', function(req, res, next) {
  var url = req.body.url;
  service.shortenUrl(url, function(url){
    res.send({status: "success", redirect: "/url?url=" + url});
  });

});


module.exports = router;
