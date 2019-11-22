/**
 * @jest-environment jsdom
 */
import { noop, TypedEventEmitter, whenNextTick } from '@syncot/util'
import {
    Autocomplete,
    createAutocomplete,
    createPatternHandler,
    createRegexPattern,
    defaultItems,
    defaultMatchedText,
    defaultPosition,
    defaultSelectedItem,
    EditorAdapter,
    EditorAdapterEvents,
    Item,
    PatternHandler,
    Position,
} from '.'

const whenAnimationFrame = () =>
    new Promise(resolve => requestAnimationFrame(resolve))

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

class MockEditorAdapter extends TypedEventEmitter<EditorAdapterEvents>
    implements EditorAdapter {
    public editor: any = {}
    public textBeforeCaret: string = ''
    public textAfterCaret: string = ''
    public caretPosition: Position = caretPosition1
    public editorPosition: Position = editorPosition1
    public destroy = noop
    public focus = noop
}

let letterItems: Item[]
let numberItems: Item[]
let letterLoad: jest.Mock<Item[] | Promise<Item[]>, [Autocomplete, string]>
let numberLoad: jest.Mock<Item[] | Promise<Item[]>, [Autocomplete, string]>
let letterAccept: jest.Mock<void, [Autocomplete, Item]>
let numberAccept: jest.Mock<void, [Autocomplete, Item]>
let letterPatternHandler: PatternHandler
let numberPatternHandler: PatternHandler
let editorAdapter: MockEditorAdapter
let autocomplete: Autocomplete

function expectNotActive(): void {
    expect(autocomplete.active).toBe(false)
    expect(autocomplete.caretPosition).toBe(defaultPosition)
    expect(autocomplete.editorPosition).toBe(defaultPosition)
    expect(autocomplete.items).toBe(defaultItems)
    expect(autocomplete.matchedText).toBe(defaultMatchedText)
    expect(autocomplete.selectedItem).toBe(defaultSelectedItem)
    expect(autocomplete.error).toBe(undefined)
    expect(autocomplete.loading).toBe(false)
}

