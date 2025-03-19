/*****
 License
 --------------
 Copyright © 2020-2025 Mojaloop Foundation
 The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Mojaloop Foundation for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Mojaloop Foundation
 - Name Surname <name.surname@mojaloop.io>

 * ModusBox
 * Vijay Kumar Guthi <vijaya.guthi@modusbox.com> (Original Author)
 --------------
 ******/
const { IncomingWebhook } = require('@slack/webhook')
const objectStore = require('../objectStore')

const config = objectStore.get('config')

const millisecondsToTime = (milliseconds) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

/**
 * @param {FinalReport} progress
 * @param {string} reportURL - URL of the report
 */
const generateSlackBlocks = (progress, reportURL) => {
  const slackBlocks = []
  let totalAssertionsCount = 0
  let totalPassedAssertionsCount = 0
  let totalRequestsCount = 0
  const failedTestCases = []
  progress.test_cases.forEach(testCase => {
    // console.log(fStr.yellow(testCase.name))
    totalRequestsCount += testCase.requests.length
    let testCaseAssertionsCount = 0
    let testCasePassedAssertionsCount = 0
    testCase.requests.forEach(req => {
      const passedAssertionsCount = req.request.tests && req.request.tests.passedAssertionsCount ? req.request.tests.passedAssertionsCount : 0
      const assertionsCount = req.request.tests && req.request.tests.assertions && req.request.tests.assertions.length ? req.request.tests.assertions.length : 0
      totalAssertionsCount += assertionsCount
      totalPassedAssertionsCount += passedAssertionsCount
      testCaseAssertionsCount += assertionsCount
      testCasePassedAssertionsCount += passedAssertionsCount
    })
    if (testCaseAssertionsCount !== testCasePassedAssertionsCount) {
      failedTestCases.push({
        name: testCase.name,
        failedAssertions: testCaseAssertionsCount - testCasePassedAssertionsCount
      })
    }
    // const passed = testCasePassedAssertionsCount === testCaseAssertionsCount
    // // TODO: make sure this list should not be more than 40 because we can add only max 50 blocks in a slack message
    // if(!passed) {
    //   slackBlocks.push({
    //     type: 'section',
    //     text: {
    //       type: 'mrkdwn',
    //       text: `${testCase.name} - [ *${testCasePassedAssertionsCount}/${testCaseAssertionsCount}* ]` + ' `FAILED`'
    //     }
    //   })
    // }
  })

  // totalAssertionsCount = totalPassedAssertionsCount
  // failedTestCases.length = 0

  if (config.briefSummaryPrefix) {
    const top5FailedTestCases = failedTestCases.sort((a, b) => b.failedAssertions - a.failedAssertions).slice(0, 5)
    return [{
      type: 'rich_text',
      elements: [{
        type: 'rich_text_section',
        elements: [
          { type: 'text', text: `${totalAssertionsCount === totalPassedAssertionsCount ? '🟢' : '🔴'}` },
          reportURL ? { type: 'link', url: reportURL, text: config.briefSummaryPrefix } : { type: 'text', text: config.briefSummaryPrefix },
          { type: 'text', text: ' tests: ' },
          { type: 'text', text: String(progress.test_cases.length), style: { code: true } },
          { type: 'text', text: ', requests: ' },
          { type: 'text', text: String(totalRequestsCount), style: { code: true } },
          { type: 'text', text: ', failed: ' },
          { type: 'text', text: `${totalAssertionsCount - totalPassedAssertionsCount}/${totalAssertionsCount}(${(100 * ((totalAssertionsCount - totalPassedAssertionsCount) / totalAssertionsCount)).toFixed(2)}%)`, style: { code: true } },
          { type: 'text', text: ', duration: ' },
          { type: 'text', text: millisecondsToTime(progress.runtimeInformation.runDurationMs), style: { code: true } },
          top5FailedTestCases.length > 0 && { type: 'text', text: ', top 5 failed test cases:\n' + top5FailedTestCases.map(tc => `• ${tc.name}: ${tc.failedAssertions}`).join('\n') }
        ].filter(Boolean)
      }]
    }]
  }

  slackBlocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: 'Testing Toolkit Report',
      emoji: true
    }
  })

  let summaryText = ''

  summaryText += '>Total assertions: *' + totalAssertionsCount + '*\n'
  summaryText += '>Passed assertions: *' + totalPassedAssertionsCount + '*\n'
  summaryText += '>Failed assertions: *' + (totalAssertionsCount - totalPassedAssertionsCount) + '*\n'
  summaryText += '>Total requests: *' + totalRequestsCount + '*\n'
  summaryText += '>Total test cases: *' + progress.test_cases.length + '*\n'
  summaryText += '>Passed percentage: *' + `${(100 * (totalPassedAssertionsCount / totalAssertionsCount)).toFixed(2)}%` + '*\n'
  summaryText += '>Started time: *' + progress.runtimeInformation.startedTime + '*\n'
  summaryText += '>Completed time: *' + progress.runtimeInformation.completedTime + '*\n'
  summaryText += '>Runtime duration: *' + `${progress.runtimeInformation.runDurationMs} ms` + '*\n'

  const additionalParams = {}
  if (totalAssertionsCount === totalPassedAssertionsCount) {
    if (config.slackPassedImage) {
      additionalParams.accessory = {
        type: 'image',
        image_url: config.slackPassedImage,
        alt_text: 'PASSED'
      }
    }
  } else {
    if (config.slackFailedImage) {
      additionalParams.accessory = {
        type: 'image',
        image_url: config.slackFailedImage,
        alt_text: 'FAILED'
      }
    }
  }
  let extramSummaryText = ''
  if (config.extraSummaryInformation) {
    const extraSummaryInformationArr = config.extraSummaryInformation.split(',')
    extraSummaryInformationArr.forEach(info => {
      const infoArr = info.split(':')
      extramSummaryText += infoArr[0] + ': `' + infoArr[1] + '`\n'
    })
  }
  slackBlocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*Test Result:*' + ((totalAssertionsCount === totalPassedAssertionsCount) ? ' `PASSED` ' : ' `FAILED` ') + '\n' + extramSummaryText + summaryText
    },
    ...additionalParams
  })
  if (reportURL) {
    slackBlocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '<' + reportURL + '|View Report>'
      }
    })
  }
  slackBlocks.push({
    type: 'divider'
  })
  return slackBlocks
}

