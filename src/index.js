const query = require('./bedrock/query');
const ucp = require('./bedrock/ucp');

/**
 * Pings a Bedrock Minecraft server
 * @param {string} host The ip/domain of the Minecraft server
 * @param {number} port The port that the Minecraft server is hosted on
 * @param {?number} timeout The maximum amount of time the server can take to return data, defaults to 6000ms
 * @param {?string} mode The "mode" to use, either 'hybrid', 'query' or 'ping'
 * @returns {Promise}
 */
const ping = (host, port, timeout = 6000, mode = 'hybrid') => {
	return new Promise(async (resolve, reject) => {
		try {
			let data;
			switch (mode) {
				case 'query':
					data = await query(host, port, timeout);
					resolve(data);
					break;
				case 'ping':
					data = await ucp(host, port, timeout);
					resolve(data);
					break;
				default:
					try {
						data = await query(host, port, timeout);
						resolve(data);
					} catch (err) {
						data = await ucp(host, port, timeout);
						resolve(data);
					}
			}
		} catch (err) {
			return reject(err);
		}
	});
};

module.exports = ping;