function expectActive({
    caretPosition = caretPosition1,
    editorPosition = editorPosition1,
    items = letterItems,
    matchedText = 'def',
    selectedItem = 0,
    error,
    loading = false,
}: {
    caretPosition?: Position
    editorPosition?: Position
    items?: Readonly<Item[]>
    matchedText?: string
    selectedItem?: number
    error?: Error | undefined
    loading?: boolean
} = {}): void {
    expect(autocomplete.active).toBe(true)
    expect(autocomplete.caretPosition).toBe(caretPosition)
    expect(autocomplete.editorPosition).toBe(editorPosition)
    expect(autocomplete.items).toBe(items)
    expect(autocomplete.matchedText).toBe(matchedText)
    expect(autocomplete.selectedItem).toBe(selectedItem)
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
    letterLoad = jest.fn().mockReturnValue(letterItems)
    numberLoad = jest.fn().mockReturnValue(numberItems)
    letterAccept = jest.fn()
    numberAccept = jest.fn()
    letterPatternHandler = createPatternHandler({
        accept: letterAccept,
        load: letterLoad,
        patternBeforeCaret: createRegexPattern(/[a-zA-Z]+$/),
    })
    numberPatternHandler = createPatternHandler({
        accept: numberAccept,
        load: numberLoad,
        patternBeforeCaret: createRegexPattern(/[0-9]+$/),
    })

    editorAdapter = new MockEditorAdapter()
    autocomplete = createAutocomplete({
        editorAdapter,
        patternHandlers: [letterPatternHandler, numberPatternHandler],
    })
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
        expect(letterLoad).toHaveBeenCalledTimes(1)
        expect(letterLoad).toHaveBeenCalledWith(autocomplete, 'def')

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

describe('updateCaretPosition', () => {
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

describe('selectedItem', () => {
    test('no items', () => {
        expect(autocomplete.items).toBe(defaultItems)
        expect(autocomplete.selectedItem).toBe(defaultSelectedItem)
        autocomplete.selectedItem++
        expect(autocomplete.selectedItem).toBe(defaultSelectedItem)
        autocomplete.selectedItem--
        expect(autocomplete.selectedItem).toBe(defaultSelectedItem)
    })
    test('with items', async () => {
        autocomplete.match()
        await whenAnimationFrame()
        expect(autocomplete.items).toBe(letterItems)
        expect(autocomplete.items.length).toBe(3)
        expect(autocomplete.selectedItem).toBe(0)

        autocomplete.selectedItem = -100
        expect(autocomplete.selectedItem).toBe(0)

        autocomplete.selectedItem = 100
        expect(autocomplete.selectedItem).toBe(2)

        autocomplete.selectedItem = 0
        expect(autocomplete.selectedItem).toBe(0)

        autocomplete.selectedItem = 1
        expect(autocomplete.selectedItem).toBe(1)

        autocomplete.selectedItem = 2
        expect(autocomplete.selectedItem).toBe(2)

        autocomplete.selectedItem = 1.5
        expect(autocomplete.selectedItem).toBe(1)

        autocomplete.selectedItem = NaN
        expect(autocomplete.selectedItem).toBe(0)

        autocomplete.selectedItem = '1' as any
        expect(autocomplete.selectedItem).toBe(1)
    })
})

describe('accept', () => {
    test('no state', async () => {
        expectNotActive()

        autocomplete.accept()
        expect(letterAccept).toHaveBeenCalledTimes(0)
        await whenAnimationFrame()
        expectNotActive()
    })
    test('no items', async () => {
        const items: Item[] = []
        letterLoad.mockReturnValue(items)
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({ items, selectedItem: -1 })

        autocomplete.accept()
        expect(letterAccept).toHaveBeenCalledTimes(0)
        await whenAnimationFrame()
        expectActive({ items, selectedItem: -1 })
    })
    test('some items', async () => {
        autocomplete.match()
        await whenAnimationFrame()
        autocomplete.selectedItem = 1
        expectActive({ selectedItem: 1 })

        autocomplete.accept()
        expect(letterAccept).toHaveBeenCalledTimes(1)
        expect(letterAccept).toHaveBeenCalledWith(autocomplete, letterItems[1])
        await whenAnimationFrame()
        expectActive({ selectedItem: 1 })
    })
})

describe('loading', () => {
    let onActive: jest.Mock
    let onMatchedText: jest.Mock
    let onItems: jest.Mock
    let onSelectedItem: jest.Mock
    let onCaretPosition: jest.Mock
    let onEditorPosition: jest.Mock
    let onError: jest.Mock
    let onLoading: jest.Mock

    beforeEach(() => {
        autocomplete.on('active', (onActive = jest.fn()))
        autocomplete.on('matchedText', (onMatchedText = jest.fn()))
        autocomplete.on('items', (onItems = jest.fn()))
        autocomplete.on('selectedItem', (onSelectedItem = jest.fn()))
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
        expect(onItems).toHaveBeenCalledTimes(1)
        expect(onSelectedItem).toHaveBeenCalledTimes(1)
        expect(onCaretPosition).toHaveBeenCalledTimes(1)
        expect(onEditorPosition).toHaveBeenCalledTimes(1)
        expect(onError).toHaveBeenCalledTimes(0)
        expect(onLoading).toHaveBeenCalledTimes(0)
    })
    test('sync error', async () => {
        const error = new Error('test error')
        letterLoad.mockImplementation(() => {
            throw error
        })
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({ error, items: defaultItems, selectedItem: -1 })

        expect(onActive).toHaveBeenCalledTimes(1)
        expect(onMatchedText).toHaveBeenCalledTimes(1)
        expect(onItems).toHaveBeenCalledTimes(0)
        expect(onSelectedItem).toHaveBeenCalledTimes(0)
        expect(onCaretPosition).toHaveBeenCalledTimes(1)
        expect(onEditorPosition).toHaveBeenCalledTimes(1)
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onLoading).toHaveBeenCalledTimes(0)
    })
    test('async success', async () => {
        let resolve1: (items: Item[]) => void
        const promise1: Promise<Item[]> = new Promise(r => (resolve1 = r))
        let resolve2: (items: Item[]) => void
        const promise2: Promise<Item[]> = new Promise(r => (resolve2 = r))
        letterLoad.mockReset()
        letterLoad.mockImplementationOnce(() => promise1)
        letterLoad.mockImplementationOnce(() => promise2)

        // Record and wait for promise1.
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({
            items: defaultItems,
            loading: true,
            selectedItem: -1,
        })

        // Record and wait for promise2.
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({
            items: defaultItems,
            loading: true,
            selectedItem: -1,
        })

        // Resolve the promises in the reversed order.
        resolve2!(letterItems)
        resolve1!(numberItems)

        // The last recorded promise wins, regardless of the resolution order.
        await whenNextTick()
        expectActive()
        expect(onActive).toHaveBeenCalledTimes(1)
        expect(onMatchedText).toHaveBeenCalledTimes(1)
        expect(onItems).toHaveBeenCalledTimes(1)
        expect(onSelectedItem).toHaveBeenCalledTimes(1)
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
        letterLoad.mockReset()
        letterLoad.mockImplementationOnce(() => promise1)
        letterLoad.mockImplementationOnce(() => promise2)

        // Record and wait for promise1.
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({
            items: defaultItems,
            loading: true,
            selectedItem: -1,
        })

        // Record and wait for promise2.
        autocomplete.match()
        await whenAnimationFrame()
        expectActive({
            items: defaultItems,
            loading: true,
            selectedItem: -1,
        })

        // Reject the promises in the reversed order.
        reject2!(error2)
        reject1!(error1)

        // The last recorded promise wins, regardless of the rejection order.
        await whenNextTick()
        expectActive({
            error: error2,
            items: defaultItems,
            selectedItem: -1,
        })

        expect(onActive).toHaveBeenCalledTimes(1)
        expect(onMatchedText).toHaveBeenCalledTimes(1)
        expect(onItems).toHaveBeenCalledTimes(0)
        expect(onSelectedItem).toHaveBeenCalledTimes(0)
        expect(onCaretPosition).toHaveBeenCalledTimes(1)
        expect(onEditorPosition).toHaveBeenCalledTimes(1)
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onLoading).toHaveBeenCalledTimes(2)
    })
    test('clear when loading=true', async () => {
        let resolve: (items: Item[]) => void
        const promise: Promise<Item[]> = new Promise(r => (resolve = r))
        letterLoad.mockReset()
        letterLoad.mockImplementationOnce(() => promise)

        autocomplete.match()
        await whenAnimationFrame()
        expectActive({
            items: defaultItems,
            loading: true,
            selectedItem: -1,
        })

        autocomplete.clear()
        await whenAnimationFrame()
        expectNotActive()

        resolve!(letterItems)
        await whenNextTick()
        expectNotActive()

        expect(onActive).toHaveBeenCalledTimes(2)
        expect(onMatchedText).toHaveBeenCalledTimes(2)
        expect(onItems).toHaveBeenCalledTimes(0)
        expect(onSelectedItem).toHaveBeenCalledTimes(0)
        expect(onCaretPosition).toHaveBeenCalledTimes(2)
        expect(onEditorPosition).toHaveBeenCalledTimes(2)
        expect(onError).toHaveBeenCalledTimes(0)
        expect(onLoading).toHaveBeenCalledTimes(2)
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

        describe.each(['Up', 'ArrowUp'])('%p', key => {
            beforeEach(() => {
                autocomplete.selectedItem = 2
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
                letterLoad.mockReturnValue(items)
                autocomplete.match()
                await whenAnimationFrame()
                expectActive({ items, selectedItem: -1 })

                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectActive({ items, selectedItem: -1 })
                expect(event.defaultPrevented).toBe(false)
            })
            test('some items', async () => {
                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectActive({ selectedItem: 1 })
                expect(event.defaultPrevented).toBe(true)
            })
            test.each(['ctrlKey', 'shiftKey', 'altKey', 'metaKey'])(
                'with %s',
                async modifier => {
                    const event = createEvent({ key, [modifier]: true })
                    editorAdapter.emit('keyDown', editorAdapter, event)
                    await whenAnimationFrame()
                    expectActive({ selectedItem: 2 })
                    expect(event.defaultPrevented).toBe(false)
                },
            )
        })

        describe.each(['Down', 'ArrowDown'])('%p', key => {
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
                letterLoad.mockReturnValue(items)
                autocomplete.match()
                await whenAnimationFrame()
                expectActive({ items, selectedItem: -1 })

                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectActive({ items, selectedItem: -1 })
                expect(event.defaultPrevented).toBe(false)
            })
            test('some items', async () => {
                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectActive({ selectedItem: 1 })
                expect(event.defaultPrevented).toBe(true)
            })
            test.each(['ctrlKey', 'shiftKey', 'altKey', 'metaKey'])(
                'with %s',
                async modifier => {
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
                expect(letterAccept).toHaveBeenCalledTimes(0)
            })

            test('no items', async () => {
                const items: Item[] = []
                letterLoad.mockReturnValue(items)
                autocomplete.match()
                await whenAnimationFrame()
                expectActive({ items, selectedItem: -1 })

                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectActive({ items, selectedItem: -1 })
                expect(event.defaultPrevented).toBe(false)
                expect(letterAccept).toHaveBeenCalledTimes(0)
            })

            test.each([0, 1, 2])('selectedItem = %d', async selectedItem => {
                autocomplete.selectedItem = selectedItem
                const event = createEvent({ key })
                editorAdapter.emit('keyDown', editorAdapter, event)
                await whenAnimationFrame()
                expectActive({ selectedItem })
                expect(event.defaultPrevented).toBe(true)
                expect(letterAccept).toHaveBeenCalledTimes(1)
                expect(letterAccept).toHaveBeenCalledWith(
                    autocomplete,
                    letterItems[selectedItem],
                )
            })

            test.each(['ctrlKey', 'shiftKey', 'altKey', 'metaKey'])(
                'with %s',
                async modifier => {
                    const event = createEvent({ key, [modifier]: true })
                    editorAdapter.emit('keyDown', editorAdapter, event)
                    await whenAnimationFrame()
                    expectActive()
                    expect(event.defaultPrevented).toBe(false)
                    expect(letterAccept).toHaveBeenCalledTimes(0)
                },
            )
        })

        describe.each(['Esc', 'Escape'])('%p', key => {
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
                async modifier => {
                    const event = createEvent({ key, [modifier]: true })
                    editorAdapter.emit('keyDown', editorAdapter, event)
                    await whenAnimationFrame()
                    expectActive()
                    expect(event.defaultPrevented).toBe(false)
                },
            )
        })

        describe.each(['Spacebar', ' '])('%p', key => {
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
                async modifier => {
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
        test('pendingAction === "match"', async () => {
            autocomplete.match()
            editorAdapter.emit('selectionChange', editorAdapter)
            await whenAnimationFrame()
            expectActive()
        })
        test('pendingAction === "clear"', async () => {
            autocomplete.clear()
            editorAdapter.emit('selectionChange', editorAdapter)
            await whenAnimationFrame()
            expectNotActive()
        })
        test('pendingAction === "updateCaretPosition"', async () => {
            autocomplete.updatePosition()
            editorAdapter.emit('selectionChange', editorAdapter)
            await whenAnimationFrame()
            expectNotActive()
        })
        test('pendingAction === undefined', async () => {
            editorAdapter.emit('selectionChange', editorAdapter)
            await whenAnimationFrame()
            expectNotActive()
        })
    })
})
