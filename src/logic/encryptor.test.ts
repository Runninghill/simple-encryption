import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { Encryptor } from './encryptor'
import { SaltPlacementStrategy } from '../enums/salt-placement-strategy.enum'
import bcrypt from 'bcryptjs'
import aes from 'crypto-js/aes'
import { InvalidArgumentError } from '../errors/invalid-argument.error'
import { SpyInstance } from 'jest-mock'

describe('test Encryptor', () => {
    const mockSalt = '$2a$10$cugqo2HQV7tKysypFiZzB.'
    const mockEncryptionKey = '$2a$10$cugqo2HQV7tKysypFiZzB.CYDB1e4xPKcyWfmeO.ITratEYS/neqO'
    const mockEncryptedData = 'U2FsdGVkX1+9P2wR9v7HH1L1hzMAFFhO6TQWkyhbCEw='
    const mockEncryption = mockSalt + mockEncryptedData
    const mockData = 'Hello World.'

    let encryptor: Encryptor

    beforeEach(() => {
        encryptor = new Encryptor()
    })

    it('should set the configuration of the class to the default if no config is specified', () => {
        const encryptor = new Encryptor()

        void expect(encryptor.config).toEqual(encryptor.defaultConfig)
    })

    it('should override the values of the config that are passed in', () => {
        const expectedConfig = Object.assign({}, new Encryptor().defaultConfig)
        expectedConfig.saltRounds = 5
        expectedConfig.secret = 'bananman'
        const encryptor = new Encryptor({
            saltRounds: 5,
            secret: 'bananman'
        })

        void expect(encryptor.config).toEqual(expectedConfig)
    })

    describe('test encrypt', () => {
        let generateSaltSpy: SpyInstance<string, any>
        let aesEncryptSpy: SpyInstance<any, any>
        let generateEncryptionKeySpy: SpyInstance<any, any>
        let placeSaltSpy: SpyInstance<any, any>

        beforeEach(() => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            generateSaltSpy = jest.spyOn(bcrypt, 'genSalt').mockResolvedValue(mockSalt)
            aesEncryptSpy = jest.spyOn(aes, 'encrypt')
            generateEncryptionKeySpy = jest.spyOn(encryptor as any, 'generateEncryptionKey')
                .mockResolvedValue(mockEncryptionKey)
            placeSaltSpy = jest.spyOn(encryptor as any, 'placeSalt')
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
            const result = await encryptor.encrypt({
                name: 'Piet',
                surname: 'Pompies',
                age: 21,
                isMale: true
            })

            void expect(result).toBeTruthy()
        })
    })

    describe('test decrypt', () => {
        let aesDecryptSpy: SpyInstance<any, any>
        let generateEncryptionKeySpy: SpyInstance<any, any>
        let deconstructEncryptionSpy: SpyInstance<any, any>

        beforeEach(() => {
            aesDecryptSpy = jest.spyOn(aes, 'decrypt')
            generateEncryptionKeySpy = jest.spyOn(encryptor as any, 'generateEncryptionKey')
                .mockResolvedValue(mockEncryptionKey)
            deconstructEncryptionSpy = jest.spyOn(encryptor as any, 'deconstructEncryption')
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
    })

    describe('test generateEncryptionKey', () => {
        it('should hash the provided salt and the secret', async () => {
            const hashSpy = jest.spyOn(bcrypt, 'hash')
            await encryptor['generateEncryptionKey'](mockSalt)

            void expect(hashSpy).toBeCalledTimes(1)
            void expect(hashSpy).toBeCalledWith(encryptor.config.secret, mockSalt)
        })
    })

    describe('test placeSalt', () => {
        it('should be able to place the salt before the encrypted data', () => {
            encryptor.config.saltPlacementStrategy = SaltPlacementStrategy.Before
            const result = encryptor['placeSalt'](mockSalt, mockEncryptedData)

            void expect(result).toEqual(mockSalt + mockEncryptedData)
        })

        it('should be able to place the salt after the encrypted data', () => {
            encryptor.config.saltPlacementStrategy = SaltPlacementStrategy.After
            const result = encryptor['placeSalt'](mockSalt, mockEncryptedData)

            void expect(result).toEqual(mockEncryptedData + mockSalt)
        })
    })

    describe('test deconstructEncryption', () => {
        it('should be able to deconstruct the encryption when the salt is placed before the encrypted data', () => {
            encryptor.config.saltPlacementStrategy = SaltPlacementStrategy.Before
            const result = encryptor['deconstructEncryption'](mockSalt + mockEncryptedData)

            void expect(result).toEqual({
                salt: mockSalt,
                encryptedData: mockEncryptedData
            })
        })

        it('should be able to deconstruct the encryption when the salt is placed after the encrypted data', () => {
            encryptor.config.saltPlacementStrategy = SaltPlacementStrategy.After
            const result = encryptor['deconstructEncryption'](mockEncryptedData + mockSalt)

            void expect(result).toEqual({
                salt: mockSalt,
                encryptedData: mockEncryptedData
            })
        })

        it('should throw an error if the encryption is malformed', () => {
            let error
            try {
                encryptor['deconstructEncryption'](mockEncryption.slice(0, 10))
            } catch (e) {
                error = e
            }

            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)

            error = undefined
            try {
                encryptor['deconstructEncryption'](mockEncryption.slice(0, 10))
            } catch (e) {
                error = e
            }

            void expect(error).toBeTruthy()
            void expect(error).toBeInstanceOf(InvalidArgumentError)
        })
    })
})
