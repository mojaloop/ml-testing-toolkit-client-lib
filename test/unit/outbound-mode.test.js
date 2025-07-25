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
'use strict'

const axios = require('axios')
const spyReport = jest.spyOn(require('../../src/utils/report'), 'outbound')
const spyLogger = jest.spyOn(require('../../src/utils/logger'), 'outbound')
const spyExit = jest.spyOn(process, 'exit')
const spyAxios = jest.spyOn(axios, 'post')
const spyPromisify = jest.spyOn(require('util'), 'promisify')
const objectStore = require('../../src/objectStore')

const outbound = require('../../src/modes/outbound')
const spyGenerateTemplate = jest.spyOn(require('../../src/utils/templateGenerator'), 'generateTemplate')

describe('Cli client', () => {
  describe('run outbound mode', () => {
    it('when status is FINISHED and assertion passed should not throw an error', async () => {
      const progress = {
        "status": "FINISHED"
      }
      spyReport.mockReturnValueOnce({})
      spyLogger.mockReturnValueOnce(true)
      spyExit.mockReturnValueOnce({})
      expect(() => {
        outbound.handleIncomingProgress(progress)
      }).not.toThrow()
    })
    it('when status is FINISHED, assertions passed and there is an error should not throw an error', async () => {
      const progress = {
        "status": "FINISHED"
      }
      spyReport.mockImplementationOnce(() => {throw new Error('expected error')})
      spyLogger.mockReturnValueOnce(true)
      spyExit.mockReturnValueOnce({})
      expect(() => {
        outbound.handleIncomingProgress(progress)
      }).not.toThrow()
    })
    it('when status is FINISHED and assertions failed should not throw an error', async () => {
      const progress = {
        "status": "FINISHED"
      }
      spyReport.mockReturnValueOnce({})
      spyLogger.mockReturnValueOnce(false)
      spyExit.mockReturnValueOnce({})
      expect(() => {
        outbound.handleIncomingProgress(progress)
      }).not.toThrow()
    })
    it('when status is not FINISHED should not throw an error', async () => {
      const progress = {
        "status": "IN PROGRESS"
      }
      spyExit.mockReturnValueOnce({})
      expect(() => {
        outbound.handleIncomingProgress(progress)
      }).not.toThrow()
    })
  })
  describe('when status is not FINISHED should not throw an error where there are assertions', () => {
    const progress = {
      "status": "IN PROGRESS",
      requestSent: {
        tests: {
          assertions: [
            {
              id: 1
            },
            {
              id: 2
            },
            {
              id: 3              }
          ]
        }
      },
      testResult: {
        results: {
          1: {
            status: 'SUCCESS'
          },
          2: {
            status: 'SKIPPED'
          },
          3: {
            status: 'FAILED'
          }
        }
      }
    }
    it('Without loglevel', async () => {
      const config = {
        inputFiles: "sample-cli.json",
        environmentFile: "sample-environement.json",
      }
      objectStore.set('config', config)

      spyExit.mockReturnValueOnce({})
      expect(() => {
        outbound.handleIncomingProgress(progress)
      }).not.toThrow()
    })
    it('With loglevel 1', async () => {
      const config = {
        inputFiles: "sample-cli.json",
        environmentFile: "sample-environement.json",
        logLevel: '1'
      }
      objectStore.set('config', config)

      spyExit.mockReturnValueOnce({})
      expect(() => {
        outbound.handleIncomingProgress(progress)
      }).not.toThrow()
    })
    it('With loglevel 2', async () => {
      const config = {
        inputFiles: "sample-cli.json",
        environmentFile: "sample-environement.json",
        logLevel: '2'
      }
      objectStore.set('config', config)

      spyExit.mockReturnValueOnce({})
      expect(() => {
        outbound.handleIncomingProgress(progress)
      }).not.toThrow()
    })
  })
  describe('run sendTemplate', () => {
    it('when generateTemplate is successful should not throw an error', async () => {
      spyPromisify.mockReturnValueOnce(() => {
        return JSON.stringify({
          "inputValues": {},
          "options": {}
        })
      })
      const config = {
        inputFiles: "sample-cli.json",
        environmentFile: "sample-environement.json"
      }
      spyGenerateTemplate.mockResolvedValueOnce({
        "test_cases": [
          {
            "requests": []
          }
        ]
      })
      objectStore.set('config', config)

      spyAxios.mockResolvedValueOnce({})
      await expect(outbound.sendTemplate()).resolves.toBe(undefined)
    })
    it('when generateTemplate failed should throw an error', async () => {
      spyPromisify.mockReturnValueOnce(() => {
        return JSON.stringify({
          "inputValues": {},
          "options": {}
        })
      })
      const config = {
        inputFiles: "sample-cli.json",
        environmentFile: "sample-environement.json"
      }
      spyGenerateTemplate.mockRejectedValueOnce({})
      objectStore.set('config', config)

      spyAxios.mockReturnValue({})
      await expect(outbound.sendTemplate()).resolves.toBe(undefined)
    })
  })
  describe('run determineTemplateName', () => {
    it('when determineTemplateName is given a list with a single file it should use the file as the template name', () => {
      const paths = ['sample-cli.json']
      const name = outbound.determineTemplateName(paths)
      expect(name).toBe('sample-cli')
    })
    it('when determineTemplateName is given a list with a single file path it converts to snakecase', () => {
      const paths = ['docs/sample-cli.json']
      const name = outbound.determineTemplateName(paths)
      expect(name).toBe('docs_sample-cli')
    })
    it('when determineTemplateName is given a list with a relative path it is santitized', () => {
      const paths = ['../sample-cli.json']
      const name = outbound.determineTemplateName(paths)
      expect(name).toBe('sample-cli')
    })
    it('when determineTemplateName is given a list with a single folder and the children', () => {
      const paths = ['docs' , 'docs/sample-cli.json']
      const name = outbound.determineTemplateName(paths)
      expect(name).toBe('docs')
    })
    it('when determineTemplateName is run with cli flag reportName set the template sets that name', () => {
      const paths = ['docs' , 'docs/sample-cli.json']
      const config = {
        reportName: "my-test-report",
      }
      objectStore.set('config', config)

      const name = outbound.determineTemplateName(paths)
      expect(name).toBe('my-test-report')
    })
    it('when determineTemplateName is run with no reportName set and mixture of files and folder paths', () => {
      const paths = ['docs' , 'docs/sample-cli.json', 'next-test.json']
      const config = {}
      objectStore.set('config', config)

      const name = outbound.determineTemplateName(paths)
      expect(name).toBe('test_run')
    })
  })
})
