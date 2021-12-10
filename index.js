const { Encryptor } = require('./logic/encryptor')
const { SaltPlacementStrategy } = require('./enums/salt-placement-strategy.enum')

module.exports = {
    Encryptor: Encryptor,
    SaltPlacementStrategy: SaltPlacementStrategy
}
