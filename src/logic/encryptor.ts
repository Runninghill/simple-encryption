import bcrypt from 'bcryptjs'
import aes from 'crypto-js/aes'
import utf8 from 'crypto-js/enc-utf8'
import { SaltPlacementStrategy } from '../enums/salt-placement-strategy.enum'
import { InvalidArgumentError } from '../errors/invalid-argument.error'
import { EncryptorConfiguration } from '../interfaces/encryptor-configuration.interface'

export class Encryptor {
    public readonly defaultConfig: EncryptorConfiguration = {
        secret: 'afef5958-156c-4583-bcfd-c52176773df5',
        saltRounds: 10,
        saltPlacementStrategy: SaltPlacementStrategy.Before
    }
    public config: EncryptorConfiguration

    constructor(config: EncryptorConfiguration = {}) {
        this.config = Object.assign(this.defaultConfig, config)
    }

    async encrypt(data: string | number | boolean | Record<string, unknown>): Promise<string> {
        const salt = await bcrypt.genSalt(this.config.saltRounds)
        const encryptionKey = await this.generateEncryptionKey(salt)
        const encryptedData = aes.encrypt(JSON.stringify(data), encryptionKey).toString()
        const encryption = this.placeSalt(salt, encryptedData)

        return encryption
    }

    async decrypt(encryption: string): Promise<string | number | boolean | Record<string, unknown>> {
        const { salt, encryptedData } = this.deconstructEncryption(encryption)
        const encryptionKey = await this.generateEncryptionKey(salt)
        const decryptedData = aes.decrypt(encryptedData, encryptionKey).toString(utf8)

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(decryptedData) as string | number | boolean | Record<string, unknown>
    }

    private async generateEncryptionKey(salt: string): Promise<string> {
        return bcrypt.hash(this.config.secret!, salt)
    }

    private placeSalt(salt: string, encryptedData: string): string {
        let encryption

        if (this.config.saltPlacementStrategy === SaltPlacementStrategy.After) {
            encryption = encryptedData + salt
        } else {
            encryption = salt + encryptedData
        }

        return encryption
    }

    private deconstructEncryption(encryption: string): { salt: string, encryptedData: string } {
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
