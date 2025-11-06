const { env } = require('node:process')

const TESTS_EXECUTION_TIMEOUT = parseInt(env.TESTS_EXECUTION_TIMEOUT, 10) || 1000 * 60 * 1
// todo: ^^ revert before merging!!

const EXIT_CODES = Object.freeze({
  success: 0,
  failure: 1,
  timeout: 2
})

module.exports = {
  EXIT_CODES,
  TESTS_EXECUTION_TIMEOUT
}
