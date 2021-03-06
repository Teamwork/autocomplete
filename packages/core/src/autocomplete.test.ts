import { TypedEventEmitter } from '@syncot/events'
import { noop, whenNextTick } from '@syncot/util'
import {
    Autocomplete,
    createAutocomplete,
    EditorAdapter,
    EditorAdapterEvents,
    Item,
    Position,
} from '.'

const whenAnimationFrame = () =>
    new Promise((resolve) => requestAnimationFrame(resolve))

const position0: Position = Object.freeze({
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
})
const caretPosition1: Position = Object.freeze({
    bottom: 110,
    left: 100,
    right: 101,
    top: 100,
})
const caretPosition2: Position = Object.freeze({
    bottom: 210,
    left: 200,
    right: 201,
    top: 200,
})
const editorPosition1: Position = Object.freeze({
    bottom: 1002,
    left: 11,
    right: 1001,
    top: 12,
})
const editorPosition2: Position = Object.freeze({
    bottom: 1004,
    left: 13,
    right: 1003,
    top: 14,
})

function getCaretPosition(this: EditorAdapter, _offset: number = 0): Position {
    return this.caretPosition
}

class MockEditorAdapter extends TypedEventEmitter<EditorAdapterEvents>
    implements EditorAdapter {
    public editor: any = {}
    public textBeforeCaret: string = ''
    public textAfterCaret: string = ''
    public caretPosition: Position = caretPosition1
    public editorPosition: Position = editorPosition1
    public destroy = noop
    public focus = noop
    public getCaretPosition = getCaretPosition
}

let letterItems: Item[]
let numberItems: Item[]
let match: jest.Mock<[number, number], [string, string]>
let match2: jest.Mock<[number, number], [string, string]>
let load: jest.Mock<Item[] | Promise<Item[]>, [string]>
let accept: jest.Mock<string | undefined, [Item]>
let editorAdapter: MockEditorAdapter
let autocomplete: Autocomplete

function expectNotActive(): void {
    expect(autocomplete.active).toBe(false)
    expect(autocomplete.caretPosition).toStrictEqual(position0)
    expect(autocomplete.editorPosition).toStrictEqual(position0)
    expect(autocomplete.items).toStrictEqual([])
    expect(autocomplete.matchedText).toBe('')
    expect(autocomplete.caretOffset).toBe(0)
    expect(autocomplete.selectedIndex).toBe(-1)
    expect(autocomplete.error).toBe(undefined)
    expect(autocomplete.loading).toBe(false)
}

function expectActive({
    caretPosition = caretPosition1,
    editorPosition = editorPosition1,
    items = letterItems,
    matchedText = 'def',
    caretOffset = 3,
    selectedIndex = 0,
    error,
    loading = false,
}: {
    caretPosition?: Position
    editorPosition?: Position
    items?: Readonly<Item[]>
    matchedText?: string
    caretOffset?: number
    selectedIndex?: number
    error?: Error | undefined
    loading?: boolean
} = {}): void {
    expect(autocomplete.active).toBe(true)
    expect(autocomplete.caretPosition).toStrictEqual(caretPosition)
    expect(autocomplete.editorPosition).toStrictEqual(editorPosition)
    expect(autocomplete.items).toStrictEqual(items)
    expect(autocomplete.matchedText).toBe(matchedText)
    expect(autocomplete.caretOffset).toBe(caretOffset)
    expect(autocomplete.selectedIndex).toBe(selectedIndex)
    expect(autocomplete.error).toBe(error)
    expect(autocomplete.loading).toBe(loading)
}

