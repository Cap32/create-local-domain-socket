
import net from 'net';
import { stat } from 'fs';
import rimraf from 'rimraf';
import callMaybe from 'call-me-maybe';

export function ensureLocalDomainPath(path) {
	if (typeof path !== 'string') { throw new Error('path must be string'); }

	if (process.platform === 'win32' && !path.startsWith('\\\\.\\pipe\\')) {
		path = path.replace(/^\//, '').replace(/[/:]/g, '-');
		return `\\\\.\\pipe\\${path}`;
	}
	return path;
}

export default function createLocalDomainSocket(server, path, callback) {
	return callMaybe(callback, new Promise((resolve, reject) => {
		path = ensureLocalDomainPath(path);

		server.on('error', function handleServerError(err) {
			if (err.code === 'EADDRINUSE') {
				const clientSocket = new net.Socket();
				clientSocket.on('error', function handleClientError(err) {
					if (err.code === 'ECONNREFUSED' || err.code === 'ENOTSOCK') {
						stat(path, (e, stats) => {
							if (!e && stats && !stats.size) {
								rimraf(path, function handleRemoveError(err) {
									/* istanbul ignore next */
									if (err) { reject(err); }
									else { server.listen(path, resolve); }
								});
							}
							else {
								reject(err);
							}
						});
					}
					else {
						/* istanbul ignore next */
						reject(err);
					}
				});

				clientSocket.connect({ path }, function clientConnect() {
					const error = new Error('listen EADDRINUSE');
					Object.assign(error, {
						errno: 'EADDRINUSE',
						code: 'EADDRINUSE',
						syscall: 'listen',
					});
					clientSocket.destroy();
					reject(error);
				});
			}
		});

		server.listen(path, resolve);
	}));
}
