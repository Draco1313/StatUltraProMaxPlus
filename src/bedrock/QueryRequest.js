const bytes = require('../utils/bytes.js');
const {
	IDS,
	MAGIC,
} = require('../utils/constants.js');

/**
 * @class
 * @classdesc The query request class
 */
class QueryRequest {
	constructor(type) {
		this.type = type;
		this.sessionId = 0;
		this.payload = Buffer.from('', 'hex');
	}
	/**
	 * Sets the session ID
	 * @param {number} id The value to set the ID to
	 * @returns QueryRequest
	 */
	setSessionId(id) {
		this.sessionId = Number(id);
		return this;
	}
	/**
	 * Gets the current session ID
	 * @returns number
	 */
	getSessionId() {
		return this.sessionId;
	}
	/**
	 * Sets the requests payload
	 * @param {Buffer} payload The payload to set
	 * @returns QueryRequest
	 */
	setPayload(payload) {
		if (!(payload instanceof Buffer)) {
			throw new Error(`The requested payload wasn't a buffer:\n${payload}`);
		}
		this.payload = payload;
		return this;
	}
	/**
	 * Gets the current payload
	 * @returns Buffer
	 */
	getPayload() {
		if (this.type == IDS.HANDSHAKE) {
			return Buffer.from('', 'hex');
		} else {
			return this.payload;
		}
	}
	/**
	 * Converts the request to a hex
	 * @returns hex
	 */
	toHex() {
		let writer = new bytes.ByteWriter();
		writer.writeHex(MAGIC);
		writer.writeByte(this.type);
		writer.writeInt(this.sessionId);
		writer.writeBuffer(this.getPayload());
		return writer.toHex();
	}
	/**
	 * Converts the request to a buffer
	 * @returns Buffer
	 */
	toBuffer() {
		return Buffer.from(this.toHex(), 'hex');
	}
}

module.exports = QueryRequest;
