Mojaloop Testing Toolkit Client Library and Tools
=================================================

This package is intended to provide various clients and tools to connect with **Mojaloop Testing Toolkit** instead of using web interface.

For additional back ground information on the `Mojaloop Testing Toolkit`, please see [Mojaloop Testing Toolkit Documentation](https://github.com/mojaloop/ml-testing-toolkit/blob/main/documents/User-Guide.md). It would be to the particpant's benefit to familiarise themselves with the understanding of the  [Architecture Diagram](https://github.com/mojaloop/ml-testing-toolkit/blob/main/documents/Mojaloop-Testing-Toolkit.md#7-architecture) that explains the various components and related flows.

## Testing Toolkit Command Line Client

The **Mojaloop Testing Toolkit CLI** is a command line client for connecting to "Mojaloop Testing Toolkit" to perform various operations (Mainly to execute test cases). It can be used in automation systems like CICD and IaC.

**Table of Contents**

- [Mojaloop Testing Toolkit Client Library and Tools](#mojaloop-testing-toolkit-client-library-and-tools)
  - [Testing Toolkit Command Line Client](#testing-toolkit-command-line-client)
    - [1. Getting Started](#1-getting-started)
      - [1.1 Installation](#11-installation)
      - [1.2 Usage](#12-usage)
    - [2. Command Reference](#2-command-reference)
      - [2.1 Help screen](#21-help-screen)
      - [2.2 Monitoring Mode](#22-monitoring-mode)
      - [2.3 Outbound Mode](#23-outbound-mode)
      - [Default values](#default-values)
      - [Exit codes](#exit-codes)
      - [Example](#example)
      - [2.4 AWS S3 Upload](#24-aws-s3-upload)
      - [2.5 Slack Notification](#25-slack-notification)
  - [Auditing Dependencies](#auditing-dependencies)
  - [Container Scans](#container-scans)
  - [Automated Releases](#automated-releases)

### 1. Getting Started

#### 1.1 Installation

The easiest way to use `Testing Toolkit Command Line Client` is to install it globally as a
Node command line program. Run the following command in Terminal:

```bash
npm install @mojaloop/ml-testing-toolkit-client-lib --global
```

Or, you can install `@mojaloop/ml-testing-toolkit-client-lib` locally, for use in a single project:

```bash
npm install @mojaloop/ml-testing-toolkit-client-lib --save-dev
```

*Note: To run the preceding commands, [Node.js](http://nodejs.org) and [npm](https://npmjs.com) must be installed.*

#### 1.2 Usage

After you've installed `@mojaloop/ml-testing-toolkit-client-lib`, you should be able to use the following command.
```
ml-ttk-cli
```
**_If this command is not found, you should add the folder path of npm global modules to your PATH._

### 2. Command Reference

#### 2.1 Help screen

The help screen allows you to see the usage, possible options and default values

command:

```
ml-ttk-cli -h
```

output:

```
Usage: client [options]

Options:
  -v, --version                                             output the version number
  -c, --config <config>                                     default configuration: {"mode": "outbound", "reportFormat": "json"}
  -m, --mode <mode>                                         default: "outbound" --- supported modes: "monitoring", "outbound"
  -u, --base-url <baseUrl>                                  default: "http://localhost:5050"
  -i, --input-files <inputFiles>                            csv list of json files or directories; required when the mode is "outbound" --- supported formats: "json"
  -e, --environment-file <environmentFile>                  required when the mode is "outbound" --- supported formats: "json"
  -s, --save-report <saveReport>                            To save the report on TTK backend server. default: false --- supported values: "false/true"
  -n, --report-name <reportName>                            Specify the name of report on TTK backend server.
  --save-report-base-url <saveReportBaseUrl>                Incase if the base-url is not accessible publicly, this option replaces the base URL in the report URLs published in console log and slack messages  default: same as base-url
  --report-format <reportFormat>                            default: "json" --- supported formats: "json", "html", "printhtml"
  --report-auto-filename-enable <reportAutoFilenameEnable>  default: false, if true the file name will be generated by the backend
  --report-target <reportTarget>                            default: "file://<file_name_generated_by_backend>"  --- supported targets: "file://path_to_file", "s3://<bucket_name>[/<file_path>]"
  --slack-webhook-url <slackWebhookUrl>                     default: "Disabled"  --- supported formats: "https://....."
  -h, --help                                                output usage information

 *** If the option report-target is set to use AWS S3 service, the variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION) should be passed in environment
```

#### 2.2 Monitoring Mode

The monitoring mode allows you to monitor _incoming_ requests from the **Mojaloop Simulator**.

Example:

command:

```
ml-ttk-cli -m monitoring
```

output:

```
Listening on newLog events...
2020-05-12T12:23:32.988Z INFO   (15892862129885sy33i)   Request: post /bulkTransfers
{
  "request": {
    "uniqueId": "15892862129885sy33i",
    "headers": {
      "content-type": "application/vnd.interoperability.parties+json;version=1.0",
      "accept": "application/vnd.interoperability.parties+json;version=1.0",
      "fspiop-source": "testingtoolkitdfsp",
      "date": "Tue, 12 May 2020 12:23:32 GMT",
      "user-agent": "axios/0.19.2",
      "content-length": "256",
      "host": "localhost:5000",
      "connection": "close"
    },
    "body": {
      "bulkTransferId": "202137c6-2ca9-429d-b03b-41d5cf19258c",
      "bulkQuoteId": "8823f09e-728c-4e04-b718-d17a24e55bb0",
      "payerFsp": "string",
      "payeeFsp": "string",
      "expiration": "2020-01-01T10:10:10.000Z",
      "extensionList": {
        "extension": [
          {
            "key": "string",
            "value": "string"
          }
        ]
      }
    }
  }
}
```

You could Send Transfer from postman or execute outbound mode with an example from examples/test-cases folder

#### 2.3 Outbound Mode

This sections will enable you to intiate requests from the cli to your DFSP implementation.

The user can create a collection of operations and add a number of assertions to these operations. The assertions can be setup and customized to support your testing requirements and verify both positive and negative requests and responses.

#### Default values

mode:
  - outbound
reportFormat:
  - json
reportName:
  - when reportFormat is json: ${test-name}-${date-now}.json
  - when reportFormat is html/printhtml format: value is generated by the service responsible for converting the json to the given format

#### Exit codes

The CLI tool is able to return the proper exit codes in case of success and failures. This will enable this tool to use in automation systems (CICD).

  - 0: all assertions passed
  - 1: there is at least 1 failed assertion

#### Example

command:

```
ml-ttk-cli -m outbound -i examples/collections/dfsp/p2p_happy_path.json -e examples/environments/dfsp_local_environment.json --report-format html
```

output:

```
Listening on outboundProgress events...
 ████████████████████████████████████████ 100% | ETA: 0s | 3/3
--------------------TEST CASES--------------------
P2P Transfer Happy Path
        Get party information - GET - /parties/{Type}/{ID} - [8/8]
        Send quote - POST - /quotes - [11/11]
        Send transfer - POST - /transfers - [9/9]
--------------------TEST CASES--------------------
┌───────────────────────────────────────────────────────┐
│                        SUMMARY                        │
├───────────────────────┬───────────────────────────────┤
│ Total assertions      │ 28                            │
├───────────────────────┼───────────────────────────────┤
│ Passed assertions     │ 28                            │
├───────────────────────┼───────────────────────────────┤
│ Failed assertions     │ 0                             │
├───────────────────────┼───────────────────────────────┤
│ Total requests        │ 3                             │
├───────────────────────┼───────────────────────────────┤
│ Total test cases      │ 1                             │
├───────────────────────┼───────────────────────────────┤
│ Passed percentage     │ 100.00%                       │
├───────────────────────┼───────────────────────────────┤
│ Started time          │ Mon, 01 Jun 2020 14:46:20 GMT │
├───────────────────────┼───────────────────────────────┤
│ Completed time        │ Mon, 01 Jun 2020 14:46:21 GMT │
├───────────────────────┼───────────────────────────────┤
│ Runtime duration      │ 832 ms                        │
├───────────────────────┼───────────────────────────────┤
│ Average response time │ NA                            │
└───────────────────────┴───────────────────────────────┘
TTK-Assertion-Report-dfsp-p2p-tests-2020-06-01T14:46:21.303Z.html was generated
Terminate with exit code 0
```

You will find a report in the project folder - 'TTK-Assertion-Report-{collection-name}-{ISO-date}.{report-format}'

#### 2.4 AWS S3 Upload

You can choose to upload the generated report to AWS S3 at the end of tests execution.

Use the command line option **'--report-target'** to specify the target in the format `s3://<bucket_name>/<object_key>`

You can use the option **'--report-auto-filename-enable'** to replace the file name specified in the target with an auto generated file name.

To use AWS S3 service, the following environment variables should be set with proper credentials
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION

Example Command:

```
ml-ttk-cli -m outbound -i examples/collections/dfsp/p2p_happy_path.json -e examples/environments/dfsp_local_environment.json --report-format html --report-auto-filename-enable true --report-target s3://qa-reports-bucket/reports-folder/report-name.html
```

#### 2.5 Slack Notification

You can choose to notify over a slack channel after a completed tests execution.
For this, you have to generate your `slack webhook` in slack portal and provide the webhook URL by the command line option **'--slack-webhook-url'**

If the S3 option is also set, then a link to the uploaded report will be sent in the slack notification.

Example Command:

```
ml-ttk-cli -m outbound -i examples/collections/dfsp/p2p_happy_path.json -e examples/environments/dfsp_local_environment.json --slack-webhook-url=https://hooks.slack.com/services/blablabla...
```

-------

## Auditing Dependencies

We use `npm-audit-resolver` along with `npm audit` to check dependencies for node vulnerabilities, and keep track of resolved dependencies with an `audit-resolve.json` file.

To start a new resolution process, run:

```bash
npm run audit:resolve
```

You can then check to see if the CI will pass based on the current dependencies with:

```bash
npm run audit:check
```

And commit the changed `audit-resolve.json` to ensure that CircleCI will build correctly.

## Container Scans

As part of our CI/CD process, we use anchore-cli to scan our built docker container for vulnerabilities upon release.

If you find your release builds are failing, refer to the [container scanning](https://github.com/mojaloop/ci-config#container-scanning) in our shared Mojaloop CI config repo. There is a good chance you simply need to update the `mojaloop-policy-generator.js` file and re-run the circleci workflow.

For more information on anchore and anchore-cli, refer to:
- [Anchore CLI](https://github.com/anchore/anchore-cli)
- [Circle Orb Registry](https://circleci.com/orbs/registry/orb/anchore/anchore-engine)

## Automated Releases

As part of our CI/CD process, we use a combination of CircleCI, standard-version
npm package and github-release CircleCI orb to automatically trigger our releases
and image builds. This process essentially mimics a manual tag and release.

On a merge to main, CircleCI is configured to use the mojaloopci github account
to push the latest generated CHANGELOG and package version number.

Once those changes are pushed, CircleCI will pull the updated main, tag and
push a release triggering another subsequent build that also publishes a docker image.
