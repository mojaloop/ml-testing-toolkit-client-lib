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
IncomingWebhook.mockImplementationOnce(() => {
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

describe('Cli client', () => {
  describe('sendSlackNotification', () => {
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
  })

  describe('needToNotify Tests -->', () => {
    it('should not notify if slackWebhookUrl is not set', () => {
      expect(slackBroadCast.needToNotify({})).toBeFalsy()
    })

    it('should notify if slackWebhookUrl is set and slackOnlyFailed not', () => {
      const conf = { slackWebhookUrl: 'url' }
      expect(slackBroadCast.needToNotify(conf)).toBe(true)
    })

    it('should notify if slackWebhookUrl is set and slackOnlyFailed is false', () => {
      const conf = {
        slackWebhookUrl: 'url',
        slackOnlyFailed: false
      }
      expect(slackBroadCast.needToNotify(conf)).toBe(true)
    })

    it('should notify if slackOnlyFailed=true, and tests failed', () => {
      const conf = {
        slackWebhookUrl: 'url',
        slackOnlyFailed: true
      }
      const totalResult = {
        runtimeInformation: {
          totalPassedAssertions: 0,
          totalAssertion: 1
        }
      }
      expect(slackBroadCast.needToNotify(conf, totalResult)).toBe(true)
    })

    it('should notify if slackOnlyFailed=true, and tests passed', () => {
      const conf = {
        slackWebhookUrl: 'url',
        slackOnlyFailed: true
      }
      const totalResult = {
        runtimeInformation: {
          totalPassedAssertions: 1,
          totalAssertion: 1
        }
      }
      expect(slackBroadCast.needToNotify(conf, totalResult)).toBe(false)
    })

    it('should notify if slackOnlyFailed=true, but no totalResult.runtimeInformation', () => {
      const conf = {
        slackWebhookUrl: 'url',
        slackOnlyFailed: true
      }
      const totalResult = {}
      expect(slackBroadCast.needToNotify(conf, totalResult)).toBe(true)
    })
  })
})
