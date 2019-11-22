/**
 * @jest-environment jsdom
 */
import { noop } from '@syncot/util'
import { EditorAdapter } from '@teamwork/autocomplete-core'
import CodeMirror from 'codemirror'
import { createEditorAdapter } from '.'

let editor: CodeMirror.Editor
let doc: CodeMirror.Doc
let editorAdapter: EditorAdapter

// CodeMirror editor.focus() calls window.focus(), however,
// jsdom prints an error when that function is called and
// here we suppress it.
Object.defineProperty(window, 'focus', {
    configurable: true,
    value: noop,
})

beforeEach(() => {
    editor = CodeMirror(document.body)
    doc = editor.getDoc()
    editorAdapter = createEditorAdapter(editor)
    doc.setValue('first line\nsecond line\nthird line')
    doc.setSelection({ line: 1, ch: 9 }, { line: 1, ch: 3 })
})

afterEach(() => {
    document.body.removeChild(editor.getWrapperElement())
})

describe('contains', () => {
    test('document', () => {
        expect(editorAdapter.contains(document)).toBe(false)
    })
    test("editor's parent node", () => {
        expect(
            editorAdapter.contains(editor.getWrapperElement().parentNode!),
        ).toBe(false)
    })
    test("editor's root node", () => {
        expect(editorAdapter.contains(editor.getWrapperElement())).toBe(true)
    })
    test("editor's nested element", () => {
        expect(editorAdapter.contains(editor.getScrollerElement())).toBe(true)
    })
})

test('textBeforeCaret', () => {
    expect(editorAdapter.textBeforeCaret).toBe('sec')
    expect(editorAdapter.textAfterCaret).toBe('ond line')
    expect(editor.getCursor('head')).not.toStrictEqual(
        editor.getCursor('anchor'),
    )

    editorAdapter.textBeforeCaret = 'new text before'
    expect(editorAdapter.textBeforeCaret).toBe('new text before')
    expect(editorAdapter.textAfterCaret).toBe('ond line')
    expect(editor.getCursor('head')).toStrictEqual(editor.getCursor('anchor'))
})

test('textAfterCaret', () => {
    expect(editorAdapter.textBeforeCaret).toBe('sec')
    expect(editorAdapter.textAfterCaret).toBe('ond line')
    expect(editor.getCursor('head')).not.toStrictEqual(
        editor.getCursor('anchor'),
    )

    editorAdapter.textAfterCaret = 'new text after'
    expect(editorAdapter.textBeforeCaret).toBe('sec')
    expect(editorAdapter.textAfterCaret).toBe('new text after')
    expect(editor.getCursor('head')).toStrictEqual(editor.getCursor('anchor'))
})

test('caretPosition', () => {
    expect(editorAdapter.caretPosition).toStrictEqual({
        bottom: expect.any(Number),
        left: expect.any(Number),
        right: expect.any(Number),
        top: expect.any(Number),
    })
})

test('editorPosition', () => {
    expect(editorAdapter.editorPosition).toStrictEqual({
        bottom: expect.any(Number),
        left: expect.any(Number),
        right: expect.any(Number),
        top: expect.any(Number),
    })
})

test('keyDown', () => {
    const onKeyDown = jest.fn()
    editorAdapter.on('keyDown', onKeyDown)
    const event = new KeyboardEvent('keydown')
    editor.getInputField().dispatchEvent(event)
    expect(onKeyDown).toHaveBeenCalledWith(editorAdapter, event)

    editorAdapter.destroy()
    onKeyDown.mockClear()
    editor.getInputField().dispatchEvent(event)
    expect(onKeyDown).not.toHaveBeenCalled()
})

test('keyUp', () => {
    const onKeyUp = jest.fn()
    editorAdapter.on('keyUp', onKeyUp)
    const event = new KeyboardEvent('keyup')
    editor.getInputField().dispatchEvent(event)
    expect(onKeyUp).toHaveBeenCalledWith(editorAdapter, event)

    editorAdapter.destroy()
    onKeyUp.mockClear()
    editor.getInputField().dispatchEvent(event)
    expect(onKeyUp).not.toHaveBeenCalled()
})

