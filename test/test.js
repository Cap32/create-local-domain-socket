
import createLocalDomainSocket, { ensureLocalDomainPath } from '../src';
import { resolve } from 'path';
import net from 'net';
import { writeFileSync, existsSync } from 'fs';

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
		client.connect({ path }, resolve);
		clients.add(client);
	});
};

const path = ensureLocalDomainPath(resolve(__dirname, 'tmp.sock'));

afterEach(() => {
	servers.forEach((server) => server.close());
	clients.forEach((client) => client.destroy());
	servers.clear();
	clients.clear();
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
	await createClient(path);
	server1.close();
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