beforeEach(() => {
    letterItems = [
        { id: 0, text: 'Letter item 0' },
        { id: 1, text: 'Letter item 1' },
        { id: 2, text: 'Letter item 2' },
    ]
    numberItems = [
        { id: 0, text: 'Number item 0' },
        { id: 1, text: 'Number item 1' },
        { id: 2, text: 'Number item 2' },
    ]
    match = jest.fn((textBeforeCaret, _textAfterCaret) => {
        const matchBeforeCaret = /([a-zA-Z]+|[0-9]+)$/.exec(textBeforeCaret)
        const countBeforeCaret = matchBeforeCaret
            ? matchBeforeCaret[0].length
            : -1
        return [countBeforeCaret, 0]
    })
    match2 = jest.fn((textBeforeCaret, textAfterCaret) => {
        const matchBeforeCaret = /\w+$/.exec(textBeforeCaret)
        const countBeforeCaret = matchBeforeCaret
            ? matchBeforeCaret[0].length
            : -1
        const matchAfterCaret = /^\w+/.exec(textAfterCaret)
        const countAfterCaret = matchAfterCaret ? matchAfterCaret[0].length : -1
        return [countBeforeCaret, countAfterCaret]
    })
    load = jest.fn((matchedText) =>
        /^[0-9]/.test(matchedText) ? numberItems : letterItems,
    )
    accept = jest.fn()

    editorAdapter = new MockEditorAdapter()
    autocomplete = createAutocomplete({ accept, editorAdapter, load, match })
    editorAdapter.textBeforeCaret = 'abc def'
})

afterEach(() => {
    autocomplete.destroy()
    editorAdapter.destroy()
})

describe('editorAdapter', () => {
    test('the same as the param', () => {
        expect(autocomplete.editorAdapter).toBe(editorAdapter)
    })
})

describe('match', () => {
    test('match, no match, no match, match, match, destroy', async () => {
        // match
        expectNotActive()
        autocomplete.match()
        expectNotActive()
        await whenAnimationFrame()
        expectActive()
        expect(load).toHaveBeenCalledTimes(1)
        expect(load).toHaveBeenCalledWith('def')

        // no match
        editorAdapter.textBeforeCaret = ''
        autocomplete.match()
        await whenAnimationFrame()
        expectNotActive()

        // no match
        editorAdapter.textBeforeCaret = '!'
        autocomplete.match()
        await whenAnimationFrame()
        expectNotActive()

        // match
        editorAdapter.textBeforeCaret = '123'
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({ items: numberItems, matchedText: '123' })

        // match
        editorAdapter.textBeforeCaret = '123 abc'
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({ matchedText: 'abc' })

        // destroy
        autocomplete.destroy()
        await whenAnimationFrame()
        expectNotActive()
    })

    test('match twice', async () => {
        autocomplete.match()
        autocomplete.match()
        await whenAnimationFrame()
        expectActive()
    })

    test('change text after match', async () => {
        autocomplete.match()
        editorAdapter.textBeforeCaret = 'abc 123'
        await whenAnimationFrame()
        expectActive({ items: numberItems, matchedText: '123' })
    })

    test('clear, match', async () => {
        autocomplete.clear()
        autocomplete.match()
        await whenAnimationFrame()
        expectActive()
    })

    test('default match function', async () => {
        autocomplete.destroy()
        autocomplete = createAutocomplete({ editorAdapter, load, accept })
        autocomplete.match()
        await whenAnimationFrame()
        expectNotActive()
    })

    test('match function matching text before and after caret', async () => {
        autocomplete.destroy()
        autocomplete = createAutocomplete({
            editorAdapter,
            load,
            accept,
            match: match2,
        })
        editorAdapter.textBeforeCaret = '123 abcd'
        editorAdapter.textAfterCaret = 'efghij 456'
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({ matchedText: 'abcdefghij', caretOffset: 4 })
    })
})

describe('clear', () => {
    test('match, clear', async () => {
        autocomplete.match()
        autocomplete.clear()
        await whenAnimationFrame()
        expectNotActive()
    })

    test('clear twice', async () => {
        autocomplete.clear()
        autocomplete.clear()
        await whenAnimationFrame()
        expectNotActive()
    })

    test('match, wait, clear', async () => {
        autocomplete.match()
        await whenAnimationFrame()
        expectActive()
        autocomplete.clear()
        await whenAnimationFrame()
        expectNotActive()
    })
})

describe('updatePosition', () => {
    test('no state', async () => {
        autocomplete.updatePosition()
        await whenAnimationFrame()
        expectNotActive()
    })

    test('some state', async () => {
        autocomplete.match()
        await whenAnimationFrame()
        expectActive()

        editorAdapter.textBeforeCaret = '123' // This won't be detected.
        editorAdapter.caretPosition = caretPosition2
        editorAdapter.editorPosition = editorPosition2
        autocomplete.updatePosition()
        await whenAnimationFrame()
        expectActive({
            caretPosition: caretPosition2,
            editorPosition: editorPosition2,
        })
    })

    test('match, updateCaretPosition', async () => {
        autocomplete.match()
        autocomplete.updatePosition()
        await whenAnimationFrame()
        expectActive()
    })

    test('match, clear, updateCaretPosition', async () => {
        autocomplete.match()
        autocomplete.clear()
        autocomplete.updatePosition()
        await whenAnimationFrame()
        expectNotActive()
    })
})

