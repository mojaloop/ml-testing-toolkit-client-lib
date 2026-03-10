'use strict'

const { run } = require('../../src')

describe('Integration: Library', () => {
  it('success: resolves with a structured success result', async () => {
    const result = await run({
      mode: 'testcaseDefinitionReport',
      inputFiles: 'test/integration/fixtures/valid-testcase-template.json',
      reportFormat: 'none'
    })

    expect(result).toMatchObject({
      code: 0,
      mode: 'testcaseDefinitionReport',
      status: 'FINISHED',
      reason: 'testcase_definition_report_generated'
    })
  })

  it('negative: resolves failure result for unsupported mode', async () => {
    const result = await run({ mode: 'unsupported' })

    expect(result).toMatchObject({
      code: 1,
      mode: 'unsupported',
      status: 'FAILED',
      reason: 'unsupported_mode'
    })
  })

  it('negative: resolves failure result when outbound input files are missing', async () => {
    const result = await run({ mode: 'outbound' })

    expect(result).toMatchObject({
      code: 1,
      mode: 'outbound',
      status: 'FAILED',
      reason: 'missing_input_files'
    })
  })

  it('negative: resolves failure result when outbound environment file is missing', async () => {
    const result = await run({
      mode: 'outbound',
      inputFiles: 'src/sample-config.json'
    })

    expect(result).toMatchObject({
      code: 1,
      mode: 'outbound',
      status: 'FAILED',
      reason: 'missing_environment_file'
    })
  })
})
