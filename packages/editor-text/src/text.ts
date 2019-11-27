import { TypedEventEmitter } from '@syncot/util'
import {
    EditorAdapter,
    EditorAdapterEvents,
    Position,
} from '@teamwork/autocomplete-core'
import { getCaretPosition } from './caretPosition'

/**
 * The editor's type.
 */
export type Editor = HTMLTextAreaElement | HTMLInputElement

/**
 * Creates a new editor adapter for textarea and input[text].
 */
export function createEditorAdapter(editor: Editor): EditorAdapter {
    return new TextareaEditorAdapter(editor)
}

class TextareaEditorAdapter extends TypedEventEmitter<EditorAdapterEvents>
    implements EditorAdapter {
    private inputTimeout: number = 0

    public constructor(public readonly editor: Editor) {
        super()
        this.editor.addEventListener('keyup', this.onKeyUp as EventListener)
        this.editor.addEventListener('keydown', this.onKeyDown as EventListener)
        this.editor.addEventListener('input', this.onInput)
        this.editor.addEventListener('scroll', this.onScroll)
        this.editor.addEventListener('resize', this.onResize)
        document.addEventListener('selectionchange', this.onSelectionChange)
    }

    public destroy(): void {
        this.editor.removeEventListener('keyup', this.onKeyUp as EventListener)
        this.editor.removeEventListener(
            'keydown',
            this.onKeyDown as EventListener,
        )
        this.editor.removeEventListener('input', this.onInput)
        this.editor.removeEventListener('scroll', this.onScroll)
        this.editor.removeEventListener('resize', this.onResize)
        document.removeEventListener('selectionchange', this.onSelectionChange)
    }

    public focus(): void {
        this.editor.focus()
    }

    public get textBeforeCaret(): string {
        const content = this.editor.value
        const offset = this.editor.selectionStart || 0
        return content.substring(0, offset)
    }
    public set textBeforeCaret(text: string) {
        const content = this.editor.value
        const offset = this.editor.selectionStart || 0
        const textBeforeCaret = text
        const textAfterCaret = content.substring(offset)
        const caretOffset = textBeforeCaret.length
        this.editor.value = textBeforeCaret + textAfterCaret
        this.editor.selectionStart = caretOffset
        this.editor.selectionEnd = caretOffset
    }

    public get textAfterCaret(): string {
        const content = this.editor.value
        const offset = this.editor.selectionStart || 0
        return content.substring(offset)
    }
    public set textAfterCaret(text: string) {
        const content = this.editor.value
        const offset = this.editor.selectionStart || 0
        const textBeforeCaret = content.substring(0, offset)
        const textAfterCaret = text
        const caretOffset = textBeforeCaret.length
        this.editor.value = textBeforeCaret + textAfterCaret
        this.editor.selectionStart = caretOffset
        this.editor.selectionEnd = caretOffset
    }

    public get caretPosition(): Position {
        const offset = this.editor.selectionStart || 0
        const position = getCaretPosition(this.editor, offset)
        return {
            bottom: Math.floor(position.bottom),
            left: Math.floor(position.left),
            right: Math.floor(position.left),
            top: Math.floor(position.top),
        }
    }

    public get editorPosition(): Position {
        const position = this.editor.getBoundingClientRect()
        return {
            bottom: Math.floor(position.bottom),
            left: Math.floor(position.left),
            right: Math.floor(position.right),
            top: Math.floor(position.top),
        }
    }

    private onKeyUp = (event: KeyboardEvent): void => {
        this.emit('keyUp', this, event)
    }
    private onKeyDown = (event: KeyboardEvent): void => {
        this.emit('keyDown', this, event)
    }
    private onInput = (): void => {
        this.setInputTimeout()
        this.emit('input', this)
    }
    private onScroll = (): void => {
        this.emit('scroll', this)
    }
    private onResize = (): void => {
        this.emit('resize', this)
    }
    private onSelectionChange = (): void => {
        // Unfortunately, the `selectionchange` event has some issues, at least in Chrome 78:
        // - It does not fire after a character is removed using Backspace,
        //   which is not a problem for autocomplete.
        // - It fires in the next animation frame relative to the preceeding `input` event,
        //   which is a problem for autocomplete, as it clears the state soon after it has
        //   been initialized. The workaround is to avoid emitting `selectionChange`, if
        //   it occurs too soon after `input`.
        if (!this.hasInputTimeout()) {
            this.emit('selectionChange', this)
        }
    }

    private setInputTimeout(): void {
        if (this.inputTimeout) {
            clearTimeout(this.inputTimeout)
        }
        this.inputTimeout = setTimeout(this.clearInputTimeout)
    }
    private clearInputTimeout = (): void => {
        this.inputTimeout = 0
    }
    private hasInputTimeout(): boolean {
        return !!this.inputTimeout
    }
}