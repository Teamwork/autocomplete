import { TypedEventEmitter } from '@syncot/events'
import {
    EditorAdapter,
    EditorAdapterEvents,
    Position,
} from '@teamwork/autocomplete-core'
import { getCaretPosition } from './caretPosition'

/**
 * The editor's type.
 */
export type Editor = HTMLElement &
    Pick<
        HTMLTextAreaElement & HTMLInputElement,
        'value' | 'selectionStart' | 'selectionEnd'
    >

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
        // Listen for the `wheel` event to,
        // as Chrome and Safari do not fire `scroll` on input fields,
        // see  https://bugs.chromium.org/p/chromium/issues/detail?id=1007153.
        this.editor.addEventListener('wheel', this.onScroll)
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
        this.editor.removeEventListener('wheel', this.onScroll)
        this.editor.removeEventListener('resize', this.onResize)
        document.removeEventListener('selectionchange', this.onSelectionChange)
    }

    public focus(): void {
        // Call blur first to ensure that the caret will be visible after focus.
        // It is important when auto-completing in small input fields,
        // as the inserted text could easily overflow the element.
        this.editor.blur()

        this.editor.focus()
    }

    public getCaretPosition(offset: number = 0): Position {
        const index = this.editor.selectionStart + offset
        const position = getCaretPosition(this.editor, index)
        return {
            bottom: position.bottom,
            left: position.left,
            right: position.left,
            top: position.top,
        }
    }

    public get textBeforeCaret(): string {
        const content = this.editor.value
        const offset = this.editor.selectionStart
        return content.substring(0, offset)
    }
    public set textBeforeCaret(text: string) {
        const content = this.editor.value
        const offset = this.editor.selectionStart
        const textBeforeCaret = text
        const textAfterCaret = content.substring(offset)
        const caretOffset = textBeforeCaret.length
        this.editor.value = textBeforeCaret + textAfterCaret
        this.editor.selectionStart = caretOffset
        this.editor.selectionEnd = caretOffset
    }

    public get textAfterCaret(): string {
        const content = this.editor.value
        const offset = this.editor.selectionStart
        return content.substring(offset)
    }
    public set textAfterCaret(text: string) {
        const content = this.editor.value
        const offset = this.editor.selectionStart
        const textBeforeCaret = content.substring(0, offset)
        const textAfterCaret = text
        const caretOffset = textBeforeCaret.length
        this.editor.value = textBeforeCaret + textAfterCaret
        this.editor.selectionStart = caretOffset
        this.editor.selectionEnd = caretOffset
    }

    public get caretPosition(): Position {
        return this.getCaretPosition()
    }

    public get editorPosition(): Position {
        const position = this.editor.getBoundingClientRect()
        return {
            bottom: position.bottom,
            left: position.left,
            right: position.right,
            top: position.top,
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
