![Runninghill Logo](https://github.com/Runninghill/simple-encryption/blob/main/runninghill.png?raw=true "Runninghill")

# Simple Encryption

> Please note that this is the README for CONSUMERS, if you
> plan on contributing to this package, please take a
> look [here](https://github.com/Runninghill/simple-encryption/blob/main/CONTRIBUTOR_README.md).

A simple encryption package that allows you to encrypt and decrypt data.

- [Getting Started](#Getting-Started-🏁)
- [Usage](#Usage-💡)
- [API Reference](#API-Reference-📖)

# Getting Started 🏁

If you plan on contributing to the package, please read the [contributor readme](https://github.com/Runninghill/simple-encryption/blob/main/CONTRIBUTOR_README.md).

1. Run `npm install @runninghill/simple-encryption`.

2. Import and use the exposed classes to encrypt/decrypt your data.

# Usage 💡

To begin using *Simple Encryption*, create an instance of the `Encryptor` class, 
passing in the appropriate configuration (optional).

It is recommended that you configure the `secret`, this is your private key for the encryption.

To understand what you can configure, check out the [API reference](#Encryptor).

**NB: In order to**

```javascript
const { Encryptor } = require('@runninghill/simple-encryption')

const encryptor = new Encryptor({
    saltRounds: 15,
    secret: 'a9479590-299c-4812-9636-a333a97ca6cc'
})
```

To encrypt data, simply call the [encrypt](#*Encrypt*) method:

```javascript
    const user = {
        name: 'John',
        surname: 'Doe',
        age: 31
    }

    const encryption = await encryptor.encrypt(user)
```

To decrypt data, simply call the [decrypt](#*Decrypt*) method:

```javascript
    const decryptedData = await encryptor.decrypt(encryption)
    // decryptedData = {
    //     name: 'John',
    //     surname: 'Doe',
    //     age: 31
    // }
```

# API Reference 📖

- [Classes](#Classes)
  - [Encryptor](#Encryptor)
- [Enums](#Enums)
  - [SaltPlacementStrategy](#SaltPlacementStrategy)

# Classes
- [Encryptor](#Encryptor)

# Encryptor

A class that allows you to encrypt and decrypt data. It also provides optional configuration.

### Configuration

|Name|Type|Description|Default|
|----|----|-----------|-------|
|secret|string|the private key for the encryption|'default'|
|saltRounds|number|the amount of rounds to generate the salt, used in the creation of the encryption key. The greater the amount of rounds the more resource intensive the encryption will be|true|
|saltPlacementStrategy|[SaltPlacementStrategy](#SaltPlacementStrategy)|the strategy for placing the salt in the encryption|SaltPlacementStrategy.Before

## Methods
- [Encrypt](#*Encrypt*)
- [Decrypt](#*Decrypt*)

## *Encrypt*

Encrypts the provided data using the configuration of the [Encryptor](#encryptor) instance.

The provided data can be primitive or an object.

**Returns:** a promise with a string, the encrypted data with the salt placed inside it.

**Parameters**

|Name|Type|Description|Default|
|----|----|-----------|-------|
|data|any|the data to be encrypted|

## *Decrypt*

Decrypts the provided encryption using the configuration of the [Encryptor](#encryptor) instance.

**Returns:** a promise with the primitive data or object that was encrypted

**Parameters**

|Name|Type|Description|Default|
|----|----|-----------|-------|
|encryption|string|the result from the [encrypt](#*Encrypt*) method; the encrypted data with the salt placed inside it|

***

# Enums
- [SaltPlacementStrategy](#SaltPlacementStrategy)

# SaltPlacementStrategy

Determines how the salt is placed in the encrypted data

**Values**

|Name|Description|
|----|-----------|
|Before|the salt is placed before the encrypted data|
|After|the salt is placed after the encrypted data|
