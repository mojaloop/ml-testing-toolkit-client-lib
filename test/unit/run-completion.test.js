'use strict'

const objectStore = require('../../src/objectStore')
const { EXIT_CODES } = require('../../src/constants')
const { completeRun } = require('../../src/utils/run-completion')

describe('Run completion utility', () => {
  const spyExit = jest.spyOn(process, 'exit').mockImplementation(() => {})

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns existing completion result if already completed', () => {
    objectStore.set('config', {
      mode: 'monitoring',
      _completed: true,
      _completionResult: { code: 0, reason: 'already_done' }
    })

    const result = completeRun({ code: EXIT_CODES.failure })

    expect(result).toEqual({ code: 0, reason: 'already_done' })
    expect(spyExit).not.toHaveBeenCalled()
  })

  it('calls onComplete and does not exit when exitOnComplete is false', () => {
    const onComplete = jest.fn()
    objectStore.set('config', {
      mode: 'monitoring',
      exitOnComplete: false,
      onComplete
    })

    const result = completeRun({ code: EXIT_CODES.success, reason: 'ok' })

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ code: 0, reason: 'ok' }))
    expect(result).toMatchObject({ code: 0, status: 'SUCCESS', reason: 'ok' })
    expect(spyExit).not.toHaveBeenCalled()
  })

  it('exits when exitOnComplete is true', () => {
    objectStore.set('config', {
      mode: 'outbound',
      exitOnComplete: true
    })

    const result = completeRun({ code: EXIT_CODES.failure, reason: 'failed' })

    expect(result).toMatchObject({ code: 1, status: 'FAILED', reason: 'failed' })
    expect(spyExit).toHaveBeenCalledWith(EXIT_CODES.failure)
  })
})
