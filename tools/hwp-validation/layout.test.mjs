import { test } from 'node:test'
import assert from 'node:assert/strict'
import { layoutEqual } from './layout.mjs'

test('accepts serializer-local style index changes, while comparing resolved styles', () => {
  assert.equal(
    layoutEqual({ charShapeId: 1, fontFamily: 'A' }, { charShapeId: 99, fontFamily: 'A' }),
    true,
  )
  assert.equal(
    layoutEqual({ charShapeId: 1, fontFamily: 'A' }, { charShapeId: 1, fontFamily: 'B' }),
    false,
  )
})
test('bounds position and advance differences to half a pixel', () => {
  assert.equal(layoutEqual({ x: 10, charX: [0, 5] }, { x: 10.5, charX: [0, 5.5] }), true)
  assert.equal(layoutEqual({ x: 10 }, { x: 10.501 }), false)
  assert.equal(layoutEqual({ charX: [0, 5] }, { charX: [0, 5.501] }), false)
})
test('does not apply coordinate tolerance to row indices and spans', () => {
  assert.equal(layoutEqual({ row: 1, rowSpan: 2 }, { row: 1.1, rowSpan: 2 }), false)
  assert.equal(layoutEqual({ rowSpan: 2 }, { rowSpan: 3 }), false)
})
test('rejects missing objects and text or formatting changes', () => {
  assert.equal(layoutEqual([{ x: 1 }], []), false)
  assert.equal(layoutEqual({ text: 'a', bold: false }, { text: 'b', bold: false }), false)
  assert.equal(layoutEqual({ text: 'a', bold: false }, { text: 'a', bold: true }), false)
})
test('rejects nonfinite coordinates and unexpected attributes', () => {
  assert.equal(layoutEqual({ x: NaN }, { x: NaN }), false)
  assert.equal(layoutEqual({ x: 1 }, { x: 1, y: 2 }), false)
})
