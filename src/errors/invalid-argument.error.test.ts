import { describe, expect, it } from '@jest/globals'
import { InvalidArgumentError } from './invalid-argument.error'

describe('test InvalidArgumentError', () => {
    it('should provide the invalid argument\'s name in the message', () => {
        const error = new InvalidArgumentError('data')

        void expect(error.message.includes('data')).toBeTruthy()
    })

    it('should add the reason to the message if provided', () => {
        const error = new InvalidArgumentError('data', 'malformed')

        void expect(error.message.includes('reason: malformed')).toBeTruthy()
    })

    it('should not add the reason to the message if one is not provided', () => {
        const error = new InvalidArgumentError('data')

        void expect(error.message.includes('reason: malformed')).toBeFalsy()
    })
})