describe('selectedIndex', () => {
    test('no items', () => {
        expect(autocomplete.items).toStrictEqual([])
        expect(autocomplete.selectedIndex).toBe(-1)
        autocomplete.selectedIndex++
        expect(autocomplete.selectedIndex).toBe(-1)
        autocomplete.selectedIndex--
        expect(autocomplete.selectedIndex).toBe(-1)
    })
    test('with items', async () => {
        autocomplete.match()
        await whenAnimationFrame()
        expect(autocomplete.items).toBe(letterItems)
        expect(autocomplete.items.length).toBe(3)
        expect(autocomplete.selectedIndex).toBe(0)

        autocomplete.selectedIndex = -100
        expect(autocomplete.selectedIndex).toBe(2)

        autocomplete.selectedIndex = -3
        expect(autocomplete.selectedIndex).toBe(0)

        autocomplete.selectedIndex = -2
        expect(autocomplete.selectedIndex).toBe(1)

        autocomplete.selectedIndex = -1
        expect(autocomplete.selectedIndex).toBe(2)

        autocomplete.selectedIndex = 0
        expect(autocomplete.selectedIndex).toBe(0)

        autocomplete.selectedIndex = 1
        expect(autocomplete.selectedIndex).toBe(1)

        autocomplete.selectedIndex = 2
        expect(autocomplete.selectedIndex).toBe(2)

        autocomplete.selectedIndex = 3
        expect(autocomplete.selectedIndex).toBe(0)

        autocomplete.selectedIndex = 4
        expect(autocomplete.selectedIndex).toBe(1)

        autocomplete.selectedIndex = 5
        expect(autocomplete.selectedIndex).toBe(2)

        autocomplete.selectedIndex = 6
        expect(autocomplete.selectedIndex).toBe(0)

        autocomplete.selectedIndex = 100
        expect(autocomplete.selectedIndex).toBe(1)

        autocomplete.selectedIndex = 1.5
        expect(autocomplete.selectedIndex).toBe(1)

        autocomplete.selectedIndex = NaN
        expect(autocomplete.selectedIndex).toBe(0)

        autocomplete.selectedIndex = '1' as any
        expect(autocomplete.selectedIndex).toBe(1)
    })
})

describe('accept', () => {
    test('no state', async () => {
        expectNotActive()

        autocomplete.accept()
        expect(accept).toHaveBeenCalledTimes(0)
        await whenAnimationFrame()
        expectNotActive()
    })
    test('no items', async () => {
        const items: Item[] = []
        load.mockReturnValue(items)
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({ items, selectedIndex: -1 })

        autocomplete.accept()
        expect(accept).toHaveBeenCalledTimes(0)
        await whenAnimationFrame()
        expectActive({ items, selectedIndex: -1 })
    })
    test('some items', async () => {
        autocomplete.match()
        await whenAnimationFrame()
        autocomplete.selectedIndex = 1
        expectActive({ selectedIndex: 1 })

        autocomplete.accept()
        expect(accept).toHaveBeenCalledTimes(1)
        expect(accept).toHaveBeenCalledWith(letterItems[1])
        await whenAnimationFrame()
        expectActive({ selectedIndex: 1 })
    })
    test('return an empty string', async () => {
        autocomplete.match()
        await whenAnimationFrame()

        accept.mockReturnValue('')
        autocomplete.accept()
        await whenAnimationFrame()
        expectNotActive()
        expect(editorAdapter.textBeforeCaret).toBe('abc ')
        expect(editorAdapter.textAfterCaret).toBe('')
    })
    test('return a non-empty string', async () => {
        autocomplete.match()
        await whenAnimationFrame()

        accept.mockReturnValue('REPLACED')
        autocomplete.accept()
        await whenAnimationFrame()
        expectNotActive()
        expect(editorAdapter.textBeforeCaret).toBe('abc REPLACED')
        expect(editorAdapter.textAfterCaret).toBe('')
    })
    test('default accept function', async () => {
        autocomplete.destroy()
        autocomplete = createAutocomplete({ editorAdapter, load, match })
        autocomplete.match()
        await whenAnimationFrame()

        autocomplete.accept()
        await whenAnimationFrame()
        expectNotActive()
        expect(editorAdapter.textBeforeCaret).toBe('abc Letter item 0')
        expect(editorAdapter.textAfterCaret).toBe('')
    })
})