describe('input', () => {
    test('when CodeMirror emits inputRead', () => {
        editor.focus()
        const onInput = jest.fn()
        editorAdapter.on('input', onInput)
        const event = new Event('input')
        editor.getInputField().dispatchEvent(event)
        expect(onInput).toHaveBeenCalledWith(editorAdapter)

        editorAdapter.destroy()
        onInput.mockClear()
        editor.getInputField().dispatchEvent(event)
        expect(onInput).not.toHaveBeenCalled()
    })
    test('when CodeMirror emits keyHandled with Backspace', () => {
        editor.focus()
        const onInput = jest.fn()
        editorAdapter.on('input', onInput)
        const event = new KeyboardEvent('keydown', {
            key: 'Backspace',
            keyCode: 8 /* CodeMirror relies on keyCode */,
        } as any)
        editor.getInputField().dispatchEvent(event)
        expect(onInput).toHaveBeenCalledWith(editorAdapter)

        editorAdapter.destroy()
        onInput.mockClear()
        editor.getInputField().dispatchEvent(event)
        expect(onInput).not.toHaveBeenCalled()
    })
    test('when CodeMirror emits keyHandled with Delete', () => {
        editor.focus()
        const onInput = jest.fn()
        editorAdapter.on('input', onInput)
        const event = new KeyboardEvent('keydown', {
            key: 'Delete',
            keyCode: 46 /* CodeMirror relies on keyCode */,
        } as any)
        editor.getInputField().dispatchEvent(event)
        expect(onInput).toHaveBeenCalledWith(editorAdapter)

        editorAdapter.destroy()
        onInput.mockClear()
        editor.getInputField().dispatchEvent(event)
        expect(onInput).not.toHaveBeenCalled()
    })
    test('when CodeMirror emits keyHandled with another name', () => {
        editor.focus()
        const onInput = jest.fn()
        editorAdapter.on('input', onInput)
        const event = new KeyboardEvent('keydown', {
            key: 'Enter',
            keyCode: 13 /* CodeMirror relies on keyCode */,
        } as any)
        editor.getInputField().dispatchEvent(event)
        expect(onInput).not.toHaveBeenCalled()

        editorAdapter.destroy()
        onInput.mockClear()
        editor.getInputField().dispatchEvent(event)
        expect(onInput).not.toHaveBeenCalled()
    })
})

test('scroll', () => {
    const onScroll = jest.fn()
    editorAdapter.on('scroll', onScroll)
    const event = new Event('scroll')
    Object.defineProperty(editor.getScrollerElement(), 'clientHeight', {
        get: () => 1,
    })
    editor.getScrollerElement().dispatchEvent(event)
    expect(onScroll).toHaveBeenCalledWith(editorAdapter)

    editorAdapter.destroy()
    onScroll.mockClear()
    editor.getScrollerElement().dispatchEvent(event)
    expect(onScroll).not.toHaveBeenCalled()
})

test('resize', () => {
    const onResize = jest.fn()
    editorAdapter.on('resize', onResize)
    editor.setSize(100, 100)
    expect(onResize).toHaveBeenCalledWith(editorAdapter)

    editorAdapter.destroy()
    onResize.mockClear()
    editor.setSize(101, 101)
    expect(onResize).not.toHaveBeenCalled()
})

test('selectionChange', () => {
    const onSelectionChange = jest.fn()
    editorAdapter.on('selectionChange', onSelectionChange)
    editor.setCursor(0, 0)
    expect(onSelectionChange).toHaveBeenCalledWith(editorAdapter)

    editorAdapter.destroy()
    onSelectionChange.mockClear()
    editor.setCursor(0, 1)
    expect(onSelectionChange).not.toHaveBeenCalled()
})

test('focus', () => {
    const onFocus = jest.fn()
    editorAdapter.on('focus', onFocus)
    editor.focus()
    expect(onFocus).toHaveBeenCalledWith(editorAdapter)

    onFocus.mockClear()
    editor.focus()
    expect(onFocus).toHaveBeenCalledWith(editorAdapter)

    editorAdapter.destroy()
    onFocus.mockClear()
    editor.focus()
    expect(onFocus).not.toHaveBeenCalled()
})

test('blur', () => {
    const input = document.createElement('input')
    const onBlur = jest.fn()
    editor.focus()
    editorAdapter.on('blur', onBlur)
    input.focus()
    expect(onBlur).toHaveBeenCalledWith(editorAdapter)

    editorAdapter.destroy()
    editor.focus()
    onBlur.mockClear()
    input.focus()
    expect(onBlur).not.toHaveBeenCalled()
})
