const axios = require('axios').default
const config = require('rc')('release_cd', {})

module.exports = async function (name, result) {
  if (!config.reportUrl) return
  const data = {
    [`tests.${name}`]: result
  }
  console.log(`Sending report to ${config.reportUrl}`, data)
  await axios({
    method: 'post',
    url: config.reportUrl,
    data
  })
}