/**
 * @param {FinalReport} progress
 * @param {string} reportURL - URL of the report
 */
const sendSlackNotification = async (progress, reportURL = 'http://localhost/') => {
  const { slackWebhookUrl, slackWebhookUrlForFailed } = config

  if (!slackWebhookUrl && !needToNotifyFailed(slackWebhookUrlForFailed, progress)) {
    console.log('No Slack webhook URLs configured.')
    return
  }
  const blocks = generateSlackBlocks(progress, reportURL)

  if (slackWebhookUrl) {
    await sendWebhook(slackWebhookUrl, 'Test Report', blocks)
  }

  if (needToNotifyFailed(slackWebhookUrlForFailed, progress)) {
    await sendWebhook(slackWebhookUrlForFailed, 'Failed Tests Report', blocks)
  }
}

const sendWebhook = async (url, text, blocks) => {
  const webhook = new IncomingWebhook(url)
  try {
    await webhook.send({ text, blocks })
    console.log('Slack notification sent.')
  } catch (err) {
    console.log('ERROR: Sending Slack notification failed. ', err.message)
  }
}

/**
 * Determines if a notification for failed tests needs to be sent.
 * @param {string | undefined} webhookUrl
 * @param {FinalReport} progress
 * @returns {boolean}
 */
const needToNotifyFailed = (webhookUrl, progress) => {
  return webhookUrl && (!progress?.runtimeInformation?.totalAssertions
    ? true
    : progress.runtimeInformation.totalPassedAssertions !== progress.runtimeInformation.totalAssertions)
}

module.exports = {
  sendSlackNotification,
  sendWebhook,
  needToNotifyFailed
}
