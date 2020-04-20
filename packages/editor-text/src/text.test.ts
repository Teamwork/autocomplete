import { EditorAdapter } from '@teamwork/autocomplete-core'
import { createEditorAdapter, Editor } from '.'

let editor: Editor
let editorAdapter: EditorAdapter
const textBefore = '!initial text before!'
const textAfter = '?initial text after?'

describe.each(['textarea', 'input'])('%s', (elementName) => {
    beforeEach(() => {
        editor = document.createElement(elementName) as Editor
        document.body.appendChild(editor)
        editorAdapter = createEditorAdapter(editor)
        editor.value = textBefore + textAfter
        editor.selectionStart = textBefore.length
        editor.selectionEnd = textBefore.length + 2
    })

    afterEach(() => {
        document.body.removeChild(editor)
    })

    test('focus', () => {
        expect(document.activeElement).not.toBe(editor)
        editorAdapter.focus()
        expect(document.activeElement).toBe(editor)
    })

    test('textBeforeCaret', () => {
        expect(editorAdapter.textBeforeCaret).toBe(textBefore)
        expect(editorAdapter.textAfterCaret).toBe(textAfter)
        expect(editor.selectionStart).not.toBe(editor.selectionEnd)

        const newTextBefore = '*new text before*'
        editorAdapter.textBeforeCaret = newTextBefore
        expect(editorAdapter.textBeforeCaret).toBe(newTextBefore)
        expect(editorAdapter.textAfterCaret).toBe(textAfter)
        expect(editor.selectionStart).toBe(editor.selectionEnd)
    })

    test('textAfterCaret', () => {
        expect(editorAdapter.textBeforeCaret).toBe(textBefore)
        expect(editorAdapter.textAfterCaret).toBe(textAfter)
        expect(editor.selectionStart).not.toBe(editor.selectionEnd)

        const newTextAfter = '*new text after*'
        editorAdapter.textAfterCaret = newTextAfter
        expect(editorAdapter.textBeforeCaret).toBe(textBefore)
        expect(editorAdapter.textAfterCaret).toBe(newTextAfter)
        expect(editor.selectionStart).toBe(editor.selectionEnd)
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

    describe('scroll', () => {
        test('triggered by scroll', () => {
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

        // Necessary as a workaround for
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1007153.
        test('triggered by wheel', () => {
            const onScroll = jest.fn()
            editorAdapter.on('scroll', onScroll)
            const event = new Event('wheel')
            editor.dispatchEvent(event)
            expect(onScroll).toHaveBeenCalledWith(editorAdapter)

            editorAdapter.destroy()
            onScroll.mockClear()
            editor.dispatchEvent(event)
            expect(onScroll).not.toHaveBeenCalled()
        })
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
})
