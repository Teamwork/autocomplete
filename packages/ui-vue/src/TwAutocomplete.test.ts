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
import { mount, Wrapper } from '@vue/test-utils'
import Vue from 'vue'
import { TwAutocomplete, ViewName } from '.'

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

let editorAdapter: MockEditorAdapter
let items: Item[]
let match: jest.Mock
let load: jest.Mock
let autocomplete: Autocomplete
let wrapper: Wrapper<InstanceType<TwAutocomplete>>
let component: InstanceType<TwAutocomplete>

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
    wrapper.destroy()
})

describe('init', () => {
    beforeEach(() => {
        wrapper = mount(TwAutocomplete)
        component = wrapper.vm
    })

    test('init twice', () => {
        component.init(autocomplete)
        expect(() => component.init(autocomplete)).toThrow(
            'Already initialized',
        )
    })

    test('init with a null', () => {
        expect(() => component.init(null as any)).toThrow(
            '"autocomplete" must not be null',
        )
    })

    test('initial data (inactive)', async () => {
        expect(autocomplete.active).toBe(false)
        component.init(autocomplete)
        expect(component.caretPosition).toBe(autocomplete.caretPosition)
        expect(component.editorPosition).toBe(autocomplete.editorPosition)
        expect(component.error).toBe(autocomplete.error)
        expect(component.loading).toBe(autocomplete.loading)
        expect(component.items).toBe(autocomplete.items)
        expect(component.matchedText).toBe(autocomplete.matchedText)
        expect(component.selectedIndex).toBe(autocomplete.selectedIndex)
    })

    test('initial data (active)', async () => {
        editorAdapter.textBeforeCaret = 'abc'
        autocomplete.match()
        await whenAnimationFrame()

        expect(autocomplete.active).toBe(true)
        component.init(autocomplete)
        expect(component.caretPosition).toBe(autocomplete.caretPosition)
        expect(component.editorPosition).toBe(autocomplete.editorPosition)
        expect(component.error).toBe(autocomplete.error)
        expect(component.loading).toBe(autocomplete.loading)
        expect(component.items).toBe(autocomplete.items)
        expect(component.matchedText).toBe(autocomplete.matchedText)
        expect(component.selectedIndex).toBe(autocomplete.selectedIndex)
    })
})

describe('component', () => {
    beforeEach(() => {
        wrapper = mount(TwAutocomplete)
        component = wrapper.vm
        component.init(autocomplete)
    })

    test('data update', async () => {
        editorAdapter.textBeforeCaret = 'abc'
        autocomplete.match()
        await whenAnimationFrame()

        expect(autocomplete.active).toBe(true)
        expect(component.caretPosition).toBe(autocomplete.caretPosition)
        expect(component.editorPosition).toBe(autocomplete.editorPosition)
        expect(component.error).toBe(autocomplete.error)
        expect(component.loading).toBe(autocomplete.loading)
        expect(component.items).toBe(autocomplete.items)
        expect(component.matchedText).toBe(autocomplete.matchedText)
        expect(component.selectedIndex).toBe(autocomplete.selectedIndex)
    })

    describe('visibility', () => {
        test('visible === true', async () => {
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()

            expect(component.caretVisible).toBe(true)
            expect(component.visible).toBe(true)
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

            expect(component.caretVisible).toBe(false)
            expect(component.visible).toBe(false)
        })

        test('visible === false && caretVisible === true', async () => {
            expect(component.caretVisible).toBe(true)
            expect(component.visible).toBe(false)
        })
    })

    describe('viewName', () => {
        test('error', async () => {
            load.mockImplementation(() => {
                throw new Error('test error')
            })
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()
            expect(component.viewName).toBe(ViewName.error)
        })
        test('items', async () => {
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()
            expect(component.viewName).toBe(ViewName.items)
        })
        test('loading', async () => {
            load.mockReturnValue(new Promise(() => undefined))
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()
            expect(component.viewName).toBe(ViewName.loading)
        })
        test('blank', async () => {
            load.mockReturnValue([])
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()
            expect(component.viewName).toBe(ViewName.blank)
        })
    })

    describe('events', () => {
        beforeEach(async () => {
            editorAdapter.textBeforeCaret = 'abc'
            autocomplete.match()
            await whenAnimationFrame()
            expect(component.active).toBe(true)
            document.body.appendChild(component.$el)
        })

        afterEach(() => {
            document.body.removeChild(component.$el)
        })

        test('click item', async () => {
            wrapper
                .find('.tw-autocomplete__list-item:nth-child(2)')
                .trigger('click')
            await whenAnimationFrame()
            expect(component.active).toBe(false)
            expect(editorAdapter.textBeforeCaret).toBe(items[1].text)
            expect(editorAdapter.textAfterCaret).toBe('')
        })
    })
})

