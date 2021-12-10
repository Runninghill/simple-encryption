const { describe, it, expect, beforeEach, afterEach, jest } = require('@jest/globals')
const { Encryptor } = require('./encryptor')
const { SaltPlacementStrategy } = require('../enums/salt-placement-strategy.enum')
const bcrypt = require('bcryptjs')
const aes = require('crypto-js/aes')
const { InvalidArgumentError } = require('../errors/invalid-argument.error')

describe('test Encryptor', () => {
    const defaultConfig = {
        secret: 'default',
        saltRounds: 10,
        saltPlacementStrategy: SaltPlacementStrategy.Before
    }
    const mockSalt = '$2a$10$cugqo2HQV7tKysypFiZzB.'
    const mockEncryptionKey = '$2a$10$cugqo2HQV7tKysypFiZzB.CYDB1e4xPKcyWfmeO.ITratEYS/neqO'
    const mockEncryptedData = 'U2FsdGVkX1+9P2wR9v7HH1L1hzMAFFhO6TQWkyhbCEw='
    const mockEncryption = mockSalt + mockEncryptedData
    const mockData = 'Hello World.'

    let encryptor

    beforeEach(() => {
        encryptor = new Encryptor()
    })

    it('should set the configuration of the class to the default if no config is specified', () => {
        const encryptor = new Encryptor()

        void expect(encryptor.config).toEqual(defaultConfig)
    })

    it('should override the values of the config that are passed in', () => {
        let expectedConfig = Object.assign({}, defaultConfig)
        expectedConfig.saltRounds = 5
        expectedConfig.secret = 'bananman'
        const encryptor = new Encryptor({
            saltRounds: 5,
            secret: 'bananman'
        })

        void expect(encryptor.config).toEqual(expectedConfig)
    })

    describe('test encrypt', () => {
        let generateSaltSpy, aesEncryptSpy, generateEncryptionKeySpy, placeSaltSpy

        beforeEach(() => {
            generateSaltSpy = jest.spyOn(bcrypt, 'genSalt').mockResolvedValue(mockSalt)
            aesEncryptSpy = jest.spyOn(aes, 'encrypt').mockReturnValue(mockEncryptedData)
            generateEncryptionKeySpy = jest.spyOn(encryptor, '_generateEncryptionKey').mockResolvedValue(mockEncryptionKey)
            placeSaltSpy = jest.spyOn(encryptor, '_placeSalt')
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        it('should generate a salt and encryption key', async () => {
            await encryptor.encrypt(mockData)

            void expect(generateSaltSpy).toBeCalledTimes(1)
            void expect(generateSaltSpy).toBeCalledWith(encryptor.config.saltRounds)
            void expect(generateEncryptionKeySpy).toBeCalledTimes(1)
            void expect(generateEncryptionKeySpy).toBeCalledWith(mockSalt)
        })

        it('should encrypt the data using an encryption key', async () => {
            await encryptor.encrypt(mockData)

            void expect(aesEncryptSpy).toBeCalledTimes(1)
            void expect(aesEncryptSpy).toBeCalledWith(JSON.stringify(mockData), mockEncryptionKey)
        })

        it('should place the salt in the encrypted data string', async () => {
            await encryptor.encrypt(mockData)

            void expect(placeSaltSpy).toBeCalledTimes(1)
            void expect(placeSaltSpy).toBeCalledWith(mockSalt, mockEncryptedData)
        })

        it('should be able to work with primitive data', async () => {
            aesEncryptSpy.mockRestore()

            let result = await encryptor.encrypt('banan')
            void expect(result).toBeTruthy()

            result = await encryptor.encrypt(12500.53)
            void expect(result).toBeTruthy()

            result = await encryptor.encrypt(true)
            void expect(result).toBeTruthy()
        })

        it('should be able to work with objects', async () => {
            let result = await encryptor.encrypt({
                name: 'Piet',
                surname: 'Pompies',
                age: 21,
                isMale: true
            })

            void expect(result).toBeTruthy()
        })

        it('should throw an error if no data is provided', async () => {
            aesEncryptSpy.mockRestore()
            let error
            try {
                await encryptor.encrypt(undefined)
            } catch (e) {
                error = e
            }
            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)

            error = undefined
            try {
                await encryptor.encrypt(null)
            } catch (e) {
                error = e
            }
            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)
        })
    })

    describe('test decrypt', () => {
        let aesDecryptSpy, generateEncryptionKeySpy, deconstructEncryptionSpy

        beforeEach(() => {
            aesDecryptSpy = jest.spyOn(aes, 'decrypt').mockReturnValue(JSON.stringify(mockData))
            generateEncryptionKeySpy = jest.spyOn(encryptor, '_generateEncryptionKey').mockResolvedValue(mockEncryptionKey)
            deconstructEncryptionSpy = jest.spyOn(encryptor, '_deconstructEncryption')
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        it('should deconstruct the encryption and generate an encryption key', async () => {
            await encryptor.decrypt(mockEncryption)

            void expect(deconstructEncryptionSpy).toBeCalledTimes(1)
            void expect(deconstructEncryptionSpy).toBeCalledWith(mockEncryption)
            void expect(generateEncryptionKeySpy).toBeCalledTimes(1)
            void expect(generateEncryptionKeySpy).toBeCalledWith(mockSalt)
        })

        it('should decrypt the encrypted data', async () => {
            await encryptor.decrypt(mockEncryption)

            void expect(aesDecryptSpy).toBeCalledTimes(1)
            void expect(aesDecryptSpy).toBeCalledWith(mockEncryptedData, mockEncryptionKey)
        })

        describe('should be able to decrypt data', () => {
            beforeEach(() => {
                aesDecryptSpy.mockRestore()
            })

            it('should be able to decrypt an encrypted string', async () => {
                // eslint-disable-next-line max-len
                const result = await encryptor.decrypt('$2a$10$cugqo2HQV7tKysypFiZzB.U2FsdGVkX194DoXTV2rpSq64yfbFeZfrNK9CywgrHi0=')

                void expect(result).toEqual('banan')
            })

            it('should be able to decrypt an encrypted number', async () => {
                // eslint-disable-next-line max-len
                const result = await encryptor.decrypt('$2a$10$cugqo2HQV7tKysypFiZzB.U2FsdGVkX19s23hrXLL/XUicxOpJCBA8MJ7zyMxdmMA=')

                void expect(result).toEqual(12500.53)
            })

            it('should be able to decrypt an encrypted boolean', async () => {
                // eslint-disable-next-line max-len
                const result = await encryptor.decrypt('$2a$10$cugqo2HQV7tKysypFiZzB.U2FsdGVkX1+zwgIrApA8FMo1zoZeqOlV+vFsQmBzj+k=')

                void expect(result).toEqual(true)
            })

            it('should be able to decrypt encrypted objects', async () => {
                // eslint-disable-next-line max-len
                const result = await encryptor.decrypt('$2a$10$cugqo2HQV7tKysypFiZzB.U2FsdGVkX18w0aud3NowXkhQp6p8t2HoHeVUfxbg4Spa3bgeOpE/N2CsICEnGzG1MYjE5L4x47cuAvPD92BHpHviKFVZb8Wq6u6YrJ74ljk=')

                void expect(result).toEqual({
                    'name': 'Piet',
                    'surname': 'Pompies',
                    'age': 21,
                    'isMale': true
                })
            })
        })

        it('should throw an error if no encryption is provided', async () => {
            aesDecryptSpy.mockRestore()
            let error
            try {
                await encryptor.decrypt(undefined)
            } catch (e) {
                error = e
            }
            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)

            error = undefined
            try {
                await encryptor.decrypt(null)
            } catch (e) {
                error = e
            }
            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)
        })
    })

    describe('test generateEncryptionKey', () => {
        it('should hash the provided salt and the secret', async () => {
            const hashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue(mockEncryptionKey)
            await encryptor._generateEncryptionKey(mockSalt)

            void expect(hashSpy).toBeCalledTimes(1)
            void expect(hashSpy).toBeCalledWith(encryptor.config.secret, mockSalt)
        })

        it('should throw an error if the salt is not provided', async () => {
            let error
            try {
                await encryptor._generateEncryptionKey(undefined)
            } catch (e) {
                error = e
            }

            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)

            error = undefined
            try {
                await encryptor._generateEncryptionKey(null)
            } catch (e) {
                error = e
            }

            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)
        })
    })

    describe('test placeSalt', () => {
        it('should be able to place the salt before the encrypted data', () => {
            encryptor.config.saltPlacementStrategy = SaltPlacementStrategy.Before
            const result = encryptor._placeSalt(mockSalt, mockEncryptedData)

            void expect(result).toEqual(mockSalt + mockEncryptedData)
        })

        it('should be able to place the salt after the encrypted data', () => {
            encryptor.config.saltPlacementStrategy = SaltPlacementStrategy.After
            const result = encryptor._placeSalt(mockSalt, mockEncryptedData)

            void expect(result).toEqual(mockEncryptedData + mockSalt)
        })

        it('should throw an error if the salt is not provided', () => {
            let error
            try {
                encryptor._placeSalt(undefined, mockEncryptedData)
            } catch (e) {
                error = e
            }

            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)

            error = undefined
            try {
                encryptor._placeSalt(null, mockEncryptedData)
            } catch (e) {
                error = e
            }

            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)
        })

        it('should throw an error if the encrypted data is not provided', () => {
            let error
            try {
                encryptor._placeSalt(mockSalt, undefined)
            } catch (e) {
                error = e
            }

            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)

            error = undefined
            try {
                encryptor._placeSalt(mockSalt, null)
            } catch (e) {
                error = e
            }

            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)
        })
    })

    describe('test deconstructEncryption', () => {
        it('should be able to deconstruct the encryption when the salt is placed before the encrypted data', () => {
            encryptor.config.saltPlacementStrategy = SaltPlacementStrategy.Before
            const result = encryptor._deconstructEncryption(mockSalt + mockEncryptedData)

            void expect(result).toEqual({
                salt: mockSalt,
                encryptedData: mockEncryptedData
            })
        })

        it('should be able to deconstruct the encryption when the salt is placed after the encrypted data', () => {
            encryptor.config.saltPlacementStrategy = SaltPlacementStrategy.After
            const result = encryptor._deconstructEncryption(mockEncryptedData + mockSalt)

            void expect(result).toEqual({
                salt: mockSalt,
                encryptedData: mockEncryptedData
            })
        })

        it('should throw an error if the encryption is not provided', () => {
            let error
            try {
                encryptor._deconstructEncryption(undefined)
            } catch (e) {
                error = e
            }

            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)

            error = undefined
            try {
                encryptor._deconstructEncryption(null)
            } catch (e) {
                error = e
            }

            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)
        })

        it('should throw an error if the encryption is malformed', () => {
            let error
            try {
                encryptor._deconstructEncryption(mockEncryption.slice(0, 10))
            } catch (e) {
                error = e
            }

            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)

            error = undefined
            try {
                encryptor._deconstructEncryption(mockEncryption.slice(0, 10))
            } catch (e) {
                error = e
            }

            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)
        })
    })
})