describe('replace', () => {
    beforeEach(() => {
        editorAdapter.textBeforeCaret = 'abcdef'
        editorAdapter.textAfterCaret = '123456'
    })

    test('replace an empty string', () => {
        match.mockReturnValue([0, 0])
        autocomplete.replace('REPLACED')
        expect(editorAdapter.textBeforeCaret).toBe('abcdefREPLACED')
        expect(editorAdapter.textAfterCaret).toBe('123456')
    })

    test('replace something before caret', () => {
        match.mockReturnValue([3, 0])
        autocomplete.replace('REPLACED')
        expect(editorAdapter.textBeforeCaret).toBe('abcREPLACED')
        expect(editorAdapter.textAfterCaret).toBe('123456')
    })

    test('replace something after caret', () => {
        match.mockReturnValue([0, 3])
        autocomplete.replace('REPLACED')
        expect(editorAdapter.textBeforeCaret).toBe('abcdefREPLACED')
        expect(editorAdapter.textAfterCaret).toBe('456')
    })

    test('replace something before and after caret', () => {
        match.mockReturnValue([3, 3])
        autocomplete.replace('REPLACED')
        expect(editorAdapter.textBeforeCaret).toBe('abcREPLACED')
        expect(editorAdapter.textAfterCaret).toBe('456')
    })

    test('replace nothing before caret', () => {
        match.mockReturnValue([-1, 0])
        autocomplete.replace('REPLACED')
        expect(editorAdapter.textBeforeCaret).toBe('abcdef')
        expect(editorAdapter.textAfterCaret).toBe('123456')
    })

    test('replace nothing after caret', () => {
        match.mockReturnValue([0, -1])
        autocomplete.replace('REPLACED')
        expect(editorAdapter.textBeforeCaret).toBe('abcdef')
        expect(editorAdapter.textAfterCaret).toBe('123456')
    })

    test('replace nothing before and after caret', () => {
        match.mockReturnValue([-1, -1])
        autocomplete.replace('REPLACED')
        expect(editorAdapter.textBeforeCaret).toBe('abcdef')
        expect(editorAdapter.textAfterCaret).toBe('123456')
    })
})

