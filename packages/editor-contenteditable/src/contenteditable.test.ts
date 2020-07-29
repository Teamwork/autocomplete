import { EditorAdapter } from '@teamwork/autocomplete-core'
import { createEditorAdapter, Editor } from '.'

let editor: Editor
let editorAdapter: EditorAdapter
let containerNode: Node
let prefixNode: Node
let suffixNode: Node
let textNode: Text
let externalNode: Text
const prefix = 'prefix'
const suffix = 'suffix'
const textBefore = '!initial text before!'
const textAfter = '?initial text after?'
const selection = document.getSelection()!

beforeEach(() => {
    editor = document.createElement('div') as Editor
    editor.setAttribute('contenteditable', 'true')
    editor.setAttribute('tabindex', '0')
    editorAdapter = createEditorAdapter(editor)
    containerNode = document.createElement('strong')
    prefixNode = document.createTextNode(prefix)
    suffixNode = document.createTextNode(suffix)
    textNode = document.createTextNode(textBefore + textAfter)
    externalNode = document.createTextNode('outside of the editor')
    document.body.appendChild(editor)
    document.body.appendChild(externalNode)
    editor.appendChild(prefixNode)
    editor.appendChild(containerNode)
    editor.appendChild(suffixNode)
    containerNode.appendChild(textNode)
    selection.collapse(prefixNode, 2)
    selection.extend(textNode, textBefore.length)
})

afterEach(() => {
    document.body.removeChild(editor)
})

test('focus', () => {
    expect(document.activeElement).not.toBe(editor)
    editorAdapter.focus()
    expect(document.activeElement).toBe(editor)
})

describe('textBeforeCaret', () => {
    test('valid selection', () => {
        expect(editorAdapter.textBeforeCaret).toBe(textBefore)
        expect(editorAdapter.textAfterCaret).toBe(textAfter)
        expect(selection.anchorNode).not.toBe(selection.focusNode)

        const newTextBefore = '*new text before*'
        editorAdapter.textBeforeCaret = newTextBefore
        expect(editorAdapter.textBeforeCaret).toBe(newTextBefore)
        expect(editorAdapter.textAfterCaret).toBe(textAfter)
        expect(selection.anchorNode).toBe(selection.focusNode)
        expect(selection.anchorOffset).toBe(selection.focusOffset)
    })

    test('no selection', () => {
        selection.removeAllRanges()
        expect(editorAdapter.textBeforeCaret).toBe('')
        expect(editorAdapter.textAfterCaret).toBe('')

        const newTextBefore = '*new text before*'
        editorAdapter.textBeforeCaret = newTextBefore
        expect(editorAdapter.textBeforeCaret).toBe('')
        expect(editorAdapter.textAfterCaret).toBe('')
        expect(selection.anchorNode).toBe(null)
        expect(selection.anchorOffset).toBe(0)
        expect(selection.focusNode).toBe(null)
        expect(selection.focusOffset).toBe(0)
    })

    test('selection in an element', () => {
        selection.collapse(containerNode, 0)
        expect(editorAdapter.textBeforeCaret).toBe('')
        expect(editorAdapter.textAfterCaret).toBe('')

        const newTextBefore = '*new text before*'
        editorAdapter.textBeforeCaret = newTextBefore
        expect(editorAdapter.textBeforeCaret).toBe('')
        expect(editorAdapter.textAfterCaret).toBe('')
        expect(selection.anchorNode).toBe(containerNode)
        expect(selection.anchorOffset).toBe(0)
        expect(selection.focusNode).toBe(containerNode)
        expect(selection.focusOffset).toBe(0)
    })

    test('selection outside of the editor', () => {
        selection.collapse(externalNode, 0)
        expect(editorAdapter.textBeforeCaret).toBe('')
        expect(editorAdapter.textAfterCaret).toBe('')

        const newTextBefore = '*new text before*'
        editorAdapter.textBeforeCaret = newTextBefore
        expect(editorAdapter.textBeforeCaret).toBe('')
        expect(editorAdapter.textAfterCaret).toBe('')
        expect(selection.anchorNode).toBe(externalNode)
        expect(selection.anchorOffset).toBe(0)
        expect(selection.focusNode).toBe(externalNode)
        expect(selection.focusOffset).toBe(0)
    })
})

describe('textAfterCaret', () => {
    test('valid selection', () => {
        expect(editorAdapter.textBeforeCaret).toBe(textBefore)
        expect(editorAdapter.textAfterCaret).toBe(textAfter)
        expect(selection.anchorNode).not.toBe(selection.focusNode)

        const newTextAfter = '*new text after*'
        editorAdapter.textAfterCaret = newTextAfter
        expect(editorAdapter.textBeforeCaret).toBe(textBefore)
        expect(editorAdapter.textAfterCaret).toBe(newTextAfter)
        expect(selection.anchorNode).toBe(selection.focusNode)
        expect(selection.anchorOffset).toBe(selection.focusOffset)
    })

    test('no selection', () => {
        selection.removeAllRanges()
        expect(editorAdapter.textBeforeCaret).toBe('')
        expect(editorAdapter.textAfterCaret).toBe('')

        const newTextAfter = '*new text after*'
        editorAdapter.textAfterCaret = newTextAfter
        expect(editorAdapter.textBeforeCaret).toBe('')
        expect(editorAdapter.textAfterCaret).toBe('')
        expect(selection.anchorNode).toBe(null)
        expect(selection.anchorOffset).toBe(0)
        expect(selection.focusNode).toBe(null)
        expect(selection.focusOffset).toBe(0)
    })

    test('selection in an element', () => {
        selection.collapse(containerNode, 0)
        expect(editorAdapter.textBeforeCaret).toBe('')
        expect(editorAdapter.textAfterCaret).toBe('')

        const newTextAfter = '*new text after*'
        editorAdapter.textAfterCaret = newTextAfter
        expect(editorAdapter.textBeforeCaret).toBe('')
        expect(editorAdapter.textAfterCaret).toBe('')
        expect(selection.anchorNode).toBe(containerNode)
        expect(selection.anchorOffset).toBe(0)
        expect(selection.focusNode).toBe(containerNode)
        expect(selection.focusOffset).toBe(0)
    })

    test('selection outside of the editor', () => {
        selection.collapse(externalNode, 0)
        expect(editorAdapter.textBeforeCaret).toBe('')
        expect(editorAdapter.textAfterCaret).toBe('')

        const newTextAfter = '*new text after*'
        editorAdapter.textAfterCaret = newTextAfter
        expect(editorAdapter.textBeforeCaret).toBe('')
        expect(editorAdapter.textAfterCaret).toBe('')
        expect(selection.anchorNode).toBe(externalNode)
        expect(selection.anchorOffset).toBe(0)
        expect(selection.focusNode).toBe(externalNode)
        expect(selection.focusOffset).toBe(0)
    })
})

