var irc = require('irc');
var moment = require('moment');
var fs = require('fs');

var client = new irc.Client('chat.freenode.net', 'g4k_', {
    channels: ['#node.js', '#angularjs', '#testtesttest', '#hackerbeach' ],
});

var port = process.env.PORT || 5000;


var express = require('express');
var app = express();

var redis = require("redis");

var redisclient = redis.createClient(9732, "jack.redistogo.com");

var x = new Array();
var stamp;
var entry;
var printData;

if (true) {
  redisclient.auth(process.env.REDIS, function() {
    console.log('Redis client connected');
  });
}

function myDate(date1){
    return (moment(parseInt(date1)).format("YYYY-MM-DD HH:mm:ss"));
  };

function chatLine(stamp, from, message){
  return "<li><span class=time>" + stamp + "</span> <span class=from>" + from + ":</span> <span class=message>" + message + "</span></li>";
};


function content () {
  var resi = "<br>";
  for (var i = 0; i < x.length; i++){
     resi = resi + (x[i].to + " " + x[i].from + " "+ x[i].message + "<br>");
  }
  return resi;
}

redisclient.on("error", function (err) {
  console.log("Error " + err);
});

client.addListener('message', function (from, to, message) {
    var stamp = + new Date();
    
    console.log(moment(stamp).format("YYYY-MM-DD HH:mm:ss"));
    console.log(stamp + ' from:' + from + ' to:' + to + ' message:' + message);
    entry = JSON.stringify({from:from, message:message});
    
    if ( to.match(/#hackerbeach/) ) {
      redisclient.HMSET("#hackerbeach", stamp, entry, redis.print);
    }
 
});

client.addListener('pm', function (from, message) {
    console.log(from + ' => ME: ' + message);
});

client.addListener('error', function(message) {
    console.log('error: ', message);
});

app.use(express.favicon(path.join(__dirname, 'public/favicon.ico')));

app.get('/', function(req, res){
  var fullList="";
  var x,y;
  var home = fs.readFileSync('public/html/index.html', {"encoding":"utf8"});
  
  redisclient.hgetall("#hackerbeach", function (err, obj) {
    
    Object.keys(obj).sort().reverse().forEach(function(stamp){
      y = JSON.parse(obj[stamp]);
      y.message = y.message.replace(/</g, "");
      fullList += chatLine( myDate(stamp.toString()), y.from, y.message);
    });
    home = home.replace(/{{listElements}}/, fullList);
    res.setHeader('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(home);
    
  });
});

app.listen(port);
console.log('Listening on port ' + port);


