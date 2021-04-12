let prefix = ''
export function debug (msg) {
  console.log(`${this.prefix}: ${msg}`)
  return this.debug
}

export function setPrefix (p) {
  this.prefix = p
  return this.debug
}

export default debug