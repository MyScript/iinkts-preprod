import { describe, test, expect, beforeEach } from '@jest/globals'
import { IIRecognizedMath } from '../../../src/symbol/recognized/IIRecognizedMath'
import { IIStroke } from '../../../src/symbol/interactive/IIStroke'

describe('IIRecognizedMath - Dependencies', () => {
  let mathSymbol: IIRecognizedMath

  beforeEach(() => {
    const strokes = [
      IIStroke.create({
        pointers: [
          { x: 10, y: 10, p: 1, t: 0 },
          { x: 20, y: 20, p: 1, t: 100 }
        ]
      })
    ]
    mathSymbol = new IIRecognizedMath(strokes)
    mathSymbol.jiixId = 'test-block-1'
    mathSymbol.label = 'x=2'
  })

  describe('variableSources', () => {
    test('should be undefined by default', () => {
      expect(mathSymbol.variableSources).toBeUndefined()
    })

    test('should store variable sources', () => {
      mathSymbol.variableSources = {
        'x': 'source-block-1',
        'y': 'source-block-2'
      }

      expect(mathSymbol.variableSources).toBeDefined()
      expect(mathSymbol.variableSources!['x']).toBe('source-block-1')
      expect(mathSymbol.variableSources!['y']).toBe('source-block-2')
    })

    test('should be cloned properly', () => {
      mathSymbol.variableSources = { 'x': 'source-block-1' }

      const clone = mathSymbol.clone()

      expect(clone.variableSources).toEqual(mathSymbol.variableSources)
      expect(clone.variableSources).not.toBe(mathSymbol.variableSources) // Deep copy
    })

    test('should be serialized in toJSON', () => {
      mathSymbol.variableSources = { 'x': 'source-block-1' }

      const json = mathSymbol.toJSON()

      expect(json.variableSources).toEqual({ 'x': 'source-block-1' })
    })

    test('should be restored from JSON', () => {
      const partial = {
        strokes: [{
          pointers: [
            { x: 10, y: 10, p: 1, t: 0 },
            { x: 20, y: 20, p: 1, t: 100 }
          ]
        }],
        jiixId: 'test-block-2',
        label: '3x+2',
        variableSources: { 'x': 'test-block-1' }
      }

      const restored = IIRecognizedMath.create(partial)

      expect(restored.variableSources).toEqual({ 'x': 'test-block-1' })
    })
  })

  describe('dependentBlocks', () => {
    test('should be undefined by default', () => {
      expect(mathSymbol.dependentBlocks).toBeUndefined()
    })

    test('should store dependent block IDs', () => {
      mathSymbol.dependentBlocks = ['dependent-1', 'dependent-2']

      expect(mathSymbol.dependentBlocks).toBeDefined()
      expect(mathSymbol.dependentBlocks).toHaveLength(2)
      expect(mathSymbol.dependentBlocks).toContain('dependent-1')
      expect(mathSymbol.dependentBlocks).toContain('dependent-2')
    })

    test('should be cloned properly', () => {
      mathSymbol.dependentBlocks = ['dependent-1']

      const clone = mathSymbol.clone()

      expect(clone.dependentBlocks).toEqual(mathSymbol.dependentBlocks)
      expect(clone.dependentBlocks).not.toBe(mathSymbol.dependentBlocks) // Deep copy
    })

    test('should be serialized in toJSON', () => {
      mathSymbol.dependentBlocks = ['dependent-1', 'dependent-2']

      const json = mathSymbol.toJSON()

      expect(json.dependentBlocks).toEqual(['dependent-1', 'dependent-2'])
    })

    test('should be restored from JSON', () => {
      const partial = {
        strokes: [{
          pointers: [
            { x: 10, y: 10, p: 1, t: 0 },
            { x: 20, y: 20, p: 1, t: 100 }
          ]
        }],
        jiixId: 'test-block-1',
        label: 'x=2',
        dependentBlocks: ['dependent-1', 'dependent-2']
      }

      const restored = IIRecognizedMath.create(partial)

      expect(restored.dependentBlocks).toEqual(['dependent-1', 'dependent-2'])
    })
  })

  describe('combined usage', () => {
    test('should handle both variableSources and dependentBlocks', () => {
      // This represents a block that uses 'x' from another block
      // and is itself used by other blocks
      mathSymbol.jiixId = 'middle-block'
      mathSymbol.label = 'y=3x+2'
      mathSymbol.variableSources = { 'x': 'source-block' }
      mathSymbol.dependentBlocks = ['dependent-block-1', 'dependent-block-2']

      const clone = mathSymbol.clone()

      expect(clone.variableSources).toEqual({ 'x': 'source-block' })
      expect(clone.dependentBlocks).toEqual(['dependent-block-1', 'dependent-block-2'])
    })

    test('should serialize and deserialize complete dependency graph', () => {
      mathSymbol.variableSources = { 'x': 'source-1', 'y': 'source-2' }
      mathSymbol.dependentBlocks = ['dep-1', 'dep-2', 'dep-3']

      const json = mathSymbol.toJSON()
      const restored = IIRecognizedMath.create(json)

      expect(restored.variableSources).toEqual(mathSymbol.variableSources)
      expect(restored.dependentBlocks).toEqual(mathSymbol.dependentBlocks)
    })
  })
})
