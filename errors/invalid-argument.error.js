class InvalidArgumentError extends Error {
    constructor(argumentName, reason) {
        let message = 'Invalid argument: ' + argumentName
        if (reason) message += ', reason: ' + reason

        super(message)

        this.argumentName = argumentName
        this.reason = reason
    }
}

module.exports.InvalidArgumentError = InvalidArgumentError
