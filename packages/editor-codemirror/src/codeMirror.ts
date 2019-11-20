import { TypedEventEmitter } from '@syncot/util'
import {
    EditorAdapter,
    EditorAdapterEvents,
    Position,
} from '@teamwork/autocomplete-core'
import CodeMirror from 'codemirror'

/**
 * Creates a new editor adapter for CodeMirror.
 */
export function createEditorAdapter(editor: CodeMirror.Editor): EditorAdapter {
    return new CodeMirrorEditorAdapter(editor)
}

class CodeMirrorEditorAdapter extends TypedEventEmitter<EditorAdapterEvents>
    implements EditorAdapter {
    public constructor(public readonly editor: CodeMirror.Editor) {
        super()
        this.editor.on('keyup', this.onKeyUp)
        this.editor.on('keydown', this.onKeyDown)
        this.editor.on('inputRead', this.onInput)
        this.editor.on('scroll', this.onScroll)
        this.editor.on('refresh', this.onResize)
        this.editor.on('cursorActivity', this.onSelectionChange)
        this.editor.on('keyHandled', this.onKeyHandled)
        this.editor.on('focus', this.onFocus)
        this.editor.on('blur', this.onBlur)
    }

    public destroy(): void {
        this.editor.off('keyup', this.onKeyUp)
        this.editor.off('keydown', this.onKeyDown)
        this.editor.off('inputRead', this.onInput)
        this.editor.off('scroll', this.onScroll)
        this.editor.off('refresh', this.onResize)
        this.editor.off('cursorActivity', this.onSelectionChange)
        this.editor.off('keyHandled', this.onKeyHandled)
        this.editor.off('focus', this.onFocus)
        this.editor.off('blur', this.onBlur)
    }

    public get textBeforeCaret(): string {
        const doc = this.editor.getDoc()
        const end = doc.getCursor('head')
        const start = { line: end.line, ch: 0 }
        return doc.getRange(start, end)
    }
    public set textBeforeCaret(text: string) {
        const doc = this.editor.getDoc()
        const end = doc.getCursor('head')
        const start = { line: end.line, ch: 0 }
        const newCursor = { line: end.line, ch: text.length }
        doc.replaceRange(text, start, end)
        doc.setCursor(newCursor)
    }

    public get textAfterCaret(): string {
        const doc = this.editor.getDoc()
        const start = doc.getCursor('head')
        const end = { line: start.line, ch: Infinity }
        return doc.getRange(start, end)
    }
    public set textAfterCaret(text: string) {
        const doc = this.editor.getDoc()
        const start = doc.getCursor('head')
        const end = { line: start.line, ch: Infinity }
        const newCursor = start
        doc.replaceRange(text, start, end)
        doc.setCursor(newCursor)
    }

    public get caretPosition(): Position {
        const doc = this.editor.getDoc()
        const caret = doc.getCursor('head')
        const position = this.editor.cursorCoords(caret, 'window')
        return {
            bottom: Math.floor(position.bottom),
            left: Math.floor(position.left),
            right: Math.floor(position.left),
            top: Math.floor(position.top),
        }
    }

    public get editorPosition(): Position {
        const position = this.editor.getWrapperElement().getBoundingClientRect()
        return {
            bottom: Math.floor(position.bottom),
            left: Math.floor(position.left),
            right: Math.floor(position.right),
            top: Math.floor(position.top),
        }
    }

    private onKeyUp = (
        _editor: CodeMirror.Editor,
        event: KeyboardEvent,
    ): void => {
        this.emit('keyUp', this, event)
    }
    private onKeyDown = (
        _editor: CodeMirror.Editor,
        event: KeyboardEvent,
    ): void => {
        this.emit('keyDown', this, event)
    }
    private onInput = (): void => {
        this.emit('input', this)
    }
    private onScroll = (): void => {
        this.emit('scroll', this)
    }
    private onResize = (): void => {
        this.emit('resize', this)
    }
    private onSelectionChange = (): void => {
        this.emit('selectionChange', this)
    }
    private onKeyHandled = (_editor: CodeMirror.Editor, name: string): void => {
        // This is necessary because CodeMirror does not fire `inputRead` on Backspace and Delete.
        // See https://github.com/codemirror/CodeMirror/issues/3162#issuecomment-87582425
        if (name === 'Backspace' || name === 'Delete') {
            this.emit('input', this)
        }
    }
    private onFocus = (): void => {
        this.emit('focus', this)
    }
    private onBlur = (): void => {
        this.emit('blur', this)
    }
}
