import { describe, expect, it } from 'vitest'
import { CloudDocumentsClient, cloudOrigin } from '../src/browser'

describe('browser document client', () => {
  it('does not invoke the browser fetch function with a client object as its receiver', async () => {
    const fetcher: typeof fetch = async function (this: unknown, _input, _init) {
      expect(this).toBe(globalThis)
      return new Response(JSON.stringify({ documents: [] }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
    expect(
      await new CloudDocumentsClient('http://127.0.0.1:5182', () => 'test', fetcher).list(),
    ).toEqual([])
  })
  it('accepts HTTPS or loopback origins only, without embedded credentials or paths', () => {
    expect(cloudOrigin('https://documents.example.com/')).toBe('https://documents.example.com')
    expect(cloudOrigin('http://localhost:5182')).toBe('http://localhost:5182')
    for (const url of [
      'http://documents.example.com',
      'https://user:pass@documents.example.com',
      'https://documents.example.com/path',
      'https://documents.example.com/?token=secret',
    ]) {
      expect(() => cloudOrigin(url)).toThrow('invalid')
    }
  })
})
