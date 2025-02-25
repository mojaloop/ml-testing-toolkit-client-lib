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
const { program } = require('commander')
const router = require('./router')

program
  .version('1.0.0', '-v, --version')
  .option('-c, --config <config>', 'default configuration: {"mode": "outbound", "reportFormat": "json"}')
  .option('-m, --mode <mode>', 'default: "outbound" --- supported modes: "monitoring", "outbound", "testcaseDefinitionReport"')
  .option('-u, --base-url <baseUrl>', 'default: "http://localhost:5050"')
  .option('-i, --input-files <inputFiles>', 'csv list of json files or directories; required when the mode is "outbound" --- supported formats: "json"')
  .option('-e, --environment-file <environmentFile>', 'required when the mode is "outbound" --- supported formats: "json"')
  .option('-l, --log-level <logLevel>', 'default: 0 --- supported levels: "0-Show only requests and assertion counts, 1-Show failed assertions only, 2-Show all assertions"')
  .option('-b, --break-run-on-error <breakRunOnError>', 'default: false --- supported values: "false/true"')
  .option('-s, --save-report <saveReport>', 'To save the report on TTK backend server. default: false --- supported values: "false/true"')
  .option('-n, --report-name <reportName>', 'Specify the name of report on TTK backend server. default: "test_run"')
  .option('--batch-size <N>', 'determines a size of batches to run test cases. By default, test cases are run one by one. Optional')
  .option('--save-report-base-url <saveReportBaseUrl>', 'Incase if the base-url is not accessible publicly, this option replaces the base URL in the report URLs published in console log and slack messages  default: same as base-url. default: same as base-url')
  .option('--labels <labels>', 'csv list of labels, examples: "p2p,settlements,quotes"')
  .option('--report-format <reportFormat>', 'default: "none" --- supported formats: "none", "json", "html", "printhtml"')
  .option('--report-auto-filename-enable <reportAutoFilenameEnable>', 'default: false, if true the file name will be generated by the backend')
  .option('--report-target <reportTarget>', 'default: "file://<file_name_genrated_by_backend>"  --- supported targets: "file://path_to_file", "s3://<bucket_name>[/<file_path>]"')
  .option('--slack-webhook-url <slackWebhookUrl>', 'default: "Disabled"  --- supported formats: "https://....."')
  .option('--extra-summary-information <Comma separated values in the format key:value>', 'default: none  --- example: "Testcase Name:something,Environment:Dev1"')
  .on('--help', () => { // Extra information on help message
    console.log('')
    console.log(' *** If the option report-target is set to use AWS S3 service, the variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) should be passed in environment')
    console.log('      ')
  })
  .parse(process.argv)

router.cli(program.opts())
