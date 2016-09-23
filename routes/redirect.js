var express = require('express');
var router = express.Router();
var service = require("../redisService")();

router.get('/', function(req, res, next) {
  res.send("This page does not exist");
});

router.get(/\/*/, function(req, res, next){
  var shortUrl = req.path.substring(1);
  console.log(req.ip);
  service.getUrl(shortUrl, function(fullUrl){
    if(fullUrl !== null){
      service.logVisit(shortUrl, req.ip);
      res.redirect(fullUrl);
    }else{
      res.render('invalidUrl');
    }
  });
});


module.exports = router;
