const dgram = require('dgram');
const QueryRequest = require('./QueryRequest.js');
const {
	debug,
	hexToString,
	int32ToHex,
} = require('../utils/util.js');
const {
	IDS,
	STATES,
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
			const server = dgram.createSocket("udp4");
			let currentState = STATES.HANDSHAKE;
			let token = null;
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
				debug(`[DEBUG] => Recieved a message from ${host}:${port}.\n${currentState}\n${message}\n${hex}`);
				switch (currentState) {

					case STATES.HANDSHAKE :
						debug(`[DEBUG] => Recieved handshake from ${host}:${port}.\n${hex}`);
						if (hex.substring(0, 10).toLowerCase() != '0900000001') {
							debug(`[DEBUG] => Recieved an illegal handshake from ${host}:${port}.\n${hex.substring(0, 10)}`);
							clearTimeout(timer);
							server.close();
							reject(`Recieved an illegal handshake from ${host}:${port}.\n${hex.substring(0, 10)}`);
							return;
						}
						token = Number(hexToString(hex.substring(10, hex.length - 2)));
						currentState = STATES.WAITING;
						debug(`Recieved token from ${host}:${port}.\n${token}`);
						fullStat();
						break;

					case STATES.WAITING :
					  debug(`[DEBUG] => Recieved query response from ${host}:${port}.\n${message}`);
						clearTimeout(timer);
						ok = true;
						server.close();
						resolve(parseQuery(message, Date.now() - now));
						break;

				}
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
			/**
			 * Requests the full stats from the server
			 * @returns *
			 */
			const fullStat = () => {
				debug(`[DEBUG] => Attempting to request full stats from ${host}:${port}.`);
				const buf = new QueryRequest(IDS.STATS)
					.setSessionId(IDS.SESSION)
					.setPayload(Buffer.from(int32ToHex(token) + '00000000', 'hex'))
					.toBuffer();
				return send(buf);
			}

			debug(`[DEBUG] => Attempting to handshake ${host}:${port}.`);
			const buf = new QueryRequest(IDS.HANDSHAKE)
				.setSessionId(IDS.SESSION)
				.toHex();
			send(Buffer.from(buf + '00000000', 'hex'));
		} catch (err) {
			console.error(err);
		}
	});
}

/**
 * Parses a query and returns formatted data
 * @param {Buffer} buf The data to parse
 * @param {number} latency The latency of the Minecraft Server
 * @returns {Object}
 */
const parseQuery = (buf, latency) => {
	const hex = (buf.toString('hex') + '').toLowerCase();
	var bits = [];
	console.log(hex);
	for (i = 10; i < hex.length; i = i + 2) {
		let splitStr = hex.slice(i, i + 2);
		bits.push(splitStr);
	}
	console.log(bits);
	var splt = bits.join(' ').split('00');
	console.log(splt);
	var clean = [];
	for (i = 2; i < splt.length; i++) {
		clean.push(Buffer.from(splt[i].replace(/ /g, ''), 'hex').toString());
	}
	console.log(clean);
	var playerlist = [];
	var p = clean.indexOf('\x01player_') + 2;
	while (clean[p] !== '') {
		playerlist.push(clean[p]);
		p++;
	}
	console.log(p);
	return {
		'hostname': clean[clean.indexOf('hostname') + 1],
		'hostip': clean[clean.indexOf('hostip') + 1],
		'gametype': clean[clean.indexOf('gametype') + 1],
		'hostport': clean[clean.indexOf('hostport') + 1],
		'map': clean[clean.indexOf('map') + 1],
		'version': clean[clean.indexOf('version') + 1],
		'game_id': clean[clean.indexOf('game_id') + 1],
		'latency': latency,
		'players': {
			'online': clean[clean.indexOf('numplayers') + 1],
			'max': clean[clean.indexOf('maxplayers') + 1],
			'list': playerlist
		}
	}
}

module.exports = query;
