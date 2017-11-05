# create-local-domain-socket

[![Build Status](https://travis-ci.org/Cap32/create-local-domain-socket.svg?branch=master)](https://travis-ci.org/Cap32/create-local-domain-socket)
[![Build status](https://ci.appveyor.com/api/projects/status/g0wa7fu7n8fnpfc2/branch/master?svg=true)](https://ci.appveyor.com/project/Cap32/create-local-domain-socket/branch/master)
[![Coverage Status](https://coveralls.io/repos/github/Cap32/create-local-domain-socket/badge.svg?branch=master)](https://coveralls.io/github/Cap32/create-local-domain-socket?branch=master)
[![License](https://img.shields.io/badge/license-MIT_License-blue.svg?style=flat)](https://github.com/Cap32/create-local-domain-socket/blob/master/LICENSE.md)

A helper function to create cross-platform local domain sockets (UNIX domain sockets on UNIX, and named pipe sockets on Windows).


## Usage

```js
import createLocalDomainSocket from 'create-local-domain-socket';
import http from 'http';

const server = http.createServer((req, res) => {
  const body = http.STATUS_CODES[426];
  res.writeHead(426, {
    'Content-Length': body.length,
    'Content-Type': 'text/plain'
  });
  res.end(body);
});

createLocalDomainSocket(server, '/tmp/test.sock', () => {
  console.log('socket server started');
});
```


## License

MIT