describe('slots', () => {
    const blockName = 'my-block-name'
    const propsData = { blockName }

    test.each(['footer', 'header'])('%s', async (name) => {
        const slotValue = `My "${name}" slot`
        const slot = jest.fn().mockReturnValue(slotValue)
        editorAdapter.textBeforeCaret = 'abc'
        autocomplete.match()
        await whenAnimationFrame()
        wrapper = mount(TwAutocomplete, {
            propsData,
            scopedSlots: { [name]: slot },
        })
        component = wrapper.vm
        component.init(autocomplete)
        await Vue.nextTick()
        expect(wrapper.html()).toMatch(blockName)
        expect(wrapper.html()).toMatch(slotValue)
        expect(slot).toHaveBeenCalledWith({
            matchedText: component.matchedText,
            viewName: component.viewName,
        })
    })
    test.each(['afterItem', 'beforeItem', 'item'])('%s', async (name) => {
        const slotValue = `My "${name}" slot`
        const slot = jest.fn().mockReturnValue(slotValue)
        editorAdapter.textBeforeCaret = 'abc'
        autocomplete.match()
        await whenAnimationFrame()
        wrapper = mount(TwAutocomplete, {
            propsData,
            scopedSlots: { [name]: slot },
        })
        component = wrapper.vm
        component.init(autocomplete)
        await Vue.nextTick()
        expect(wrapper.html()).toMatch(blockName)
        expect(wrapper.html()).toMatch(slotValue)
        expect(slot).toHaveBeenCalledWith({
            index: 0,
            item: items[0],
            items,
            matchedText: component.matchedText,
        })
        expect(slot).toHaveBeenCalledWith({
            index: 1,
            item: items[1],
            items,
            matchedText: component.matchedText,
        })
        expect(slot).toHaveBeenCalledWith({
            index: 2,
            item: items[2],
            items,
            matchedText: component.matchedText,
        })
    })
    test('error', async () => {
        const slotValue = `My "error" slot`
        const slot = jest.fn().mockReturnValue(slotValue)
        load.mockImplementation(() => {
            throw new Error('test error')
        })
        editorAdapter.textBeforeCaret = 'abc'
        autocomplete.match()
        await whenAnimationFrame()
        wrapper = mount(TwAutocomplete, {
            propsData,
            scopedSlots: { error: slot },
        })
        component = wrapper.vm
        component.init(autocomplete)
        await Vue.nextTick()
        expect(wrapper.html()).toMatch(blockName)
        expect(wrapper.html()).toMatch(slotValue)
        expect(slot).toHaveBeenCalledWith({
            error: component.error,
            matchedText: component.matchedText,
        })
    })
    test('blank', async () => {
        const slotValue = `My "blank" slot`
        const slot = jest.fn().mockReturnValue(slotValue)
        load.mockReturnValue([])
        editorAdapter.textBeforeCaret = 'abc'
        autocomplete.match()
        await whenAnimationFrame()
        wrapper = mount(TwAutocomplete, {
            propsData,
            scopedSlots: { blank: slot },
        })
        component = wrapper.vm
        component.init(autocomplete)
        await Vue.nextTick()
        expect(wrapper.html()).toMatch(blockName)
        expect(wrapper.html()).toMatch(slotValue)
        expect(slot).toHaveBeenCalledWith({
            matchedText: component.matchedText,
        })
    })
    test('loading', async () => {
        const slotValue = `My "loading" slot`
        const slot = jest.fn().mockReturnValue(slotValue)
        load.mockReturnValue(new Promise(noop))
        editorAdapter.textBeforeCaret = 'abc'
        autocomplete.match()
        await whenAnimationFrame()
        wrapper = mount(TwAutocomplete, {
            propsData,
            scopedSlots: { loading: slot },
        })
        component = wrapper.vm
        component.init(autocomplete)
        await Vue.nextTick()
        expect(wrapper.html()).toMatch(blockName)
        expect(wrapper.html()).toMatch(slotValue)
        expect(slot).toHaveBeenCalledWith({
            matchedText: component.matchedText,
        })
    })
})
