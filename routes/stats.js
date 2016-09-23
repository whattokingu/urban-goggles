
var express = require('express');
var router = express.Router();
var service = require("../redisService")();

router.get('/', function(req, res, next) {
  res.render("This page does not exist");
});

router.get('/*', function(req,res,next){
  var shortUrl = req.path.substring(1);
  service.getCounters(shortUrl, function(counters){
    if(counters !== null){
      counters.url = req.protocol + "://" + req.hostname + "/u/"+ shortUrl;
      res.render('stats', counters);
    }else{
      res.render('error', {error: {status: 'There is no redirect url associated with this shortened url.'}});
    }
  })
});


module.exports = router;
