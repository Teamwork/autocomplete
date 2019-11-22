import { noop, TypedEventEmitter } from '@syncot/util'
import {
    createPatternHandler,
    createRegexPattern,
    EditorAdapter,
    EditorAdapterEvents,
    Item,
    Pattern,
    Position,
} from '.'

class MockEditorAdapter extends TypedEventEmitter<EditorAdapterEvents>
    implements EditorAdapter {
    public editor: any = {}
    public textBeforeCaret: string = ''
    public textAfterCaret: string = ''
    public caretPosition: Position = {
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
    }
    public editorPosition: Position = {
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
    }
    public destroy = noop
}

const emptyPattern: Pattern = (_text: string) => 0
let editorAdapter: MockEditorAdapter

beforeEach(() => {
    editorAdapter = new MockEditorAdapter()
})

describe('createRegexPattern', () => {
    test('no match', () => {
        const pattern = createRegexPattern(/^$/)
        expect(pattern('123')).toBe(-1)
    })
    test('simple match', () => {
        const pattern = createRegexPattern(/^abc/)
        expect(pattern('abcdef')).toBe(3)
    })
    test('match with a capturing group', () => {
        const pattern = createRegexPattern(/^ab(c)/)
        expect(pattern('abcdef')).toBe(3)
    })
    test('match with a look ahead', () => {
        const pattern = createRegexPattern(/^(?=abcdef).{3}/)
        expect(pattern('abcdef')).toBe(3)
    })
    test('custom capturing group', () => {
        const pattern = createRegexPattern(/^ab(cde)/, 1)
        expect(pattern('abcdef')).toBe(3)
    })
})

