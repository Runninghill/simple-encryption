export class InvalidArgumentError implements Error {
    public name = 'InvalidArgumentError'
    public message: string
    public argumentName: string
    public reason?: string

    constructor(argumentName: string, reason?: string) {
        this.message = 'Invalid argument: ' + argumentName
        if (reason) this.message += ', reason: ' + reason

        this.argumentName = argumentName
        this.reason = reason
    }
}
