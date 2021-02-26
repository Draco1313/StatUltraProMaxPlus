/**
 * Logs debug data to the console when in development mode
 * @param {*} data The data to Logs
 * @returns {boolean}
 */
const debug = (data) => {
	if (Boolean(process.env.DEBUG) !== true) return false;
	console.debug(data);
	return true;
};
/**
 * @param {hex} hex The hex to convert to a string
 * @returns {string};
 */
const hexToString = (hex) => {
	return Buffer.from(hex.toString('utf-8'));
};
/**
 * @param {hex} hex The hex to pad
 * @param {number} bytes The number of bytes to add
 * @returns {string}
 */
const padHex = (hex, bytes) => {
	return ('00'.repeat(bytes) + hex).substr(-(bytes * 2));
};
/**
 * @param {hex} hex The hex to pad
 * @param {number} bytes The number of bytes to add
 * @returns {string}
 */
const padHexEnd = (hex, bytes) => {
	return (hex + '00'.repeat(bytes)).substring(0, bytes * 2);
};
/**
 * @param {number} number The number to convert
 * @returns {hex}
 */
const int64ToHex = (int) => {
	return padHex(int.toString(16), 8);
};
/**
 * @param {number} number The number to convert
 * @returns {hex}
 */
const int32ToHex = (int) => {
	return padHex(int.toString(16), 4);
};
/**
 * @param {number} number The number to convert
 * @returns {hex}
 */
const int16ToHex = (int) => {
	return padHex(int.toString(16), 2);
};
/**
 * @param {number} number The number to convert
 * @returns {hex}
 */
const int8ToHex = (int) => {
	return padHex(int.toString(16), 1);
}
/**
 * I legit can't be fucked to work this out
 * @param {string} str The string
 * @param {number} n The amount of characters
 * @returns {array}
 */
const eachCharsFromString = (str, n) => {
	const chrs = Number(n);
	const arr = [];
	for (let i = 0; i < (str.length / chrs); i++) {
		arr.push(str.substring(i * chrs, (i + 1) * chrs));
	}
	return arr;
};

module.exports = {
	debug,
	hexToString,
	int8ToHex,
	int16ToHex,
	int32ToHex,
	int64ToHex,
	padHex,
	padHexEnd,
};
