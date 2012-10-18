onload = function() {
  var go = document.getElementById("go");
  var urlEl = document.getElementById("url");
  var result = document.getElementById("result");

  go.onclick = function() {
    var net = require("net");
    var sys = require("sys");
    var url = require("url");

    var host = url.parse(urlEl.value);
    result.innerText = "";
  
    var opts = {
      port: parseInt(host.port), 
      host: host.hostname 
    };

    var client = net.createConnection(opts);
    client.setEncoding("utf8");
 
    client.on("connect", function() {
       var request = "GET " + host.path + " HTTP/1.1\n" +
                     "Host: " + host.host + "\n\n";
       client.write(request);
    });

    client.on('data', function(data) {
      result.innerText += data.toString();
    });
  }
};


