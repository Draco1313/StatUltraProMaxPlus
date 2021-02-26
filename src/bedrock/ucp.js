const dgram = require('dgram');
const {
	debug,
	hexToString,
} = require('../utils/util.js');
const bytes = require('../utils/bytes');
const {
	HEX,
} = require('../utils/constants.js');

/**
 * Creates & sends a query to the Minecraft server
 * @param {string} host The ip/domain of the Minecraft server
 * @param {number} port The port that the Minecraft server is hosted on
 * @param {?number} timeout The maximum amount of time the server can take to return data, defaults to 6000ms
 * @returns Promise
 */
const query = (host, port, timeout = 6000) => {
	return new Promise((resolve, reject) => {
		try {
			const now = Date.now();
			const server = dgram.createSocket('udp4');
			let ok = false;

			const timer = setTimeout(() => {
				server.close();
				debug(`[DEBUG] => Connection timed out when connecting to ${host}:${port}.`);
				return reject(`Connection timed out when connecting to ${host}:${port}.`);
			}, timeout);
			/**
			 * Sends a message to the server
			 * @param {*} message The message to send
			 * @returns *
			 */
			const send = (message) => {
				debug(`[DEBUG] => Sending packet ${message.toString('hex')} to ${host}:${port}`);
				return server.send(message, 0, message.length, port, host, (err, bytes) => {
					debug(`[DEBUG] => Sent packet ${message.toString('hex')} to ${host}:${port}`);
					if (err) {
						clearTimeout(timer);
						server.close();
						return reject(`Recieved socket error from ${host}:${port}.\n${err}`);
					}
					return bytes;
				});
			}

			server.on('message', (message) => {
				const hex = message.toString('hex');
				debug(`[DEBUG] => Recieved a message from ${host}:${port}.\n${message}\n${hex}`);
				if (!hex.startsWith('1c')) {
					reject('Invalid Data Recieved');
					clearTimeout(timer);
					server.close();
					debug(`[DEBUG] => Recieved an invalid response from ${host}:${port}.\n${hex}`);
					reject(`Recieved an invalid response from ${host}:${port}.\n${hex}`);
					return;
				}
				const byteLength = Number(hex.substr(66, 4), 16);
				const data = hex.substr(70, byteLength * 2);
				const arr = hexToString(data).split(';');
				const result = {
					hostname: arr[1],
					version: arr[3],
					latency: Date.now() - now,
					players: {
						online: arr[4],
						now: arr[5],
					},
				};
				clearTimeout(timer);
				ok = true;
				server.close();
				return resolve(result);
			});

			server.on('err', (err) => {
				debug(`[DEBUG] => Recieved error ${err}`);
				clearTimeout(timer);
				server.close();
				return reject(err);
			});

			server.on('close', () => {
				debug(`[DEBUG] => Connection to ${host}:${port} was closed.`);
				if (ok) return;
				clearTimeout(timer);
				return reject(`Connection to ${host}:${port} was closed with no result.`);
			});

			const writer = new bytes.ByteWriter();
			writer.writeHex(HEX.UCP);
			writer.writeLong(Date.now());
			writer.writeHex(HEX.MAGIC);
			send(writer.toBuffer());
		}
		catch (err) {
			return reject(err);
		}
	});
}
module.exports = query;
