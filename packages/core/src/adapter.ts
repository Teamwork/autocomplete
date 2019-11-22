import { EmitterInterface, TypedEventEmitter } from '@syncot/util'

/**
 * The type representing a position in a coordinate system.
 */
export interface Position {
    readonly bottom: number
    readonly left: number
    readonly right: number
    readonly top: number
}

/**
 * Events emitted by `EditorAdapter`.
 */
export interface EditorAdapterEvents {
    keyDown: (editorAdapter: EditorAdapter, event: KeyboardEvent) => void
    keyUp: (editorAdapter: EditorAdapter, event: KeyboardEvent) => void
    input: (editorAdapter: EditorAdapter) => void
    scroll: (editorAdapter: EditorAdapter) => void
    resize: (editorAdapter: EditorAdapter) => void
    selectionChange: (editorAdapter: EditorAdapter) => void
}

/**
 * The common interface for all autocomplete editor adapters.
 */
export interface EditorAdapter
    extends EmitterInterface<TypedEventEmitter<EditorAdapterEvents>> {
    /**
     * The reference to the underlying editor.
     */
    readonly editor: any
    /**
     * The text which appears before the caret.
     */
    textBeforeCaret: string
    /**
     * The text which appears after the caret.
     */
    textAfterCaret: string
    /**
     * The screen coordinates of the caret.
     */
    readonly caretPosition: Position
    /**
     * The screen coordinates of the editor's visible area.
     */
    readonly editorPosition: Position
    /**
     * Detaches this adapter from its editor.
     */
    destroy(): void
}
