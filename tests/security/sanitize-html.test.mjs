import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://sciencetopia.local/' })
globalThis.window = dom.window
globalThis.document = dom.window.document

const { sanitizeHtml, isSafeUrl, safeUrl } = await import('../../src/utils/text.js')

const tests = [
  {
    name: 'ScriptTag_IsRemoved',
    run() {
      const output = sanitizeHtml('<p>ok</p><script>alert(1)</script>')
      assert.equal(output.includes('<script'), false)
      assert.equal(output.includes('ok'), true)
    },
  },
  {
    name: 'EventHandlerAttribute_IsRemoved',
    run() {
      const output = sanitizeHtml('<img src="https://example.com/a.png" onerror="alert(1)">')
      assert.equal(output.includes('onerror'), false)
      assert.equal(output.includes('https://example.com/a.png'), true)
    },
  },
  {
    name: 'JavascriptUrl_IsRejected',
    run() {
      const output = sanitizeHtml('<a href="javascript:alert(1)">click</a>')
      assert.equal(output.includes('javascript:'), false)
      assert.equal(output, '<a>click</a>')
      assert.equal(isSafeUrl('javascript:alert(1)'), false)
      assert.equal(safeUrl('javascript:alert(1)'), '#')
    },
  },
  {
    name: 'SafeMarkdownHtml_IsRendered',
    run() {
      const output = sanitizeHtml('<p><strong>Hello</strong> <em>world</em></p>')
      assert.equal(output, '<p><strong>Hello</strong> <em>world</em></p>')
    },
  },
  {
    name: 'ExternalBlankLink_UsesNoopener',
    run() {
      const output = sanitizeHtml('<a href="https://example.com" target="_blank">x</a>')
      assert.match(output, /rel="noopener noreferrer"/)
    },
  },
  {
    name: 'AiGeneratedHtml_IsSanitized',
    run() {
      const input = '<svg onload=alert(1)></svg><iframe srcdoc="<script>alert(1)</script>"></iframe><p>summary</p>'
      const output = sanitizeHtml(input)
      assert.equal(output.includes('<svg'), false)
      assert.equal(output.includes('<iframe'), false)
      assert.equal(output.includes('srcdoc'), false)
      assert.equal(output.includes('summary'), true)
    },
  },
]

let passed = 0
for (const test of tests) {
  test.run()
  passed += 1
  console.log(`PASS ${test.name}`)
}

console.log(`Frontend security tests: ${passed}/${tests.length} passed`)
