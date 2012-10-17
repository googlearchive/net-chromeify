var net = module.exports;
var events = require('events');
var util = require('util');
var Buffer = require('buffer').Buffer;


net.createServer = function(options, connectionListener) {};
net.connect = net.createConnection = function() { 
  var options = {};
  var args = arguments;
  if(typeof args[0] === 'object') {
    options.port = args[0];
    options.host = "127.0.0.1";
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
  
  var socket = new net.Socket(options, cb);

  socket.connect(options, cb);
  
  return socket;
};

net.Server = function() {
  var _maxConnections = 0;
  this.__defineGetter__("maxConnections", function() { return _maxConnections; });
  
  var _connections = 0;
  this.__defineGetter__("connections", function() { return _connections; });
};


net.Server.prototype.listen = function() {};
net.Server.prototype.close = function() {};
net.Server.prototype.address = function() {};

net.Socket = function(options) {
  var self = this;
  options = options || {};
  this._fd = options.fd;
  this._type = options.type;
  //assert(this._type === "tcp6", "Only tcp4 is allowed");
  //assert(this._type === "unix", "Only tcp4 is allowed");
  this._type = allowHalfOpen = options.allowHalfOpen;
  this._socketInfo = 0;
  this._encoding;
  
  chrome.socket.create("tcp", {}, function(createInfo) {
    self._socketInfo = createInfo; 
  });
};

util.inherits(net.Socket, events.EventEmitter);

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
    options = args[0];
    options.host = options.host || "127.0.0.1";
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
      // Need to kick off the read.
      chrome.socket.read(self._socketInfo.socketId, function(readInfo) {
        var data = readInfo.data;
        // convert into a buffer
        self.emit('data', data);
      });
    } 
    else {
      self.emit('error', new Error("Unable to connect"));
    }
  });
};

net.Socket.prototype.destroy = function() {
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

net.Socket.prototype.write = function(data, arg1, arg2) {};
net.Socket.prototype.ref = function() {};
net.Socket.prototype.unref = function() {};
net.Socket.prototype.pause = function() {};
net.Socket.prototype.resume = function() {};
net.Socket.prototype.end = function() {};


Object.defineProperty(net.Socket.prototype, 'readyState', {
  get: function() {}
});

Object.defineProperty(net.Socket.prototype, 'bufferSize', {
  get: function() {}
});
