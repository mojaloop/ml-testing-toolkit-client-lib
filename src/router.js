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

 * Infitx
 * Vijaya Kumar Guthi <vijaya.guthi@infitx.com>
 --------------
 ******/

const fs = require('node:fs')
const _ = require('lodash')
const { TraceHeaderUtils } = require('@mojaloop/ml-testing-toolkit-shared-lib')
const { EXIT_CODES, TESTS_EXECUTION_TIMEOUT } = require('./constants')
const objectStore = require('./objectStore')
const { completeRun } = require('./utils/run-completion')

const cli = (commanderOptions) => {
  const configFile = {
    mode: 'outbound',
    reportFormat: 'none',
    baseURL: 'http://localhost:5050',
    logLevel: '0',
    reportAutoFilenameEnable: false,
    breakRunOnError: false,
    saveReport: false,
    saveReportBaseUrl: null
  }

  if (commanderOptions.config && fs.existsSync(commanderOptions.config)) {
    const newConfig = JSON.parse(fs.readFileSync(commanderOptions.config, 'utf8'))
    _.merge(configFile, newConfig)
  }

  const config = {
    mode: commanderOptions.mode || configFile.mode,
    inputFiles: commanderOptions.inputFiles,
    logLevel: commanderOptions.logLevel || configFile.logLevel,
    breakRunOnError: commanderOptions.breakRunOnError === 'true' || configFile.breakRunOnError,
    saveReport: commanderOptions.saveReport === 'true' || configFile.saveReport,
    saveReportBaseUrl: commanderOptions.saveReportBaseUrl || configFile.saveReportBaseUrl,
    reportName: commanderOptions.reportName,
    environmentFile: commanderOptions.environmentFile,
    reportFormat: commanderOptions.reportFormat || configFile.reportFormat,
    reportAutoFilenameEnable: commanderOptions.reportAutoFilenameEnable === 'true' || configFile.reportAutoFilenameEnable === true,
    reportTarget: commanderOptions.reportTarget || configFile.reportTarget,
    s3: configFile.s3 || {},
    reportFolder: commanderOptions.reportFolder || configFile.reportFolder,
    slackWebhookUrl: commanderOptions.slackWebhookUrl || configFile.slackWebhookUrl,
    slackWebhookUrlForFailed: commanderOptions.slackWebhookUrlForFailed || configFile.slackWebhookUrlForFailed,
    slackPassedImage: configFile.slackPassedImage,
    slackFailedImage: configFile.slackFailedImage,
    baseURL: commanderOptions.baseUrl || configFile.baseURL,
    extraSummaryInformation: commanderOptions.extraSummaryInformation || configFile.extraSummaryInformation,
    briefSummaryPrefix: commanderOptions.briefSummaryPrefix || configFile.briefSummaryPrefix,
    labels: commanderOptions.labels || configFile.labels,
    batchSize: commanderOptions.batchSize || configFile.batchSize || parseInt(process.env.TESTCASES_BATCH_SIZE, 10),
    exitOnComplete: commanderOptions.exitOnComplete !== false,
    onComplete: commanderOptions.onComplete
  }

  objectStore.set('config', config)

  switch (config.mode) {
    case 'monitoring':
      require('./utils/listeners').monitoring()
      break
    case 'outbound':
      if (config.inputFiles) {
        if (config.environmentFile) {
          // Generate a session ID
          const sessionId = TraceHeaderUtils.generateSessionId()
          require('./utils/listeners').outbound(sessionId)
          const { sendTemplate, handleTimeout } = require('./modes/outbound')
          Promise.resolve(sendTemplate(sessionId)).catch((err) => {
            console.log('error in sendTemplate:', err)
            completeRun({
              code: EXIT_CODES.failure,
              reason: 'send_template_failed',
              error: err
            })
          })
          setTimeout(async () => {
            await handleTimeout()
            completeRun({
              code: EXIT_CODES.timeout,
              reason: 'tests_execution_timeout'
            })
          }, TESTS_EXECUTION_TIMEOUT)
        } else {
          console.log('error: required option \'-e, --environment-file <environmentFile>\' not specified')
          completeRun({
            code: EXIT_CODES.failure,
            reason: 'missing_environment_file'
          })
        }
      } else {
        console.log('error: required option \'-i, --input-files <inputFiles>\' not specified')
        completeRun({
          code: EXIT_CODES.failure,
          reason: 'missing_input_files'
        })
      }
      break
    case 'testcaseDefinitionReport':
      if (config.inputFiles) {
        if (!commanderOptions.reportFormat) {
          config.reportFormat = 'printhtml'
          objectStore.set('config', config)
        }
        require('./modes/testcaseDefinitionReport').download()
      } else {
        console.log('error: required option \'-i, --input-files <inputFiles>\' not specified')
        completeRun({
          code: EXIT_CODES.failure,
          reason: 'missing_input_files'
        })
      }
      break
    default:
      console.log('Mode is not supported')
      console.log('Terminate with exit code 1')
      completeRun({
        code: EXIT_CODES.failure,
        reason: 'unsupported_mode'
      })
  }
}

module.exports = {
  cli
}
