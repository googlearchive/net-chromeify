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

var net = module.exports;
var events = require('events');
var util = require('util');
var Stream = require('stream');
var Buffer = require('buffer').Buffer;

var stringToArrayBuffer = function(str) {
  var buffer = new ArrayBuffer(str.length);
  var uint8Array = new Uint8Array(buffer);
  for(var i = 0; i < str.length; i++) {
    uint8Array[i] = str.charCodeAt(i);
  }
  return buffer;
};

var bufferToArrayBuffer = function(buffer) {
  return stringToArrayBuffer(buf.toString())
};

var arrayBufferToBuffer = function(arrayBuffer) {
  var buffer = new Buffer(arrayBuffer.byteLength);
  var uint8Array = new Uint8Array(arrayBuffer);
  for(var i = 0; i < uint8Array.length; i++) {
    buffer.writeUInt8(uint8Array[i], i);
  }
  return buffer;
};

net.createServer = function() {
  var options = {
  };
  var args = arguments;

  var cb = args[args.length -1];
  cb = (typeof cb === 'function') ? cb : function() {};

  if(typeof args[0] === 'object') {
    options = args[0];
  }
 
  var server = new net.Server(options);
  server.on("connection", cb);
  return server;
};

net.connect = net.createConnection = function() { 
  var options = {};
  var args = arguments;
  if(typeof args[0] === 'object') {
    options.port = args[0].port;
    options.host = args[0].host || "127.0.0.1";
  }
  else if(typeof args[0] === 'number') {
    // there is a port
    options.port = args[0];
    if(typeof args[1] === 'string') {
      options.host = args[1];
    }
  }
  else if(typeof args[0] === 'string') {
    return; // can't do this.
  }

  var cb = args[args.length -1];
  cb = (typeof cb === 'function') ? cb : function() {};
  
  var socket = new net.Socket(options, function() { 
    socket.connect(options, cb);
  });
  
  return socket;
};

net.Server = function() {
  var _maxConnections = 0;
  this.__defineGetter__("maxConnections", function() { return _maxConnections; });
  
  var _connections = 0;
  this.__defineGetter__("connections", function() { return _connections; });

  events.EventEmitter.call(this);
};

util.inherits(net.Server, events.EventEmitter);

net.Server.prototype.listen = function() {
  var self = this;
  var options = {};
  var args = arguments;
  
  if (typeof args[0] === 'number') {
    // assume port. and host.
    options.port = args[0];
    options.host = "127.0.0.1";
    options.backlog = 511;
    if(typeof args[1] === 'string') {
      options.host = args[1];
    }
    else if(typeof args[1] === 'number') {
      options.backlog = args[1];
    }
    
    if(typeof args[2] === 'number') {
      options.backlog = args[2];
    }
  }
  else {
    // throw.
  }

  this._serverSocket = new net.Socket(options);
  
  var cb = args[args.length -1];
  cb = (typeof cb === 'function') ? cb : function() {};
  
  self.on('listening', cb);

  self._serverSocket.on("_created", function() {
    // Socket created, now turn it into a server socket.
    chrome.socket.listen(self._serverSocket._socketInfo.socketId, options.host, options.port, options.backlog, function() {
      self.emit('listening');
      chrome.socket.accept(self._serverSocket._socketInfo.socketId, self._accept.bind(self))
    }); 
  });
};

net.Server.prototype._accept = function(acceptInfo) {
  // Create a new socket for the handle the response.
  var self = this;
  var socket = new net.Socket();
  
  socket._socketInfo = acceptInfo;
  self.emit("connection", socket);
  chrome.socket.accept(self._serverSocket._socketInfo.socketId, self._accept.bind(self))
};

net.Server.prototype.close = function(callback) {
  self.on("close", callback || function() {});
  self._serverSocket.destroy();
  self.emit("close");
};
net.Server.prototype.address = function() {};

