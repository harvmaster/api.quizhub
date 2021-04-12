export function generateID () {
    const uuid = Math.random().toString(36).substr(2, 6)
    return uuid
}

module.exports = generateID