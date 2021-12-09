const bcrypt = require('bcryptjs')
const aes = require('crypto-js/aes')
const utf8 = require('crypto-js/enc-utf8')
const { SaltPlacementStrategy } = require('../enums/salt-placement-strategy.enum')

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
        const salt = await bcrypt.genSalt(this.config.saltRounds)
        const encryptionKey = await this._generateEncryptionKey(salt)
        const encryptedData = aes.encrypt(JSON.stringify(data), encryptionKey).toString()
        const encryption = this._placeSalt(salt, encryptedData)

        return encryption
    }

    async decrypt(encryption) {
        const { salt, encryptedData } = this._deconstructEncryption(encryption)
        const encryptionKey = await this._generateEncryptionKey(salt)
        const decryptedData = aes.decrypt(encryptedData, encryptionKey).toString(utf8)

        return JSON.parse(decryptedData)
    }

    async _generateEncryptionKey(salt) {
        return bcrypt.hash(this.config.secret, salt)
    }

    _placeSalt(salt, encryptedData) {
        let encryption

        if (this.config.saltPlacementStrategy === SaltPlacementStrategy.After) {
            encryption = encryptedData + salt
        } else {
            encryption = salt + encryptedData
        }

        return encryption
    }

    _deconstructEncryption(encryption) {
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
