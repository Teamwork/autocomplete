import { TypedEventEmitter } from '@syncot/events'
import { noop } from '@syncot/util'
import {
    Autocomplete,
    createAutocomplete,
    createPatternHandler,
    createRegexPattern,
    EditorAdapter,
    EditorAdapterEvents,
    Item,
    PatternHandler,
    Position,
} from '@teamwork/autocomplete-core'
import {
    createTemplate,
    CreateTemplateOptions,
    default as twAutocomplete,
    template,
    TwAutocomplete,
    ViewName,
} from '.'

const whenAnimationFrame = () =>
    new Promise(resolve => requestAnimationFrame(resolve))

const caretPosition: Position = Object.freeze({
    bottom: 19,
    left: 11,
    right: 19,
    top: 19,
})
const editorPosition: Position = Object.freeze({
    bottom: 20,
    left: 10,
    right: 20,
    top: 10,
})

class MockEditorAdapter extends TypedEventEmitter<EditorAdapterEvents>
    implements EditorAdapter {
    public editor: any = {}
    public textBeforeCaret: string = ''
    public textAfterCaret: string = ''
    public caretPosition: Position = caretPosition
    public editorPosition: Position = editorPosition
    public destroy = noop
    public focus = noop
}

describe('export', () => {
    test('twAutocomplete.template', () => {
        expect(twAutocomplete.template).toBe(template)
    })
    test('twAutocomplete.viewModel', () => {
        expect(twAutocomplete.viewModel).toBe(TwAutocomplete)
    })
    test('template', () => {
        expect(typeof template).toBe('string')
    })
    test('TwAutocomplete', () => {
        expect(TwAutocomplete).toBeInstanceOf(Function)
    })
    test('createTemplate', () => {
        expect(createTemplate).toBeInstanceOf(Function)
    })
})

describe('createTemplate', () => {
    test('no options', () => {
        expect(createTemplate()).toBe(template)
    })
    test('with options', () => {
        const options: Required<CreateTemplateOptions> = {
            afterItem: 'my "afterItem"',
            beforeItem: 'my "beforeItem"',
            blank: 'my "blank"',
            error: 'my "error"',
            footer: 'my "footer"',
            header: 'my "header"',
            item: 'my "item"',
            loading: 'my "loading"',
        }
        const customTemplate = createTemplate(options)
        expect(customTemplate).not.toBe(template)
        expect(customTemplate).toMatch(options.afterItem)
        expect(customTemplate).toMatch(options.beforeItem)
        expect(customTemplate).toMatch(options.blank)
        expect(customTemplate).toMatch(options.error)
        expect(customTemplate).toMatch(options.footer)
        expect(customTemplate).toMatch(options.header)
        expect(customTemplate).toMatch(options.item)
        expect(customTemplate).toMatch(options.loading)
    })
})

