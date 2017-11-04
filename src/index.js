
import net from 'net';
import { remove } from 'fs-extra';

export default function createLocalDomainSocket(server, path, callback) {
	server.on('error', function handleServerError(err) {
		if (err.code === 'EADDRINUSE') {
			var clientSocket = new net.Socket();
			clientSocket.on('error', function handleClientError(err) {
				if (err.code === 'ECONNREFUSED') {
					remove(path, function handleRemoveError(err) {
						if (err) { callback(err); }
						else { server.listen(path, callback); }
					});
				}
			});

			clientSocket.connect({ path }, function clientConnect() {
				const error = new Error('listen EADDRINUSE');
				Object.assign(error, {
					errno: 'EADDRINUSE',
					code: 'EADDRINUSE',
					syscall: 'listen',
				});
				callback(error);
			});
		}
	});

	server.listen(path, callback);
}
