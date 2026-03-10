'use strict'

const path = require('node:path')
const { spawn } = require('node:child_process')

const runCli = (args) => {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['bin/cli.js', ...args], {
      cwd: path.resolve(__dirname, '../..'),
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', reject)
    child.on('close', (code) => {
      resolve({ code, stdout, stderr })
    })
  })
}

describe('Integration: CLI', () => {
  it('success: prints help output', async () => {
    const result = await runCli(['--help'])

    expect(result.code).toBe(0)
    expect(result.stdout).toContain('Usage:')
    expect(result.stdout).toContain('Options:')
    expect(result.stderr).toBe('')
  })

  it('negative: returns failure for unsupported mode', async () => {
    const result = await runCli(['-m', 'unsupported'])

    expect(result.code).toBe(1)
    expect(result.stdout).toContain('Mode is not supported')
  })

  it('negative: returns failure when outbound input files are missing', async () => {
    const result = await runCli(['-m', 'outbound'])

    expect(result.code).toBe(1)
    expect(result.stdout).toContain('required option \'-i, --input-files <inputFiles>\' not specified')
  })

  it('negative: returns failure when outbound environment file is missing', async () => {
    const result = await runCli(['-m', 'outbound', '-i', 'src/sample-config.json'])

    expect(result.code).toBe(1)
    expect(result.stdout).toContain('required option \'-e, --environment-file <environmentFile>\' not specified')
  })
})