describe('loading', () => {
    let onActive: jest.Mock
    let onMatchedText: jest.Mock
    let onCaretOffset: jest.Mock
    let onItems: jest.Mock
    let onSelectedIndex: jest.Mock
    let onCaretPosition: jest.Mock
    let onEditorPosition: jest.Mock
    let onError: jest.Mock
    let onLoading: jest.Mock

    beforeEach(() => {
        autocomplete.on('active', (onActive = jest.fn()))
        autocomplete.on('matchedText', (onMatchedText = jest.fn()))
        autocomplete.on('caretOffset', (onCaretOffset = jest.fn()))
        autocomplete.on('items', (onItems = jest.fn()))
        autocomplete.on('selectedIndex', (onSelectedIndex = jest.fn()))
        autocomplete.on('caretPosition', (onCaretPosition = jest.fn()))
        autocomplete.on('editorPosition', (onEditorPosition = jest.fn()))
        autocomplete.on('error', (onError = jest.fn()))
        autocomplete.on('loading', (onLoading = jest.fn()))
    })

    test('sync success', async () => {
        autocomplete.match()
        await whenAnimationFrame()
        expectActive()

        expect(onActive).toHaveBeenCalledTimes(1)
        expect(onMatchedText).toHaveBeenCalledTimes(1)
        expect(onCaretOffset).toHaveBeenCalledTimes(1)
        expect(onItems).toHaveBeenCalledTimes(1)
        expect(onSelectedIndex).toHaveBeenCalledTimes(1)
        expect(onCaretPosition).toHaveBeenCalledTimes(1)
        expect(onEditorPosition).toHaveBeenCalledTimes(1)
        expect(onError).toHaveBeenCalledTimes(0)
        expect(onLoading).toHaveBeenCalledTimes(2)
    })

    test('sync error', async () => {
        const error = new Error('test error')
        load.mockImplementation(() => {
            throw error
        })
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({ error, items: [], selectedIndex: -1 })

        expect(onActive).toHaveBeenCalledTimes(1)
        expect(onMatchedText).toHaveBeenCalledTimes(1)
        expect(onCaretOffset).toHaveBeenCalledTimes(1)
        expect(onItems).toHaveBeenCalledTimes(0)
        expect(onSelectedIndex).toHaveBeenCalledTimes(0)
        expect(onCaretPosition).toHaveBeenCalledTimes(1)
        expect(onEditorPosition).toHaveBeenCalledTimes(1)
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onLoading).toHaveBeenCalledTimes(2)
    })

    test('async success', async () => {
        let resolve1: (items: Item[]) => void
        const promise1: Promise<Item[]> = new Promise((r) => (resolve1 = r))
        let resolve2: (items: Item[]) => void
        const promise2: Promise<Item[]> = new Promise((r) => (resolve2 = r))
        load.mockReset()
        load.mockImplementationOnce(() => promise1)
        load.mockImplementationOnce(() => promise2)

        // Record and wait for promise1.
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({
            items: [],
            loading: true,
            selectedIndex: -1,
        })

        // Record and wait for promise2.
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({
            items: [],
            loading: true,
            selectedIndex: -1,
        })

        // Resolve the promises in the reversed order.
        resolve2!(letterItems)
        resolve1!(numberItems)

        // The last recorded promise wins, regardless of the resolution order.
        await whenNextTick()
        expectActive()
        expect(onActive).toHaveBeenCalledTimes(1)
        expect(onMatchedText).toHaveBeenCalledTimes(1)
        expect(onCaretOffset).toHaveBeenCalledTimes(1)
        expect(onItems).toHaveBeenCalledTimes(1)
        expect(onSelectedIndex).toHaveBeenCalledTimes(1)
        expect(onCaretPosition).toHaveBeenCalledTimes(1)
        expect(onEditorPosition).toHaveBeenCalledTimes(1)
        expect(onError).toHaveBeenCalledTimes(0)
        expect(onLoading).toHaveBeenCalledTimes(2)
    })

    test('async error', async () => {
        const error1 = new Error('test error 1')
        let reject1: (error: Error) => void
        const promise1: Promise<Item[]> = new Promise((_, r) => (reject1 = r))
        const error2 = new Error('test error 2')
        let reject2: (error: Error) => void
        const promise2: Promise<Item[]> = new Promise((_, r) => (reject2 = r))
        load.mockReset()
        load.mockImplementationOnce(() => promise1)
        load.mockImplementationOnce(() => promise2)

        // Record and wait for promise1.
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({
            items: [],
            loading: true,
            selectedIndex: -1,
        })

        // Record and wait for promise2.
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({
            items: [],
            loading: true,
            selectedIndex: -1,
        })

        // Reject the promises in the reversed order.
        reject2!(error2)
        reject1!(error1)

        // The last recorded promise wins, regardless of the rejection order.
        await whenNextTick()
        expectActive({
            error: error2,
            items: [],
            selectedIndex: -1,
        })

        expect(onActive).toHaveBeenCalledTimes(1)
        expect(onMatchedText).toHaveBeenCalledTimes(1)
        expect(onCaretOffset).toHaveBeenCalledTimes(1)
        expect(onItems).toHaveBeenCalledTimes(0)
        expect(onSelectedIndex).toHaveBeenCalledTimes(0)
        expect(onCaretPosition).toHaveBeenCalledTimes(1)
        expect(onEditorPosition).toHaveBeenCalledTimes(1)
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onLoading).toHaveBeenCalledTimes(2)
    })

    test('clear when loading=true', async () => {
        let resolve: (items: Item[]) => void
        const promise: Promise<Item[]> = new Promise((r) => (resolve = r))
        load.mockReset()
        load.mockImplementationOnce(() => promise)

        autocomplete.match()
        await whenAnimationFrame()
        expectActive({
            items: [],
            loading: true,
            selectedIndex: -1,
        })

        autocomplete.clear()
        await whenAnimationFrame()
        expectNotActive()

        resolve!(letterItems)
        await whenNextTick()
        expectNotActive()

        expect(onActive).toHaveBeenCalledTimes(2)
        expect(onMatchedText).toHaveBeenCalledTimes(2)
        expect(onCaretOffset).toHaveBeenCalledTimes(2)
        expect(onItems).toHaveBeenCalledTimes(0)
        expect(onSelectedIndex).toHaveBeenCalledTimes(0)
        expect(onCaretPosition).toHaveBeenCalledTimes(2)
        expect(onEditorPosition).toHaveBeenCalledTimes(2)
        expect(onError).toHaveBeenCalledTimes(0)
        expect(onLoading).toHaveBeenCalledTimes(2)
    })

    test('load undefined sync', async () => {
        load.mockReturnValue(undefined as any)
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({ items: [], selectedIndex: -1 })
    })

    test('load undefined async', async () => {
        load.mockResolvedValue(undefined as any)
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({ items: [], selectedIndex: -1 })
    })

    test('default load function', async () => {
        autocomplete.destroy()
        autocomplete = createAutocomplete({ editorAdapter, match, accept })
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({ items: [], selectedIndex: -1 })
    })
})

