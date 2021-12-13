import { SaltPlacementStrategy } from '../enums/salt-placement-strategy.enum'

export interface EncryptorConfiguration {
    secret?: string,
    saltRounds?: number,
    saltPlacementStrategy?: SaltPlacementStrategy
}
