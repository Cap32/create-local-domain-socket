
import createLocalDomainSocket, { ensureLocalDomainPath } from '../src';
import { resolve } from 'path';
import net from 'net';
import { writeFileSync, existsSync } from 'fs';
import rimraf from 'rimraf';
import http from 'http';
import WebSocket from 'ws';

describe('ensureLocalDomainPath', () => {
	const { platform } = process;

	afterEach(() => {
		process.platform = platform;
	});

	test('should throw error if path is not a string', () => {
		expect(ensureLocalDomainPath).toThrow();
	});

	test('should convert to windows named pipe path on win', () => {
		process.platform = 'win32';
		const path = ensureLocalDomainPath('/test');
		expect(path).toBe('\\\\.\\pipe\\test');
	});

	test('should not convert to windows named pipe path on darwin', () => {
		process.platform = 'darwin';
		const path = ensureLocalDomainPath('/test');
		expect(path).toBe('/test');
	});
});

describe('createLocalDomainSocket', () => {
	const servers = new Set();
	const clients = new Set();

	const createServer = () => {
		const server = net.createServer();
		servers.add(server);
		return server;
	};

	const createClient = (path) => {
		return new Promise((resolve, reject) => {
			const client = new net.Socket();
			client.on('error', reject);
			client.connect({ path }, () => resolve(client));
			clients.add(client);
		});
	};

	const path = ensureLocalDomainPath(resolve(__dirname, 'tmp.sock'));

	afterEach(async () => {
		clients.forEach((client) => client.destroy());
		for (const server of servers) {
			await new Promise((resolve) => server.close(resolve));
		}
		servers.clear();
		clients.clear();
		rimraf.sync(path);
	});

	test('connect', async () => {
		const server = createServer();
		await createLocalDomainSocket(server, path);
		await createClient(path);
	});

	test('two connections', async () => {
		const server = createServer();
		await createLocalDomainSocket(server, path);
		await createClient(path);
		await createClient(path);
	});

	test('re-connect', async () => {
		const server1 = createServer();
		await createLocalDomainSocket(server1, path);
		const client = await createClient(path);
		client.destroy();
		await new Promise((resolve) => server1.close(resolve));
		const server2 = createServer();
		await createLocalDomainSocket(server2, path);
		await createClient(path);
	});

	test('should throw EADDRINUSE error if in use', async () => {
		const server1 = createServer();
		await createLocalDomainSocket(server1, path);
		await createClient(path);
		const server2 = createServer();
		await expect(createLocalDomainSocket(server2, path)).rejects.toMatchObject({
			message: 'listen EADDRINUSE',
		});
	});

	if (process.platform !== 'win32') {
		test('should not throw error if path is already exist and not empty', async () => {
			writeFileSync(path, 'test');
			const server = createServer();
			const listenToServer = createLocalDomainSocket(server, path);
			await expect(listenToServer).rejects.toBeDefined();
		});

		test('should not throw EADDRINUSE if there is an empty file', async () => {
			writeFileSync(path, '');
			const server = createServer();
			await createLocalDomainSocket(server, path);
			await createClient(path);
		});

		test('should socket file exists', async () => {
			const server = createServer();
			await createLocalDomainSocket(server, path);
			expect(existsSync(path)).toBe(true);
			await createClient(path);
		});
	}
});

describe('integrate with ws', () => {
	const path = ensureLocalDomainPath(resolve(__dirname, 'tmp.sock'));

	let ws;
	let wss;
	let server;

	afterEach((done) => {
		server && server.close();
		ws && ws.terminate();
		wss ? wss.close(done) : done();
	});

	test('connect with ws', (done) => {
		server = http.createServer((req, res) => {
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
				wss = new WebSocket.Server({ server });
				ws = new WebSocket(`ws+unix://${path}`);
				wss.on('error', done.fail);
				ws.on('error', done.fail);
				ws.on('message', (message) => {
					expect(message).toBe('hello');
					done();
				});
				wss.on('connection', (client) => {
					client.send('hello');
				});
			}
		});
	});
});
