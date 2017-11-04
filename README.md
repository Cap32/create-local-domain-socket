# create-local-domain-socket

A helper function to create cross-platform local domain sockets (UNIX domain sockets on UNIX, and pipe sockets on Windows).


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