describe('events', () => {
    beforeEach(async () => {
        autocomplete.match()
        await whenAnimationFrame()
        expectActive()
    })

    test('editor resize', async () => {
        editorAdapter.caretPosition = caretPosition2
        editorAdapter.editorPosition = editorPosition2
        editorAdapter.emit('resize', editorAdapter)
        await whenAnimationFrame()
        expectActive({
            caretPosition: caretPosition2,
            editorPosition: editorPosition2,
        })
    })

    test('editor scroll', async () => {
        editorAdapter.caretPosition = caretPosition2
        editorAdapter.editorPosition = editorPosition2
        editorAdapter.emit('scroll', editorAdapter)
        await whenAnimationFrame()
        expectActive({
            caretPosition: caretPosition2,
            editorPosition: editorPosition2,
        })
    })

    test('window resize', async () => {
        editorAdapter.caretPosition = caretPosition2
        editorAdapter.editorPosition = editorPosition2
        window.dispatchEvent(new Event('resize'))
        await whenAnimationFrame()
        expectActive({
            caretPosition: caretPosition2,
            editorPosition: editorPosition2,
        })
    })

    test('document scroll', async () => {
        editorAdapter.caretPosition = caretPosition2
        editorAdapter.editorPosition = editorPosition2
        document.dispatchEvent(new Event('scroll'))
        await whenAnimationFrame()
        expectActive({
            caretPosition: caretPosition2,
            editorPosition: editorPosition2,
        })
    })

    describe('keyDown', () => {
        function createEvent(options?: KeyboardEventInit): KeyboardEvent {
            const event = new KeyboardEvent('keydown', options)
            // This is necessary because we test this event with `emit` instead of `dispatchEvent`.
            Object.defineProperty(event, 'preventDefault', {
                configurable: true,
                value: () => {
                    Object.defineProperty(event, 'defaultPrevented', {
                        configurable: true,
                        value: true,
                    })
                },
            })
            return event
        }

        describe.each(['Up', 'ArrowUp'])('%p', (key) => {
            beforeEach(() => {
                autocomplete.selectedIndex = 2
            })
            test('no state', async () => {
                autocomplete.clear()
                await whenAnimationFrame()

                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectNotActive()
                expect(event.defaultPrevented).toBe(false)
            })
            test('no items', async () => {
                const items: Item[] = []
                load.mockReturnValue(items)
                autocomplete.match()
                await whenAnimationFrame()
                expectActive({ items, selectedIndex: -1 })

                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectActive({ items, selectedIndex: -1 })
                expect(event.defaultPrevented).toBe(false)
            })
            test('some items', async () => {
                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectActive({ selectedIndex: 1 })
                expect(event.defaultPrevented).toBe(true)
            })
            test.each(['ctrlKey', 'shiftKey', 'altKey', 'metaKey'])(
                'with %s',
                async (modifier) => {
                    const event = createEvent({ key, [modifier]: true })
                    editorAdapter.emit('keyDown', editorAdapter, event)
                    await whenAnimationFrame()
                    expectActive({ selectedIndex: 2 })
                    expect(event.defaultPrevented).toBe(false)
                },
            )
        })

        describe.each(['Down', 'ArrowDown'])('%p', (key) => {
            test('no state', async () => {
                autocomplete.clear()
                await whenAnimationFrame()

                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectNotActive()
                expect(event.defaultPrevented).toBe(false)
            })
            test('no items', async () => {
                const items: Item[] = []
                load.mockReturnValue(items)
                autocomplete.match()
                await whenAnimationFrame()
                expectActive({ items, selectedIndex: -1 })

                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectActive({ items, selectedIndex: -1 })
                expect(event.defaultPrevented).toBe(false)
            })
            test('some items', async () => {
                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectActive({ selectedIndex: 1 })
                expect(event.defaultPrevented).toBe(true)
            })
            test.each(['ctrlKey', 'shiftKey', 'altKey', 'metaKey'])(
                'with %s',
                async (modifier) => {
                    const event = createEvent({ key, [modifier]: true })
                    editorAdapter.emit('keyDown', editorAdapter, event)
                    await whenAnimationFrame()
                    expectActive()
                    expect(event.defaultPrevented).toBe(false)
                },
            )
        })

        describe('Enter', () => {
            const key = 'Enter'

            test('no state', async () => {
                autocomplete.clear()
                await whenAnimationFrame()
                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectNotActive()
                expect(event.defaultPrevented).toBe(false)
                expect(accept).toHaveBeenCalledTimes(0)
            })

            test('no items', async () => {
                const items: Item[] = []
                load.mockReturnValue(items)
                autocomplete.match()
                await whenAnimationFrame()
                expectActive({ items, selectedIndex: -1 })

                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectActive({ items, selectedIndex: -1 })
                expect(event.defaultPrevented).toBe(false)
                expect(accept).toHaveBeenCalledTimes(0)
            })

            test.each([0, 1, 2])(
                'selectedIndex = %d',
                async (selectedIndex) => {
                    autocomplete.selectedIndex = selectedIndex
                    const event = createEvent({ key })
                    editorAdapter.emit('keyDown', editorAdapter, event)
                    await whenAnimationFrame()
                    expectActive({ selectedIndex })
                    expect(event.defaultPrevented).toBe(true)
                    expect(accept).toHaveBeenCalledTimes(1)
                    expect(accept).toHaveBeenCalledWith(
                        letterItems[selectedIndex],
                    )
                },
            )

            test.each(['ctrlKey', 'shiftKey', 'altKey', 'metaKey'])(
                'with %s',
                async (modifier) => {
                    const event = createEvent({ key, [modifier]: true })
                    editorAdapter.emit('keyDown', editorAdapter, event)
                    await whenAnimationFrame()
                    expectActive()
                    expect(event.defaultPrevented).toBe(false)
                    expect(accept).toHaveBeenCalledTimes(0)
                },
            )
        })

        describe.each(['Esc', 'Escape'])('%p', (key) => {
            test('no state', async () => {
                autocomplete.clear()
                await whenAnimationFrame()
                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectNotActive()
                expect(event.defaultPrevented).toBe(false)
            })
            test('some state', async () => {
                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectNotActive()
                expect(event.defaultPrevented).toBe(true)
            })
            test.each(['ctrlKey', 'shiftKey', 'altKey', 'metaKey'])(
                'with %s',
                async (modifier) => {
                    const event = createEvent({ key, [modifier]: true })
                    editorAdapter.emit('keyDown', editorAdapter, event)
                    await whenAnimationFrame()
                    expectActive()
                    expect(event.defaultPrevented).toBe(false)
                },
            )
        })

        describe.each(['Spacebar', ' '])('%p', (key) => {
            test('no modifiers', async () => {
                autocomplete.clear()
                await whenAnimationFrame()
                expectNotActive()

                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectNotActive()
                expect(event.defaultPrevented).toBe(false)
            })
            test('with ctrlKey, no state', async () => {
                autocomplete.clear()
                await whenAnimationFrame()
                expectNotActive()

                const event = createEvent({ key, ctrlKey: true })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectActive()
                expect(event.defaultPrevented).toBe(true)
            })
            test('with ctrlKey, some state', async () => {
                editorAdapter.textBeforeCaret = 'xyz'
                const event = createEvent({ key, ctrlKey: true })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectActive({ matchedText: 'xyz' })
                expect(event.defaultPrevented).toBe(true)
            })
            test.each(['shiftKey', 'altKey', 'metaKey'])(
                'with %s',
                async (modifier) => {
                    autocomplete.clear()
                    await whenAnimationFrame()
                    expectNotActive()

                    const event = createEvent({ key, [modifier]: true })
                    editorAdapter.emit('keyDown', editorAdapter, event)
                    await whenAnimationFrame()
                    expectNotActive()
                    expect(event.defaultPrevented).toBe(false)
                },
            )
        })
    })

    test('input', async () => {
        autocomplete.clear()
        await whenAnimationFrame()
        expectNotActive()

        editorAdapter.emit('input', editorAdapter)
        await whenAnimationFrame()
        expectActive()
    })

    describe('selectionChange', () => {
        describe('clearOnSelectionChange === true', () => {
            beforeEach(() => {
                match.mockClear()
            })
            test('active === false', async () => {
                autocomplete.clear()
                await whenAnimationFrame()
                expectNotActive()
                editorAdapter.emit('selectionChange', editorAdapter)
                await whenAnimationFrame()
                expectNotActive()
                expect(match).toHaveBeenCalledTimes(0)
            })
            test('pendingAction === "match"', async () => {
                autocomplete.match()
                editorAdapter.emit('selectionChange', editorAdapter)
                await whenAnimationFrame()
                expectActive()
                expect(match).toHaveBeenCalledTimes(1)
            })
            test('pendingAction === "clear"', async () => {
                autocomplete.clear()
                editorAdapter.emit('selectionChange', editorAdapter)
                await whenAnimationFrame()
                expectNotActive()
                expect(match).toHaveBeenCalledTimes(0)
            })
            test('pendingAction === "updateCaretPosition"', async () => {
                autocomplete.updatePosition()
                editorAdapter.emit('selectionChange', editorAdapter)
                await whenAnimationFrame()
                expectNotActive()
                expect(match).toHaveBeenCalledTimes(0)
            })
            test('pendingAction === undefined', async () => {
                editorAdapter.emit('selectionChange', editorAdapter)
                await whenAnimationFrame()
                expectNotActive()
                expect(match).toHaveBeenCalledTimes(0)
            })
        })
        describe('clearOnSelectionChange === false', () => {
            beforeEach(async () => {
                autocomplete.destroy()
                autocomplete = createAutocomplete({
                    accept,
                    clearOnSelectionChange: false,
                    editorAdapter,
                    load,
                    match,
                })
                autocomplete.match()
                await whenAnimationFrame()
                expectActive()
                match.mockClear()
            })
            test('active === false', async () => {
                autocomplete.clear()
                await whenAnimationFrame()
                expectNotActive()
                editorAdapter.emit('selectionChange', editorAdapter)
                await whenAnimationFrame()
                expectNotActive()
                expect(match).toHaveBeenCalledTimes(0)
            })
            test('pendingAction === "match"', async () => {
                autocomplete.match()
                editorAdapter.emit('selectionChange', editorAdapter)
                await whenAnimationFrame()
                expectActive()
                expect(match).toHaveBeenCalledTimes(1)
            })
            test('pendingAction === "clear"', async () => {
                autocomplete.clear()
                editorAdapter.emit('selectionChange', editorAdapter)
                await whenAnimationFrame()
                expectNotActive()
                expect(match).toHaveBeenCalledTimes(0)
            })
            test('pendingAction === "updateCaretPosition"', async () => {
                autocomplete.updatePosition()
                editorAdapter.emit('selectionChange', editorAdapter)
                await whenAnimationFrame()
                expectActive()
                expect(match).toHaveBeenCalledTimes(1)
            })
            test('pendingAction === undefined', async () => {
                editorAdapter.emit('selectionChange', editorAdapter)
                await whenAnimationFrame()
                expectActive()
                expect(match).toHaveBeenCalledTimes(1)
            })
        })
    })
})
