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
 * Georgi Logodazhki <georgi.logodazhki@modusbox.com> (Original Author)
 --------------
 ******/
const axios = require('axios').default
const report = require('../utils/report')
const logger = require('../utils/logger')
const fStr = require('node-strings')
const fs = require('fs')
const { promisify } = require('util')
const objectStore = require('../objectStore')
const slackBroadcast = require('../extras/slack-broadcast')
const releaseCd = require('../extras/release-cd')
const TemplateGenerator = require('../utils/templateGenerator')
const { TraceHeaderUtils } = require('@mojaloop/ml-testing-toolkit-shared-lib')

const totalProgress = {
  totalTestCases: 0,
  totalRequests: 0,
  totalAssertions: 0,
  passedAssertions: 0,
  skippedAssertions: 0,
  failedAssertions: 0
}

const updateTotalProgressCounts = (progress) => {
  if (progress.requestSent?.tests?.assertions) {
    progress.requestSent.tests.assertions.forEach(assertion => {
      if (progress.testResult.results[assertion.id].status === 'SUCCESS') {
        totalProgress.passedAssertions++
      } else if (progress.testResult.results[assertion.id].status === 'SKIPPED') {
        totalProgress.skippedAssertions++
      } else {
        totalProgress.failedAssertions++
      }
    })
  }

  if (totalProgress.totalTestCases === 0 && progress.totalProgress) {
    totalProgress.totalTestCases = progress.totalProgress.testCasesTotal
  }
  if (totalProgress.totalRequests === 0 && progress.totalProgress) {
    totalProgress.totalRequests = progress.totalProgress.requestsTotal
  }
  if (totalProgress.totalAssertions === 0 && progress.totalProgress) {
    totalProgress.totalAssertions = progress.totalProgress.assertionsTotal
  }
}

const printTotalProgressCounts = () => {
  const progressStr = '[ ' + fStr.green(totalProgress.passedAssertions + ' passed, ') + fStr.yellow(totalProgress.skippedAssertions + ' skipped, ') + fStr.red(totalProgress.failedAssertions + ' failed') + ' of ' + totalProgress.totalAssertions + ' ]'
  process.stdout.write(progressStr)
}

