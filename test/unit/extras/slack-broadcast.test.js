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
'use strict'

const { IncomingWebhook } = require('@slack/webhook')
jest.mock('@slack/webhook')
const webhook = {
  send: async () => {}
}
IncomingWebhook.mockImplementation(() => {
  return webhook
})
const SpySlackSend = jest.spyOn(webhook, 'send')

const objectStore = require('../../../src/objectStore')
jest.mock('../../../src/objectStore')
const config = {
  slackPassedImage: 'asdf',
  slackFailedImage: 'asdf',
  extraSummaryInformation: "info1:value1,info2:value2"
}
objectStore.get.mockReturnValue(config)

const slackBroadCast = require('../../../src/extras/slack-broadcast')

const sampleProgress = {
  test_cases: [],
  runtimeInformation: {}
}
const sampleReportURL = 'asdf'

const resetSampleProgress = () => {
  sampleProgress.test_cases = []
  sampleProgress.runtimeInformation = {}
}

describe('Cli client', () => {
  describe('sendSlackNotification', () => {
    beforeEach(() => {
      SpySlackSend.mockReset()
      resetSampleProgress()
      config.slackWebhookUrl = null
      config.slackWebhookUrlForFailed = null
      config.briefSummaryPrefix = undefined
      config.reportName = 'Report'
      config.extraSummaryInformation = 'info1:value1,info2:value2'
      config.slackPassedImage = 'asdf'
      config.slackFailedImage = 'asdf'
    })

    it('When slackWebhookUrl config is null, it should do nothing', async () => {
      config.slackWebhookUrl = null
      SpySlackSend.mockResolvedValueOnce(null)
      await expect(slackBroadCast.sendSlackNotification(sampleProgress)).resolves.toBe(undefined)
    })
    it('When slackWebhookUrl config is set, it should call slack send function', async () => {
      config.slackWebhookUrl = 'http://some_url'
      SpySlackSend.mockResolvedValueOnce(null)
      await expect(slackBroadCast.sendSlackNotification(sampleProgress)).resolves.toBe(undefined)
      expect(SpySlackSend).toHaveBeenCalledWith(expect.objectContaining({
        text: expect.any(String),
        blocks: expect.any(Array)
      }))
    })
    it('When reportURL is set, it should call slack send function', async () => {
      config.slackWebhookUrl = 'http://some_url'
      SpySlackSend.mockResolvedValueOnce(null)
      await expect(slackBroadCast.sendSlackNotification(sampleProgress, sampleReportURL)).resolves.toBe(undefined)
      expect(SpySlackSend).toHaveBeenCalledWith(expect.objectContaining({
        text: expect.any(String),
        blocks: expect.any(Array)
      }))
    })
    it('When the progress contains testCases, it should call slack send function', async () => {
      config.slackWebhookUrl = 'http://some_url'
      sampleProgress.test_cases = [
        {
          requests: [
            {
              request: {
                tests: {
                  assertions: [],
                  passedAssertionsCount: 0
                }
              }
            }
          ]
        }
      ]
      SpySlackSend.mockResolvedValueOnce(null)
      await expect(slackBroadCast.sendSlackNotification(sampleProgress)).resolves.toBe(undefined)
      expect(SpySlackSend).toHaveBeenCalledWith(expect.objectContaining({
        text: expect.any(String),
        blocks: expect.any(Array)
      }))
      SpySlackSend.mockResolvedValueOnce(null)
      config.briefSummaryPrefix = 'brief'
      await expect(slackBroadCast.sendSlackNotification(sampleProgress)).resolves.toBe(undefined)
      expect(SpySlackSend).toHaveBeenCalledWith(expect.objectContaining({
        text: expect.any(String),
        blocks: expect.any(Array)
      }))
    })
    it('When failed case, it should call slack send function', async () => {
      config.slackWebhookUrl = 'http://some_url'
      sampleProgress.test_cases = [
        {
          requests: [
            {
              request: {
                tests: {
                  assertions: [{}],
                  passedAssertionsCount: 0
                }
              }
            }
          ]
        }
      ]
      SpySlackSend.mockResolvedValueOnce(null)
      await expect(slackBroadCast.sendSlackNotification(sampleProgress)).resolves.toBe(undefined)
      expect(SpySlackSend).toHaveBeenCalledWith(expect.objectContaining({
        text: expect.any(String),
        blocks: expect.any(Array)
      }))
    })

    it('When all assertions pass, it should include passed accessory and skipped assertions in summary', async () => {
      config.briefSummaryPrefix = undefined
      config.slackWebhookUrl = 'http://some_url'
      sampleProgress.test_cases = [
        {
          requests: [
            {
              request: {
                tests: {
                  assertions: [
                    { resultStatus: { status: 'SUCCESS' } },
                    { resultStatus: { status: 'SUCCESS' } }
                  ]
                }
              }
            }
          ]
        }
      ]
      sampleProgress.runtimeInformation = {
        startedTime: 'start',
        completedTime: 'end',
        runDurationMs: 1000
      }

      SpySlackSend.mockResolvedValueOnce(null)
      await expect(slackBroadCast.sendSlackNotification(sampleProgress)).resolves.toBe(undefined)

      const sendPayload = SpySlackSend.mock.calls[SpySlackSend.mock.calls.length - 1][0]
      expect(sendPayload.blocks[1].accessory.alt_text).toBe('PASSED')
      expect(sendPayload.blocks[1].text.text).toContain('Skipped assertions')
    })

    it('When failed notification webhook is configured and failures exist, it should send failed tests report', async () => {
      config.slackWebhookUrl = null
      config.slackWebhookUrlForFailed = 'http://failed_url'
      sampleProgress.runtimeInformation = {
        totalFailedAssertions: 1
      }

      SpySlackSend.mockResolvedValueOnce(null)
      await expect(slackBroadCast.sendSlackNotification(sampleProgress)).resolves.toBe(undefined)

      expect(SpySlackSend).toHaveBeenCalledWith(expect.objectContaining({
        text: 'Failed Tests Report',
        blocks: expect.any(Array)
      }))
    })

    it('When webhook send fails, it should swallow error and log it', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      config.slackWebhookUrl = 'http://some_url'
      config.slackWebhookUrlForFailed = null
      sampleProgress.runtimeInformation = {
        startedTime: 'start',
        completedTime: 'end',
        runDurationMs: 1000
      }

      SpySlackSend.mockRejectedValueOnce(new Error('send-failed'))
      await expect(slackBroadCast.sendSlackNotification(sampleProgress)).resolves.toBe(undefined)

      expect(consoleSpy).toHaveBeenCalledWith('ERROR: Sending Slack notification failed. ', 'send-failed')
      consoleSpy.mockRestore()
    })
  })

  describe('needToNotifyFailed Tests -->', () => {
    it('should not notify if slackWebhookUrlForFailed is not configured', () => {
      expect(slackBroadCast.needToNotifyFailed(undefined, {})).toBeFalsy()
    })

    it('should notify if webhookUrl is set, but no progress.runtimeInformation info', () => {
      expect(slackBroadCast.needToNotifyFailed('url', {})).toBe(true)
    })

    it('should NOT notify success tests', () => {
      expect(slackBroadCast.needToNotifyFailed('url', {
        runtimeInformation: {
          totalAssertions: 1,
          totalPassedAssertions: 1
        }
      })).toBe(false)
    })

    it('should notify in case failed tests', () => {
      expect(slackBroadCast.needToNotifyFailed('url', {
        runtimeInformation: {
          totalAssertions: 1,
          totalPassedAssertions: 0
        }
      })).toBe(true)
    })

    it('should NOT notify when failures are zero after skipped assertions are excluded', () => {
      expect(slackBroadCast.needToNotifyFailed('url', {
        runtimeInformation: {
          totalAssertions: 3,
          totalPassedAssertions: 2,
          totalSkippedAssertions: 1
        }
      })).toBe(false)
    })

    it('should honor totalFailedAssertions when provided', () => {
      expect(slackBroadCast.needToNotifyFailed('url', {
        runtimeInformation: {
          totalFailedAssertions: 0
        }
      })).toBe(false)
      expect(slackBroadCast.needToNotifyFailed('url', {
        runtimeInformation: {
          totalFailedAssertions: 2
        }
      })).toBe(true)
    })

    it('should notify when runtime information exists but totals are not usable', () => {
      expect(slackBroadCast.needToNotifyFailed('url', {
        runtimeInformation: {
          totalAssertions: 'unknown'
        }
      })).toBe(true)
    })
  })
})
