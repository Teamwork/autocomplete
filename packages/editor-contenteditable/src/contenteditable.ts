import { TypedEventEmitter } from '@syncot/events'
import {
    EditorAdapter,
    EditorAdapterEvents,
    Position,
} from '@teamwork/autocomplete-core'

/**
 * The editor's type.
 */
export type Editor = HTMLElement

/**
 * Creates a new editor adapter for an element with the contenteditable attribute.
 */
export function createEditorAdapter(editor: Editor): EditorAdapter {
    return new ContenteditableEditorAdapter(editor)
}

class ContenteditableEditorAdapter
    extends TypedEventEmitter<EditorAdapterEvents>
    implements EditorAdapter {
    private inputTimeout: number = 0

    public constructor(public readonly editor: Editor) {
        super()
        this.editor.addEventListener('keyup', this.onKeyUp)
        this.editor.addEventListener('keydown', this.onKeyDown)
        this.editor.addEventListener('input', this.onInput)
        this.editor.addEventListener('scroll', this.onScroll)
        this.editor.addEventListener('resize', this.onResize)
        document.addEventListener('selectionchange', this.onSelectionChange)
    }

    public destroy(): void {
        this.editor.removeEventListener('keyup', this.onKeyUp)
        this.editor.removeEventListener('keydown', this.onKeyDown)
        this.editor.removeEventListener('input', this.onInput)
        this.editor.removeEventListener('scroll', this.onScroll)
        this.editor.removeEventListener('resize', this.onResize)
        document.removeEventListener('selectionchange', this.onSelectionChange)
    }

    public focus(): void {
        this.editor.focus()
    }

    public get textBeforeCaret(): string {
        const { caret } = this
        return caret ? caret.node.data.substring(0, caret.offset) : ''
    }
    public set textBeforeCaret(text: string) {
        const { caret } = this
        if (!caret) {
            return
        }
        const selection = document.getSelection()!
        const { node, offset } = caret
        const textBeforeCaret = text
        const textAfterCaret = node.data.substring(offset)
        const caretOffset = textBeforeCaret.length
        node.data = textBeforeCaret + textAfterCaret
        selection.removeAllRanges()
        selection.collapse(node, caretOffset)
    }

    public get textAfterCaret(): string {
        const { caret } = this
        return caret ? caret.node.data.substring(caret.offset) : ''
    }
    public set textAfterCaret(text: string) {
        const { caret } = this
        if (!caret) {
            return
        }
        const selection = document.getSelection()!
        const { node, offset } = caret

        const textBeforeCaret = node.data.substring(0, offset)
        const textAfterCaret = text
        const caretOffset = textBeforeCaret.length
        node.data = textBeforeCaret + textAfterCaret
        selection.removeAllRanges()
        selection.collapse(node, caretOffset)
    }

    public get caretPosition(): Position {
        const { caret } = this
        if (!caret) {
            return {
                bottom: 0,
                left: 0,
                right: 0,
                top: 0,
            }
        }

        const range = document.createRange()
        range.setStart(caret.node, caret.offset)
        range.setEnd(caret.node, caret.offset)
        const position = range.getBoundingClientRect()
        return {
            bottom: position.bottom,
            left: position.left,
            right: position.left,
            top: position.top,
        }
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

    private get caret(): Caret | undefined {
        const {
            focusNode: node,
            focusOffset: offset,
        } = document.getSelection()!
        if (
            !node ||
            node.nodeType !== Node.TEXT_NODE ||
            !this.editor.contains(node)
        ) {
            return undefined
        }

        return { node: node as Text, offset }
    }
}

interface Caret {
    node: Text
    offset: number
}