const determineTemplateName = (paths) => {
  let templateName
  // Find folders based on string format
  const folders = paths.filter(x => x.slice((x.lastIndexOf('.') - 1 >>> 0) + 2) === '')
  const config = objectStore.get('config')
  if (config.reportName) {
    templateName = config.reportName
  } else if (paths.length === 1) {
    // Sanitize file path for a suitable name
    templateName = paths[0]
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/^.+\.\//, '') // Remove relative paths
      .replace(/\\|\//g, '_') // Convert path to snake case
  // Ensure when a single folder is selected that all files belong to that folder
  } else if (folders.length === 1 && paths.every(filePath => filePath.includes(folders[0]))) {
    templateName = folders[0]
      .replace(/^.+\.\//, '') // Remove relative paths
      .replace(/\\|\//g, '_') // Convert path to snake case
  } else {
    templateName = 'test_run'
  }
  return templateName
}

const printProgress = (progress) => {
  const config = objectStore.get('config')
  switch (config.logLevel) {
    // Only Errors
    case '1':
    {
      printTotalProgressCounts()
      let failedAssertions = ''
      if (progress.requestSent && progress.requestSent.tests && progress.requestSent.tests.assertions) {
        progress.requestSent.tests.assertions.forEach(assertion => {
          if (progress.testResult.results[assertion.id].status !== 'SUCCESS') {
            failedAssertions += '\t' + fStr.red('[ ' + progress.testResult.results[assertion.id].status + ' ]') + '\t' + fStr.red(assertion.description) + '\n'
          }
        })
      }
      console.log('\n  ' + fStr.blue(progress.testCaseName + ' -> ' + progress.requestSent.description))
      if (failedAssertions) {
        console.log(failedAssertions)
      } else {
        console.log()
      }
      break
    }
    // All assertions
    case '2':
    {
      printTotalProgressCounts()
      console.log('\n  ' + fStr.cyan(progress.testCaseName + ' -> ' + progress.requestSent.description))
      /* istanbul ignore next */
      if (progress.status === 'SKIPPED') {
        console.log('  ' + fStr.yellow('(Request Skipped)'))
      }
      if (progress.requestSent && progress.requestSent.tests && progress.requestSent.tests.assertions) {
        progress.requestSent.tests.assertions.forEach(assertion => {
          if (progress.testResult.results[assertion.id].status === 'SUCCESS') {
            console.log('\t' + fStr.green('[ ' + progress.testResult.results[assertion.id].status + ' ]') + '\t' + fStr.green(assertion.description))
          } else if (progress.testResult.results[assertion.id].status === 'SKIPPED') {
            console.log('\t' + fStr.yellow('[ ' + progress.testResult.results[assertion.id].status + ' ]') + '\t' + fStr.yellow(assertion.description))
          } else {
            console.log('\t' + fStr.red('[ ' + progress.testResult.results[assertion.id].status + ' ]') + '\t' + fStr.red(assertion.description))
          }
        })
      }
      break
    }
    // Only Requests and test counts
    default:
      printTotalProgressCounts()
      console.log('\t' + fStr.blue(progress.testCaseName + ' -> ' + progress.requestSent?.description))
      break
  }
}

const sendTemplate = async (sessionId) => {
  const config = objectStore.get('config')
  try {
    const readFileAsync = promisify(fs.readFile)

    // Calculate the outbound request ID based on sessionId for catching progress notifications
    const traceIdPrefix = TraceHeaderUtils.getTraceIdPrefix()
    const currentEndToEndId = TraceHeaderUtils.generateEndToEndId()
    const outboundRequestID = traceIdPrefix + sessionId + currentEndToEndId

    const inputFiles = config.inputFiles.split(',')
    const selectedLabels = config.labels ? config.labels.split(',') : []
    const template = await TemplateGenerator.generateTemplate(inputFiles, selectedLabels)
    const environmentFileObj = JSON.parse(await readFileAsync(config.environmentFile, 'utf8'))
    template.inputValues = environmentFileObj.inputValues
    template.options = environmentFileObj.options || {}
    template.saveReport = config.saveReport
    template.name = determineTemplateName(inputFiles)
    template.options.breakOnError = (config.breakRunOnError === 'true')
    if (config.batchSize) template.batchSize = config.batchSize

    await axios.post(`${config.baseURL}/api/outbound/template/` + outboundRequestID, template, { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.log('error in sendTemplate:', err)
    process.exit(1)
  }
}

/**
 * Consolidated final report, created by generateFinalReport function (ml-testing-toolkit repo).
 * @typedef {Object} FinalReport
 * @property {RuntimeInformation} runtimeInformation - Provides metadata about the runtime environment or execution context.
 * @property {Array<Object>} test_cases - An array of objects where each object represents a test case and its results.
 * @property {string} status
 * @property {Object} totalResult
 * @property {Object} saveReportStatus
 * @property {unknown} [otherFields] - see ml-testing-toolkit repo.
 */

/**
 * @typedef {Object} RuntimeInformation
 * @property {string} testReportId - Test report ID
 * @property {string} completedTimeISO - Completed time in ISO format
 * @property {string} startedTime - Started time in readable format
 * @property {string} completedTime - Completed time in readable format
 * @property {string} completedTimeUTC - Completed time in UTC format
 * @property {number} startedTS - Started timestamp
 * @property {number} completedTS - Completed timestamp
 * @property {number} runDurationMs - Run duration in milliseconds
 * @property {number} totalAssertions - Total number of assertions
 * @property {number} totalPassedAssertions - Total number of passed assertions
 */

/**
 * Handles incoming progress updates and processes them as needed.
 * @param {FinalReport} progress
 * @returns {Promise<void>}
 */
const handleIncomingProgress = async (progress) => {
  const config = objectStore.get('config')
  const resultReport = await report.outbound(progress.totalResult)

  if (progress.status === 'FINISHED') {
    let passed
    try {
      passed = logger.outbound(progress.totalResult)
      // const resultReport = await report.outbound(progress.totalResult)
      let slackReportURL = resultReport.uploadedReportURL
      // SaveReport status
      /* istanbul ignore next */
      if (progress.totalResult?.saveReport) {
        if (progress.saveReportStatus?.isSaved) {
          slackReportURL = `${config.saveReportBaseUrl || config.baseURL}/api/history/test-reports/${progress.totalResult.runtimeInformation.testReportId}?format=html`
          console.log(fStr.green(`Report saved on TTK backend server successfully and is available at ${slackReportURL}`))
          if (!resultReport.uploadedReportURL) {
            resultReport.uploadedReportURL = slackReportURL
          }
        } else if (progress.saveReportStatus && !progress.saveReportStatus.isSaved) {
          console.log(fStr.red(`Report not saved: ${progress.saveReportStatus.message}`))
        }
      }
      try {
        await releaseCd(config.reportName, progress.totalResult, resultReport.uploadedReportURL)
      } catch (err) {
        /* istanbul ignore next */
        console.error(err)
      }
      await slackBroadcast.sendSlackNotification(progress.totalResult, slackReportURL)
    } catch (err) {
      console.log(err)
      passed = false
    }
    if (passed) {
      console.log(fStr.green('Terminate with exit code 0'))
      process.exit(0)
    } else {
      console.log(fStr.red('Terminate with exit code 1'))
      process.exit(1)
    }
  } else if (progress.status === 'TERMINATED') {
    console.log(fStr.red('Test execution terminated/timed out'))

    // Send notification about timeout with whatever progress data is available
    /* istanbul ignore next */
    try {
      const timeoutProgress = {
        ...(progress.totalResult || {}),
        terminatedDueToTimeout: true,
        timeoutMessage: 'Tests execution timed out before completion'
      }
      await slackBroadcast.sendSlackNotification(timeoutProgress, null)
    } catch (err) {
      console.log('Failed to send timeout notification:', err)
    }

    console.log(fStr.red('Terminate with exit code 1'))
    process.exit(1)
  } else {
    updateTotalProgressCounts(progress)
    printProgress(progress)
    console.log(fStr.green(`Not expected progress.status: ${progress?.status}`))
    await slackBroadcast.sendSlackNotification(progress?.totalResult, null)
  }
}

module.exports = {
  sendTemplate,
  handleIncomingProgress,
  determineTemplateName
}
