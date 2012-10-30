/*
   Copyright 2012 Google Inc

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

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


