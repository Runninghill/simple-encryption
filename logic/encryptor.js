const bcrypt = require('bcryptjs')
const aes = require('crypto-js/aes')
const utf8 = require('crypto-js/enc-utf8')
const { SaltPlacementStrategy } = require('../enums/salt-placement-strategy.enum')
const { InvalidArgumentError } = require('../errors/invalid-argument.error')

class Encryptor {
    constructor(config = {}) {
        const defaultConfig = {
            secret: 'default',
            saltRounds: 10,
            saltPlacementStrategy: SaltPlacementStrategy.Before
        }

        this.config = Object.assign(defaultConfig, config)
    }

    async encrypt(data) {
        if (data === undefined || data === null) throw new InvalidArgumentError('data', 'can not be null')

        const salt = await bcrypt.genSalt(this.config.saltRounds)
        const encryptionKey = await this._generateEncryptionKey(salt)
        const encryptedData = aes.encrypt(JSON.stringify(data), encryptionKey).toString()
        const encryption = this._placeSalt(salt, encryptedData)

        return encryption
    }

    async decrypt(encryption) {
        if (encryption === undefined || encryption === null) throw new InvalidArgumentError('encryption', 'can not be null')

        const { salt, encryptedData } = this._deconstructEncryption(encryption)
        const encryptionKey = await this._generateEncryptionKey(salt)
        const decryptedData = aes.decrypt(encryptedData, encryptionKey).toString(utf8)

        return JSON.parse(decryptedData)
    }

    async _generateEncryptionKey(salt) {
        if (salt === undefined || salt === null) throw new InvalidArgumentError('salt', 'can not be null')

        return bcrypt.hash(this.config.secret, salt)
    }

    _placeSalt(salt, encryptedData) {
        if (salt === undefined || salt === null) throw new InvalidArgumentError('salt', 'can not be null')
        if (encryptedData === undefined || encryptedData === null)
            throw new InvalidArgumentError('encryptedData', 'can not be null')

        let encryption
        if (this.config.saltPlacementStrategy === SaltPlacementStrategy.After) {
            encryption = encryptedData + salt
        } else {
            encryption = salt + encryptedData
        }

        return encryption
    }

    _deconstructEncryption(encryption) {
        if (encryption === undefined || encryption === null) throw new InvalidArgumentError('encryption', 'can not be null')
        if (encryption.length < 30) throw new InvalidArgumentError('encryption', 'malformed')

        const saltLength = 29
        let salt, encryptedData

        if (this.config.saltPlacementStrategy === SaltPlacementStrategy.After) {
            salt = encryption.slice(encryption.length - saltLength)
            encryptedData = encryption.slice(0, encryption.length - saltLength)
        } else {
            salt = encryption.slice(0, saltLength)
            encryptedData = encryption.slice(saltLength)
        }

        return { salt, encryptedData }
    }
}

module.exports.Encryptor = Encryptor
