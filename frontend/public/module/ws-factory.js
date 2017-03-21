/**
 * @fileOverview
 * WebSocket factory and utility wrapper.
 *
 * TODO(sym3tri):
 *    - disconnect/reconnect when tab loses/gains focus
 *    - support for default options.
 */
/* eslint-disable no-console */

const wsCache = {};

const HEARTBEAT_INTERVAL = 30000;
setInterval(() => {
  // proxy.go uses golang.org/x/net/websocket, which doesn't send pings: https://github.com/golang/go/issues/5958
  // That means if our connection is idle for > 60 seconds, we get disconnected.
  _.each(wsCache, (v) => {
    const ws = v.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    // k8s seems to disregard anything it doesn't understand. Yes, sending empty string sends data.
    v.ws.send('');
  });
}, HEARTBEAT_INTERVAL);

function validOptions(o) {
  if (!o.host) {
    console.error('missing required host argument');
    return false;
  }
  return true;
}

function createURL(host, path) {
  var url;

  if (host === 'auto') {
    if (location.protocol === 'https:') {
      url = 'wss://';
    } else {
      url = 'ws://';
    }
    url += location.host;
  } else {
    url = host;
  }

  if (path) {
    url += path;
  }
  return url;
}

function WebSocketWrapper(id, options, kluster) {
  var that = this,
      flushCanceler;

  this.id = id;
  this.options = options;
  this.url = createURL(options.host, options.path);
  this.kluster = kluster;
  this._paused = false;
  this._handlers = {
    open: [],
    close: [],
    error: [],
    message: [],
    destroy: [],
  };

  this._connect();

  if (this.options.bufferEnabled) {
    flushCanceler = setInterval(this.flushBuffer.bind(this), this.options.bufferFlushInterval);
  }

  // Array of cleanup functions that get called ondestroy.
  this._cleanupFns = [
    // Kill interval flusher.
    function() {
      if (flushCanceler) {
        clearInterval(flushCanceler);
      }
    },
    function () {
      clearTimeout(that._connectionAttempt);
    },
  ];
}

function expBackoff(prev, max) {
  if (!prev) {
    return 1000;
  }
  if (prev > max / 2) {
    return max;
  }
  return 2 * prev;
}

export const wsFactory = (id, options) => {
  // get by id
  if (!options) {
    return wsCache[id];
  }
  // websocket with id already exists
  if (wsCache[id]) {
    // TODO (ggreer): if id is the same but options differ, this could return the "wrong" web socket
    return wsCache[id];
  }
  // create new websocket
  if (validOptions(options)) {
    wsCache[id] = new WebSocketWrapper(id, options);
    return wsCache[id];
  }
};

wsFactory.destroy = function(id) {
  var ws = wsCache[id];
  if (!ws) {
    return;
  }
  ws.destroy();
};

wsFactory.destroyAll = function() {
  Object.keys(wsCache).forEach(wsFactory.destroy);
};

WebSocketWrapper.prototype._reconnect = function() {
  var delay = 2000,
      max = 30000,
      that = this;

  if (this._connectionAttempt) {
    return;
  }

  function attempt() {
    if (!that.options.reconnect || that._state === 'open') {
      clearTimeout(that._connectionAttempt);
      that._connectionAttempt = null;
      return;
    }
    that._connect();
    delay = expBackoff(delay, max);
    that._connectionAttempt = setTimeout(attempt, delay);
    console.log('attempting reconnect in', delay / 1000, 'seconds...');
  }
  this._connectionAttempt = setTimeout(attempt, delay);
};

WebSocketWrapper.prototype._connect = function() {
  var that = this;
  this._state = 'init';
  this._buffer = [];
  this.ws = new WebSocket(this.url);
  this.ws.onopen = function() {
    console.log('websocket open: ', that.id);
    that._state = 'open';
    that._triggerEvent({ type: 'open' });
    if (that._connectionAttempt) {
      clearTimeout(that._connectionAttempt);
      that._connectionAttempt = null;
    }
  };
  this.ws.onclose = function() {
    console.log('websocket closed: ', that.id);
    that._state = 'closed';
    that._triggerEvent({ type: 'close' });
    if (!that._connectionAttempt) {
      that._reconnect();
    }
  };
  this.ws.onerror = function(code, reason) {
    console.log('websocket error: ', that.id);
    that._state = 'error';
    that._triggerEvent({ type: 'error', args: [code, reason] });
  };
  this.ws.onmessage = function(e) {
    var msg = that.options.jsonParse ? JSON.parse(e.data) : e.data;
    that._state = 'open';
    that._triggerEvent({ type: 'message', args: [msg] });
  };
};

WebSocketWrapper.prototype._registerHandler = function(type, fn) {
  if (this._state === 'destroyed') {
    return;
  }
  this._handlers[type].push(fn);
};

// Addds an event to the buffer.
WebSocketWrapper.prototype._bufferEvent = function(evt) {
  this._buffer.unshift(evt);
  // If max is reached, remove oldest mevents.
  if (this.options.bufferMax) {
    while(this._buffer.length > this.options.bufferMax) {
      this._buffer.pop();
    }
  }
};

// Invoke all registered handler callbacks for a given event type.
WebSocketWrapper.prototype._invokeHandlers = function(evt) {
  var handlers = this._handlers[evt.type];
  if (!handlers) {
    return;
  }
  handlers.forEach(function(h) {
    h.apply(null, evt.args || []);
  });
};

// Triggers event to be buffered or invoked depending on config.
WebSocketWrapper.prototype._triggerEvent = function(evt) {
  if (this._state === 'destroyed') {
    return;
  }
  // Only bufer "message" events, so "error" and "close" etc can pass thru.
  if (this.options.bufferEnabled && evt.type === 'message') {
    this._bufferEvent(evt);
  } else {
    this._invokeHandlers(evt);
  }
};

WebSocketWrapper.prototype.onmessage = function(fn) {
  this._registerHandler('message', fn);
  return this;
};

WebSocketWrapper.prototype.onerror = function(fn) {
  this._registerHandler('error', fn);
  return this;
};

WebSocketWrapper.prototype.onopen = function(fn) {
  this._registerHandler('open', fn);
  return this;
};

WebSocketWrapper.prototype.onclose = function(fn) {
  this._registerHandler('close', fn);
  return this;
};

WebSocketWrapper.prototype.ondestroy = function(fn) {
  this._registerHandler('destroy', fn);
  return this;
};

WebSocketWrapper.prototype.flushBuffer = function() {
  if (this._paused) {
    return;
  }
  while (this._buffer.length) {
    this._invokeHandlers(this._buffer.shift());
  }
};

// Pausing prevents any buffer flushing until unpaused.
WebSocketWrapper.prototype.pause = function() {
  this._paused = true;
};

WebSocketWrapper.prototype.unpause = function() {
  this._paused = false;
  this.flushBuffer();
};

WebSocketWrapper.prototype.isPaused = function() {
  return this._paused;
};

WebSocketWrapper.prototype.state = function() {
  return this._state;
};

WebSocketWrapper.prototype.bufferSize = function() {
  return this._buffer.length;
};

WebSocketWrapper.prototype.destroy = function() {
  console.log('websocket destroy: ', this.id);
  if (this._state === 'destroyed') {
    return;
  }
  this.ws.close();
  this.ws.onopen = null;
  this.ws.onclose = null;
  this.ws.onerror = null;
  this.ws.onmessage = null;
  this._triggerEvent({ type: 'destroy' });
  this._state = 'destroyed';
  this._cleanupFns.forEach(function(fn) {
    fn();
  });
  delete wsCache[this.id];
  delete this.ws;
  delete this.options;
};