describe('getCaretPosition', () => {
    test('valid selection, without offset', () => {
        expect(editorAdapter.getCaretPosition()).toStrictEqual({
            bottom: expect.any(Number),
            left: expect.any(Number),
            right: expect.any(Number),
            top: expect.any(Number),
        })
    })

    test('valid selection, with offset', () => {
        expect(editorAdapter.getCaretPosition(5)).toStrictEqual({
            bottom: expect.any(Number),
            left: expect.any(Number),
            right: expect.any(Number),
            top: expect.any(Number),
        })
    })

    test('no selection', () => {
        selection.removeAllRanges()
        expect(editorAdapter.getCaretPosition()).toStrictEqual({
            bottom: 0,
            left: 0,
            right: 0,
            top: 0,
        })
    })
})

describe('caretPosition', () => {
    test('valid selection', () => {
        expect(editorAdapter.caretPosition).toStrictEqual({
            bottom: expect.any(Number),
            left: expect.any(Number),
            right: expect.any(Number),
            top: expect.any(Number),
        })
    })

    test('no selection', () => {
        selection.removeAllRanges()
        expect(editorAdapter.caretPosition).toStrictEqual({
            bottom: 0,
            left: 0,
            right: 0,
            top: 0,
        })
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
    editor.dispatchEvent(event)
    expect(onKeyDown).toHaveBeenCalledWith(editorAdapter, event)

    editorAdapter.destroy()
    onKeyDown.mockClear()
    editor.dispatchEvent(event)
    expect(onKeyDown).not.toHaveBeenCalled()
})

test('keyUp', () => {
    const onKeyUp = jest.fn()
    editorAdapter.on('keyUp', onKeyUp)
    const event = new KeyboardEvent('keyup')
    editor.dispatchEvent(event)
    expect(onKeyUp).toHaveBeenCalledWith(editorAdapter, event)

    editorAdapter.destroy()
    onKeyUp.mockClear()
    editor.dispatchEvent(event)
    expect(onKeyUp).not.toHaveBeenCalled()
})

test('input', () => {
    const onInput = jest.fn()
    editorAdapter.on('input', onInput)
    const event = new Event('input')
    editor.dispatchEvent(event)
    expect(onInput).toHaveBeenCalledWith(editorAdapter)

    editorAdapter.destroy()
    onInput.mockClear()
    editor.dispatchEvent(event)
    expect(onInput).not.toHaveBeenCalled()
})

test('scroll', () => {
    const onScroll = jest.fn()
    editorAdapter.on('scroll', onScroll)
    const event = new Event('scroll')
    editor.dispatchEvent(event)
    expect(onScroll).toHaveBeenCalledWith(editorAdapter)

    editorAdapter.destroy()
    onScroll.mockClear()
    editor.dispatchEvent(event)
    expect(onScroll).not.toHaveBeenCalled()
})

test('resize', () => {
    const onResize = jest.fn()
    editorAdapter.on('resize', onResize)
    const event = new Event('resize')
    editor.dispatchEvent(event)
    expect(onResize).toHaveBeenCalledWith(editorAdapter)

    editorAdapter.destroy()
    onResize.mockClear()
    editor.dispatchEvent(event)
    expect(onResize).not.toHaveBeenCalled()
})

describe('selectionChange', () => {
    test('right after input', async () => {
        const onSelectionChange = jest.fn()
        editorAdapter.on('selectionChange', onSelectionChange)
        editor.dispatchEvent(new Event('input'))
        editor.dispatchEvent(new Event('input'))
        const event = new Event('selectionchange')
        document.dispatchEvent(event)
        await new Promise((resolve) => setTimeout(resolve))
        expect(onSelectionChange).not.toHaveBeenCalled()

        document.dispatchEvent(event)
        expect(onSelectionChange).toHaveBeenCalledWith(editorAdapter)
    })

    test('not right after input', () => {
        const onSelectionChange = jest.fn()
        editorAdapter.on('selectionChange', onSelectionChange)
        const event = new Event('selectionchange')
        document.dispatchEvent(event)
        expect(onSelectionChange).toHaveBeenCalledWith(editorAdapter)

        editorAdapter.destroy()
        onSelectionChange.mockClear()
        document.dispatchEvent(event)
        expect(onSelectionChange).not.toHaveBeenCalled()
    })
})
