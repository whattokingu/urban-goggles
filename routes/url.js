var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  var urlPrepend = req.protocol + "://" + req.hostname ;
  res.render('result', {redirectUrl: urlPrepend+"/u/"+req.query.url, statsUrl: urlPrepend + "/s/" + req.query.url});
});


module.exports = router;
