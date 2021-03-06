import { TypedEventEmitter } from '@syncot/events'
import { noop } from '@syncot/util'
import {
    Autocomplete,
    createAutocomplete,
    EditorAdapter,
    EditorAdapterEvents,
    Item,
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
    new Promise((resolve) => requestAnimationFrame(resolve))

const caretPosition: Position = Object.freeze({
    bottom: 20,
    left: 20,
    right: 20,
    top: 20,
})
const editorPosition: Position = Object.freeze({
    bottom: 20,
    left: 10,
    right: 20,
    top: 10,
})

function getCaretPosition(this: EditorAdapter, _offset: number = 0): Position {
    return this.caretPosition
}

class MockEditorAdapter extends TypedEventEmitter<EditorAdapterEvents>
    implements EditorAdapter {
    public editor: any = {}
    public textBeforeCaret: string = ''
    public textAfterCaret: string = ''
    public caretPosition: Position = caretPosition
    public editorPosition: Position = editorPosition
    public destroy = noop
    public focus = noop
    public getCaretPosition = getCaretPosition
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
            blockName: 'my-custom-element',
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
        expect(customTemplate).toMatch(options.blockName)
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
    let match: jest.Mock
    let load: jest.Mock
    let autocomplete: Autocomplete
    let component: TwAutocomplete

    beforeEach(() => {
        editorAdapter = new MockEditorAdapter()
        items = [
            { id: 0, text: 'Letter item 0' },
            { id: 1, text: 'Letter item 1' },
            { id: 2, text: 'Letter item 2' },
        ]
        match = jest.fn().mockReturnValue([3, 0])
        load = jest.fn().mockReturnValue(items)
        autocomplete = createAutocomplete({ editorAdapter, load, match })
    })

    afterEach(() => {
        component.dispose()
    })

    test('initial data (inactive)', async () => {
        expect(autocomplete.active).toBe(false)

        component = new TwAutocomplete({ autocomplete })
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

        component = new TwAutocomplete({ autocomplete })
        expect(component.caretPosition()).toBe(autocomplete.caretPosition)
        expect(component.editorPosition()).toBe(autocomplete.editorPosition)
        expect(component.error()).toBe(autocomplete.error)
        expect(component.loading()).toBe(autocomplete.loading)
        expect(component.items()).toBe(autocomplete.items)
        expect(component.matchedText()).toBe(autocomplete.matchedText)
        expect(component.selectedIndex()).toBe(autocomplete.selectedIndex)
    })

    test('data update', async () => {
        component = new TwAutocomplete({ autocomplete })

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

            component = new TwAutocomplete({ autocomplete })
            expect(component.caretVisible()).toBe(true)
            expect(component.visible()).toBe(true)
        })

        test('visible === false && caretVisible === false', async () => {
            editorAdapter.caretPosition = {
                bottom: 9, // outside the editor
                left: 20,
                right: 20,
                top: 9,
            }
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()

            component = new TwAutocomplete({ autocomplete })
            expect(component.caretVisible()).toBe(false)
            expect(component.visible()).toBe(false)
        })

        test('visible === false && caretVisible === true', async () => {
            component = new TwAutocomplete({ autocomplete })
            expect(component.caretVisible()).toBe(true)
            expect(component.visible()).toBe(false)
        })
    })

    describe('viewName', () => {
        test('error', async () => {
            component = new TwAutocomplete({ autocomplete })
            load.mockImplementation(() => {
                throw new Error('test error')
            })
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()
            expect(component.viewName()).toBe(ViewName.error)
        })
        test('items', async () => {
            component = new TwAutocomplete({ autocomplete })
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()
            expect(component.viewName()).toBe(ViewName.items)
        })
        test('loading', async () => {
            component = new TwAutocomplete({ autocomplete })
            load.mockReturnValue(new Promise(noop))
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()
            expect(component.viewName()).toBe(ViewName.loading)
        })
        test('blank', async () => {
            component = new TwAutocomplete({ autocomplete })
            load.mockReturnValue([])
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()
            expect(component.viewName()).toBe(ViewName.blank)
        })
    })
})
