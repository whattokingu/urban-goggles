var validate = function(url) {
  var re = /(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/;
  return url.match(re);
};

var sendUrl = function() {
  console.log("send URL");
  var url = $("#url-input").val();
  if (url.length == 0) {
    warnError("URL is empty.");
  } else {
    var urlRegex = /https?:\/\//;
    if (!url.match(urlRegex)) {
      url = 'http://' + url;
    }
    if (validate(url)) {
      console.log("valid");
      $.post('/', {url: url}).done(function(res){
        console.log(res);
        if(res.status == "success"){
          window.location.href=res.redirect;
        }
      })
    } else {
      warnError("URL is not valid.");
    }
  }
};
  
var warnError = function(msg) {
  $("#error-msg").text(msg);
  window.setTimeout(function(){
    $("#error-msg").text("");
  }, 3000);
};

