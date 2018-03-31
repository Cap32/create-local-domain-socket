# create-local-domain-socket

[![Build Status](https://travis-ci.org/Cap32/create-local-domain-socket.svg?branch=master)](https://travis-ci.org/Cap32/create-local-domain-socket)
[![Build status](https://ci.appveyor.com/api/projects/status/g0wa7fu7n8fnpfc2/branch/master?svg=true)](https://ci.appveyor.com/project/Cap32/create-local-domain-socket/branch/master)
[![Coverage Status](https://coveralls.io/repos/github/Cap32/create-local-domain-socket/badge.svg?branch=master)](https://coveralls.io/github/Cap32/create-local-domain-socket?branch=master)
[![npm version](https://badge.fury.io/js/create-local-domain-socket.svg)](https://badge.fury.io/js/create-local-domain-socket)
[![License](https://img.shields.io/badge/license-MIT_License-brightgreen.svg?style=flat)](https://github.com/Cap32/create-local-domain-socket/blob/master/LICENSE.md)

A helper function to create cross-platform local domain sockets (UNIX domain sockets on UNIX, and named pipes polyfill on Windows).


## Usage

### createLocalDomainSocket

```js
import createLocalDomainSocket from 'create-local-domain-socket';
import http from 'http';

/* create a whatever you want server */
const server = http.createServer((req, res) => {
  const body = http.STATUS_CODES[426];
  res.writeHead(426, {
    'Content-Length': body.length,
    'Content-Type': 'text/plain'
  });
  res.end(body);
});

createLocalDomainSocket(server, '/tmp/test.sock', (err) => {
  if (err) { console.error(err); }
  else { console.log('socket server started'); }
});
```

If you prefer using promise:

```js
const server = http.createServer();
createLocalDomainSocket(server, '/tmp/test.sock')
  .then(() => console.log('socket server started'))
  .catch((err) => console.error(err))
;
```

#### Arguments

1. `server` \<Object\>: A server object. Should include a `.listen()` and `.on('error')` methods to start and catch errors
2. `path` \<String\>: Local domain path
3. `callback` \<Function\> (Optional): A callback function. The first argument is an `Error` object if listen failed. If `callback` is `undefined`, it will return a promise


### ensureLocalDomainPath

A tiny helper function to ensure local domain path. On Windows, it will convert to named pipe path instead of local domain path.

#### Example on Windows

```js
import { ensureLocalDomainPath } from 'create-local-domain-socket';

const path = ensureLocalDomainPath('/test');
console.log(path); /* "\\\\.\\pipe\\test" */
```

## Installation

```bash
npm install --save create-local-domain-socket
```

## Example to integrate with [ws](https://github.com/websockets/ws)

```js
import WebSocket from 'ws';
import createLocalDomainSocket from 'createLocalDomainSocket';
import http from 'http';

const server = http.createServer((req, res) => {
  const body = http.STATUS_CODES[426];
  res.writeHead(426, {
    'Content-Length': body.length,
    'Content-Type': 'text/plain'
  });
  res.end(body);
});

createLocalDomainSocket(server, path, (err) => {
  if (err) { done.fail(err); }
  else {
    const wss = new WebSocket.Server({ server });
    const ws = new WebSocket(`ws+unix://${path}`);
    ws.on('message', (message) => {
      /* do sth... */
    });
    wss.on('connection', (client) => {
      client.send('sth');
    });
  }
});
```

## License

MIT
