/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation

 * Infitx
 - Kalin Krustev <kalin.krustev@infitx.com> (Original Author)
 --------------
 ******/

const rc = require('rc')
jest.mock('rc')
const axios = require('axios')
jest.spyOn(axios, 'default')
axios.default.mockImplementation(() => Promise.resolve({}))

const config = {}
rc.mockImplementation(() => config)

const releaseCd = require('../../../src/extras/release-cd')

describe('Release CD', () => {
  describe('Post test results', () => {
    it('Posts test result to configured URL', async () => {
      const name = 'test'
      const result = {}
      config.reportUrl = 'http://example.com'
      await releaseCd(name, result)
      expect(axios.default).toHaveBeenCalledWith({
        method: 'post',
        url: 'http://example.com',
        data: {
          [`tests.${name}`]: result
        }
      })
    })
    it('Does not post test result if no report URL is configured', async () => {
      const name = 'test'
      const result = {}
      config.reportUrl = undefined
      axios.default.mockClear()
      await releaseCd(name, result)
      expect(axios.default).not.toHaveBeenCalled()
    })
  })
})