describe('PatternHandler', () => {
    describe('match', () => {
        test('match an empty string', () => {
            const patternHandler = createPatternHandler({
                patternAfterCaret: emptyPattern,
                patternBeforeCaret: emptyPattern,
            })
            editorAdapter.textBeforeCaret = 'abc'
            editorAdapter.textAfterCaret = 'def'
            expect(patternHandler.match(editorAdapter)).toBe('')
        })

        test('match something before caret', () => {
            const patternHandler = createPatternHandler({
                patternAfterCaret: emptyPattern,
                patternBeforeCaret: createRegexPattern(/\w{3}$/),
            })
            editorAdapter.textBeforeCaret = 'abcdef'
            expect(patternHandler.match(editorAdapter)).toBe('def')
        })

        test('match something after caret', () => {
            const patternHandler = createPatternHandler({
                patternAfterCaret: createRegexPattern(/^\d{3}/),
                patternBeforeCaret: emptyPattern,
            })
            editorAdapter.textAfterCaret = '123456'
            expect(patternHandler.match(editorAdapter)).toBe('123')
        })

        test('match something before and after caret', () => {
            const patternHandler = createPatternHandler({
                patternAfterCaret: createRegexPattern(/^\d{3}/),
                patternBeforeCaret: createRegexPattern(/\w{3}$/),
            })
            editorAdapter.textAfterCaret = '123456'
            editorAdapter.textBeforeCaret = 'abcdef'
            expect(patternHandler.match(editorAdapter)).toBe('def123')
        })

        test('match something with the default pattern after caret', () => {
            const patternHandler = createPatternHandler({
                patternBeforeCaret: createRegexPattern(/\w{3}$/),
            })
            editorAdapter.textBeforeCaret = 'abc'
            editorAdapter.textAfterCaret = ' def'
            expect(patternHandler.match(editorAdapter)).toBe('abc')
        })

        test('match nothing before caret', () => {
            const patternHandler = createPatternHandler({
                patternAfterCaret: emptyPattern,
                patternBeforeCaret: createRegexPattern(/defg$/),
            })
            editorAdapter.textBeforeCaret = 'abcdef'
            expect(patternHandler.match(editorAdapter)).toBe(undefined)
        })

        test('match nothing after caret', () => {
            const patternHandler = createPatternHandler({
                patternAfterCaret: createRegexPattern(/^abcdefg/),
                patternBeforeCaret: emptyPattern,
            })
            editorAdapter.textAfterCaret = 'abcdef'
            expect(patternHandler.match(editorAdapter)).toBe(undefined)
        })

        test('match nothing with the default pattern before caret', () => {
            const patternHandler = createPatternHandler({
                patternAfterCaret: emptyPattern,
            })
            editorAdapter.textBeforeCaret = 'abc'
            editorAdapter.textAfterCaret = 'def'
            expect(patternHandler.match(editorAdapter)).toBe(undefined)
        })

        test('match nothing with the default pattern after caret', () => {
            const patternHandler = createPatternHandler({
                patternBeforeCaret: emptyPattern,
            })
            editorAdapter.textBeforeCaret = 'abc'
            editorAdapter.textAfterCaret = 'def'
            expect(patternHandler.match(editorAdapter)).toBe(undefined)
        })
    })

    describe('replace', () => {
        test('replace an empty string', () => {
            const patternHandler = createPatternHandler({
                patternAfterCaret: emptyPattern,
                patternBeforeCaret: emptyPattern,
            })
            editorAdapter.textBeforeCaret = 'abc'
            editorAdapter.textAfterCaret = 'def'
            patternHandler.replace(editorAdapter, 'REPLACED')
            expect(editorAdapter.textBeforeCaret).toBe('abcREPLACED')
            expect(editorAdapter.textAfterCaret).toBe('def')
        })

        test('replace something before caret', () => {
            const patternHandler = createPatternHandler({
                patternAfterCaret: emptyPattern,
                patternBeforeCaret: createRegexPattern(/\w{3}$/),
            })
            editorAdapter.textBeforeCaret = 'abcdef'
            patternHandler.replace(editorAdapter, 'REPLACED')
            expect(editorAdapter.textBeforeCaret).toBe('abcREPLACED')
            expect(editorAdapter.textAfterCaret).toBe('')
        })

        test('replace something after caret', () => {
            const patternHandler = createPatternHandler({
                patternAfterCaret: createRegexPattern(/^\d{3}/),
                patternBeforeCaret: emptyPattern,
            })
            editorAdapter.textAfterCaret = '123456'
            patternHandler.replace(editorAdapter, 'REPLACED')
            expect(editorAdapter.textBeforeCaret).toBe('REPLACED')
            expect(editorAdapter.textAfterCaret).toBe('456')
        })

        test('replace something before and after caret', () => {
            const patternHandler = createPatternHandler({
                patternAfterCaret: createRegexPattern(/^\d{3}/),
                patternBeforeCaret: createRegexPattern(/\w{3}$/),
            })
            editorAdapter.textAfterCaret = '123456'
            editorAdapter.textBeforeCaret = 'abcdef'
            patternHandler.replace(editorAdapter, 'REPLACED')
            expect(editorAdapter.textBeforeCaret).toBe('abcREPLACED')
            expect(editorAdapter.textAfterCaret).toBe('456')
        })

        test('replace something with the default pattern after caret', () => {
            const patternHandler = createPatternHandler({
                patternBeforeCaret: createRegexPattern(/\w{3}$/),
            })
            editorAdapter.textBeforeCaret = 'abc'
            editorAdapter.textAfterCaret = ' def'
            patternHandler.replace(editorAdapter, 'REPLACED')
            expect(editorAdapter.textBeforeCaret).toBe('REPLACED')
            expect(editorAdapter.textAfterCaret).toBe(' def')
        })

        test('replace nothing before caret', () => {
            const patternHandler = createPatternHandler({
                patternAfterCaret: emptyPattern,
                patternBeforeCaret: createRegexPattern(/defg$/),
            })
            editorAdapter.textBeforeCaret = 'abcdef'
            patternHandler.replace(editorAdapter, 'REPLACED')
            expect(editorAdapter.textBeforeCaret).toBe('abcdef')
            expect(editorAdapter.textAfterCaret).toBe('')
        })

        test('replace nothing after caret', () => {
            const patternHandler = createPatternHandler({
                patternAfterCaret: createRegexPattern(/^abcdefg/),
                patternBeforeCaret: emptyPattern,
            })
            editorAdapter.textAfterCaret = 'abcdef'
            patternHandler.replace(editorAdapter, 'REPLACED')
            expect(editorAdapter.textBeforeCaret).toBe('')
            expect(editorAdapter.textAfterCaret).toBe('abcdef')
        })

        test('replace nothing with the default pattern before caret', () => {
            const patternHandler = createPatternHandler({
                patternAfterCaret: emptyPattern,
            })
            editorAdapter.textBeforeCaret = 'abc'
            editorAdapter.textAfterCaret = 'def'
            patternHandler.replace(editorAdapter, 'REPLACED')
            expect(editorAdapter.textBeforeCaret).toBe('abc')
            expect(editorAdapter.textAfterCaret).toBe('def')
        })

        test('replace nothing with the default pattern after caret', () => {
            const patternHandler = createPatternHandler({
                patternBeforeCaret: emptyPattern,
            })
            editorAdapter.textBeforeCaret = 'abc'
            editorAdapter.textAfterCaret = 'def'
            patternHandler.replace(editorAdapter, 'REPLACED')
            expect(editorAdapter.textBeforeCaret).toBe('abc')
            expect(editorAdapter.textAfterCaret).toBe('def')
        })
    })

    describe('load', () => {
        test('default implementation', () => {
            const matchedText = 'abc'
            const patternHandler = createPatternHandler()
            expect(
                patternHandler.load(editorAdapter, matchedText),
            ).toStrictEqual([])
        })
        test('custom implementation', () => {
            const items: Item[] = []
            const load = jest.fn().mockReturnValue(items)
            const matchedText = 'abc'
            const patternHandler = createPatternHandler({ load })
            expect(patternHandler.load(editorAdapter, matchedText)).toBe(items)
            expect(load).toHaveBeenCalledWith(editorAdapter, matchedText)
        })
    })

    describe('accept', () => {
        test('default implementation', () => {
            const item: Item = { id: 0, text: 'xyz' }
            const patternHandler = createPatternHandler({
                patternAfterCaret: createRegexPattern(/^\d/),
                patternBeforeCaret: createRegexPattern(/\w$/),
            })
            editorAdapter.textBeforeCaret = 'abc'
            editorAdapter.textAfterCaret = '123'
            patternHandler.accept(editorAdapter, item)
            expect(editorAdapter.textBeforeCaret).toBe('abxyz')
            expect(editorAdapter.textAfterCaret).toBe('23')
        })
        test('custom implementation', () => {
            const accept = jest.fn()
            const item: Item = { id: 0, text: 'xyz' }
            const patternHandler = createPatternHandler({
                accept,
                patternAfterCaret: createRegexPattern(/^\d/),
                patternBeforeCaret: createRegexPattern(/\w$/),
            })
            editorAdapter.textBeforeCaret = 'abc'
            editorAdapter.textAfterCaret = '123'
            patternHandler.accept(editorAdapter, item)
            expect(editorAdapter.textBeforeCaret).toBe('abc')
            expect(editorAdapter.textAfterCaret).toBe('123')
            expect(accept).toHaveBeenCalledWith(editorAdapter, item)
        })
    })
})