net.Socket = function(options) {
  var self = this;
  options = options || {};
  this._fd = options.fd;
  this._type = options.type || "tcp";
  //assert(this._type === "tcp6", "Only tcp4 is allowed");
  //assert(this._type === "unix", "Only tcp4 is allowed");
  this._type = allowHalfOpen = options.allowHalfOpen || false;
  this._socketInfo = 0;
  this._encoding;
  
  chrome.socket.create("tcp", {}, function(createInfo) {
    self._socketInfo = createInfo;
    self.emit("_created"); // This event doesn't exist in the API, it is here because Chrome is async 
    // start trying to read
    self._read();
  });
};

util.inherits(net.Socket, Stream);

/*
  Events:
    close
    connect
    data
    drain
    end
    error
    timeout
*/

/*
  Methods
*/

net.Socket.prototype.connect = function() {
  var self = this;
  var options = {};
  var args = arguments;
  
  if(typeof args[0] === 'object') {
    // we have an options object.
    options.port = args[0].port;
    options.host = args[0].host || "127.0.0.1";
  } 
  else if (typeof args[0] === 'string') {
    // throw an error, we can't do named pipes.
  }
  else if (typeof args[0] === 'number') {
    // assume port. and host.
    options.port = args[0];
    options.host = "127.0.0.1";
    if(typeof args[1] === 'string') {
      options.host = args[1];
    }
  }

  var cb = args[args.length -1];
  cb = (typeof cb === 'function') ? cb : function() {};
  self.on('connect', cb);
  
  chrome.socket.connect(self._socketInfo.socketId, options.host, options.port, function(result) {
    if(result == 0) {
      self.emit('connect');
    } 
    else {
      self.emit('error', new Error("Unable to connect"));
    }
  });
};

net.Socket.prototype.destroy = function() {
  chrome.socket.disconnect(this._socketInfo.socketId);
  chrome.socket.destroy(this._socketInfo.socketId);
};
net.Socket.prototype.destroySoon = function() {};
net.Socket.prototype.setEncoding = function(encoding) {
  this._encoding = encoding;
};

net.Socket.prototype.setNoDelay = function(noDelay) {
  noDelay = (noDelay === undefined) ? true : noDelay;
  chrome.socket.setNoDely(self._socketInfo.socketId, noDelay, function() {});
};

net.Socket.prototype.setKeepAlive = function(enable, delay) {
  enable = (enable === 'undefined') ? false : enable;
  delay = (delay === 'undefined') ? 0 : delay;
  chrome.socket.setKeepAlive(self._socketInfo.socketId, enable, initialDelay, function() {});
};

net.Socket.prototype._read = function() {
  var self = this;
  chrome.socket.read(self._socketInfo.socketId, function(readInfo) {
    if(readInfo.resultCode < 0) return; 
    // ArrayBuffer to Buffer if no encoding.
    var buffer = arrayBufferToBuffer(readInfo.data);
    self.emit('data', buffer);
  });

  // enque another read soon. TODO: Is there are better way to controll speed.
  self._readTimer = setTimeout(self._read.bind(self), 100);
}

net.Socket.prototype.write = function(data, encoding, callback) {
  var buffer;
  var self = this;
  
  encoding = encoding || "UTF8";
  callback = callback || function() {};

  if(typeof data === 'string') {
    buffer = stringToArrayBuffer(data);
  }
  else if(data instanceof Buffer) {
    buffer = bufferToArrayBuffer(data);
  }
  else {
    // throw an error because we can't do anything.
  }

  self._resetTimeout();

  chrome.socket.write(self._socketInfo.socketId, buffer, function(writeInfo) {
    callback(); 
  });

  return true;
};

net.Socket.prototype._resetTimeout = function() {
  var self = this;
  if(!!self._timeout == false) clearTimeout(self._timeout);
  if(!!self._timeoutValue) self._timeout = setTimeout(function() { self.emit('timeout') }, self._timeoutValue);
};

net.Socket.prototype.setTimeout = function(timeout, callback) {
  this._timeoutValue = timeout;
  this._resetTimeout();
};

net.Socket.prototype.ref = function() {};
net.Socket.prototype.unref = function() {};
net.Socket.prototype.pause = function() {};
net.Socket.prototype.resume = function() {};
net.Socket.prototype.end = function() {

};


Object.defineProperty(net.Socket.prototype, 'readyState', {
  get: function() {}
});

Object.defineProperty(net.Socket.prototype, 'bufferSize', {
  get: function() {}
});