describe('TwAutocomplete', () => {
    let editorAdapter: MockEditorAdapter
    let items: Item[]
    let load: jest.Mock
    let patternHandler: PatternHandler
    let autocomplete: Autocomplete
    let component: TwAutocomplete

    beforeEach(() => {
        editorAdapter = new MockEditorAdapter()
        items = [
            { id: 0, text: 'Letter item 0' },
            { id: 1, text: 'Letter item 1' },
            { id: 2, text: 'Letter item 2' },
        ]
        load = jest.fn()
        load.mockReturnValue(items)
        patternHandler = createPatternHandler({
            load,
            patternBeforeCaret: createRegexPattern(/[a-zA-Z]+$/),
        })
        autocomplete = createAutocomplete({
            editorAdapter,
            patternHandlers: [patternHandler],
        })
    })

    afterEach(() => {
        component.dispose()
    })

    test('initial data (inactive)', async () => {
        expect(autocomplete.active).toBe(false)

        component = new TwAutocomplete(autocomplete)
        expect(component.caretPosition()).toBe(autocomplete.caretPosition)
        expect(component.editorPosition()).toBe(autocomplete.editorPosition)
        expect(component.error()).toBe(autocomplete.error)
        expect(component.loading()).toBe(autocomplete.loading)
        expect(component.items()).toBe(autocomplete.items)
        expect(component.matchedText()).toBe(autocomplete.matchedText)
        expect(component.selectedIndex()).toBe(autocomplete.selectedIndex)
    })

    test('initial data (active)', async () => {
        editorAdapter.textBeforeCaret = 'abc'
        autocomplete.match()
        await whenAnimationFrame()
        expect(autocomplete.active).toBe(true)

        component = new TwAutocomplete(autocomplete)
        expect(component.caretPosition()).toBe(autocomplete.caretPosition)
        expect(component.editorPosition()).toBe(autocomplete.editorPosition)
        expect(component.error()).toBe(autocomplete.error)
        expect(component.loading()).toBe(autocomplete.loading)
        expect(component.items()).toBe(autocomplete.items)
        expect(component.matchedText()).toBe(autocomplete.matchedText)
        expect(component.selectedIndex()).toBe(autocomplete.selectedIndex)
    })

    test('data update', async () => {
        component = new TwAutocomplete(autocomplete)

        editorAdapter.textBeforeCaret = 'abc'
        autocomplete.match()
        await whenAnimationFrame()
        expect(autocomplete.active).toBe(true)

        expect(component.caretPosition()).toBe(autocomplete.caretPosition)
        expect(component.editorPosition()).toBe(autocomplete.editorPosition)
        expect(component.error()).toBe(autocomplete.error)
        expect(component.loading()).toBe(autocomplete.loading)
        expect(component.items()).toBe(autocomplete.items)
        expect(component.matchedText()).toBe(autocomplete.matchedText)
        expect(component.selectedIndex()).toBe(autocomplete.selectedIndex)
    })

    describe('visibility', () => {
        test('visible === true', async () => {
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()

            component = new TwAutocomplete(autocomplete)
            expect(component.caretVisible()).toBe(true)
            expect(component.visible()).toBe(true)
        })

        test('visible === false && caretVisible === false', async () => {
            editorAdapter.caretPosition = {
                bottom: 9, // outside the editor
                left: 11,
                right: 19,
                top: 19,
            }
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()

            component = new TwAutocomplete(autocomplete)
            expect(component.caretVisible()).toBe(false)
            expect(component.visible()).toBe(false)
        })

        test('visible === false && caretVisible === true', async () => {
            component = new TwAutocomplete(autocomplete)
            expect(component.caretVisible()).toBe(true)
            expect(component.visible()).toBe(false)
        })
    })

    describe('viewName', () => {
        test('error', async () => {
            component = new TwAutocomplete(autocomplete)
            load.mockImplementation(() => {
                throw new Error('test error')
            })
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()
            expect(component.viewName()).toBe(ViewName.error)
        })
        test('items', async () => {
            component = new TwAutocomplete(autocomplete)
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()
            expect(component.viewName()).toBe(ViewName.items)
        })
        test('loading', async () => {
            component = new TwAutocomplete(autocomplete)
            load.mockReturnValue(new Promise(noop))
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()
            expect(component.viewName()).toBe(ViewName.loading)
        })
        test('blank', async () => {
            component = new TwAutocomplete(autocomplete)
            load.mockReturnValue([])
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()
            expect(component.viewName()).toBe(ViewName.blank)
        })
    })

    describe('mouse events', () => {
        const textNode = document.createTextNode('test')
        const componentNode = document.createElement('div')
        componentNode.appendChild(textNode)

        beforeAll(() => {
            document.body.appendChild(componentNode)
        })

        afterAll(() => {
            document.body.removeChild(componentNode)
        })

        beforeEach(async () => {
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()
            component = new TwAutocomplete(autocomplete)
            ;(component as any).node = componentNode
            expect(component.active()).toBe(true)
        })

        test('mousedown outside', async () => {
            const event = new MouseEvent('mousedown')
            document.dispatchEvent(event)
            await whenAnimationFrame()
            expect(component.active()).toBe(false)
        })
        test('mouseup outside', async () => {
            const event = new MouseEvent('mouseup')
            document.dispatchEvent(event)
            await whenAnimationFrame()
            expect(component.active()).toBe(false)
        })
        test('mousedown inside', async () => {
            const event = new MouseEvent('mousedown')
            textNode.dispatchEvent(event)
            await whenAnimationFrame()
            expect(component.active()).toBe(true)
        })
        test('mouseup inside', async () => {
            const event = new MouseEvent('mouseup')
            textNode.dispatchEvent(event)
            await whenAnimationFrame()
            expect(component.active()).toBe(true)
        })
    })
})
