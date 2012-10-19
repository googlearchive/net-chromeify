onload = function() {
  var result = document.getElementById("result");

  var net = require("net");
  var sys = require("sys");
  var url = require("url");

  result.innerText = "";
 
  var server = net.createServer(function(c) { //'connection' listener
    console.log('server connected');
    c.on('end', function() {
      console.log('server disconnected');
    });
    
    c.write('hello\r\n');
    c.pipe(c);
  });

  server.listen(8124, function() { //'listening' listener
    console.log('server bound');
  }); 
};


