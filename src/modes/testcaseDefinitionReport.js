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

const report = require('../utils/report')
const fStr = require('node-strings')
const utils = require('../utils/file-utils.js')
const objectStore = require('../objectStore')
const templateGenerator = require('../utils/templateGenerator')

const download = async () => {
  const config = objectStore.get('config')
  try {
    const inputFiles = config.inputFiles.split(',')
    const selectedLabels = config.labels ? config.labels.split(',') : null
    const template = await templateGenerator.generateTemplate(inputFiles, selectedLabels)
    if (config.environmentFile) {
      const environmentFileContent = await utils.readFileAsync(config.environmentFile, 'utf8')
      const environmentFileContentObj = JSON.parse(environmentFileContent)
      template.inputValues = environmentFileContentObj.inputValues
      template.options = environmentFileContentObj.options
    }
    await report.testcaseDefinition(template)
    console.log(fStr.green('Terminate with exit code 0'))
    process.exit(0)
  } catch (err) {
    console.log(err)
    console.log(fStr.red('Terminate with exit code 1'))
    process.exit(1)
  }
}

module.exports = {
  download
}
