import { EmitterInterface, TypedEventEmitter } from '@syncot/events'
import { EditorAdapter, Position } from './adapter'

/**
 * An immutable autocomplete item.
 */
export interface Item {
    /**
     * The item's ID.
     * Used by default by some UI frameworks to identify nodes when diffing virtual DOM,
     * for example the `key` specifal attribute in Vue.
     */
    readonly id: string | number
    /**
     * The item's text.
     * Used by default to populate the content of the item's DOM element
     * and for pattern replacement.
     */
    readonly text: string
    /**
     * The item's title.
     * Used by default to populate the `title` attribute on the item's DOM element.
     */
    readonly title?: string
}

/**
 * An immutable list of `Item`s.
 */
export type Items = Readonly<Item[]>

/**
 * @param textBeforeCaret The text before the caret in an editor.
 * @param textAfterCaret The text after the caret in an editor.
 * @returns The number of matched characters
 *
 * - at the end of `textBeforeCaret` as the first array element.
 * - at the beginning of `textAfterCaret` as the second array element.
 *
 * Negative numbers indicate a failed match.
 */
export type Match = (
    textBeforeCaret: string,
    textAfterCaret: string,
) => Readonly<[number, number]>

/**
 * Loads autocomplete items for the given text.
 * @param matchedText The text matched in an editor.
 * @returns The autocomplete items.
 */
export type Load = (matchedText: string) => Items | Promise<Items>

/**
 * Accepts the specified autocomplete item.
 * @param item The item to accept.
 * @returns If `undefined` is returned, `Autocomplete` will do nothing.
 *
 * If a string is returned, `Autocomplete` will:
 *
 * - use it as a replacement for the currently matched text
 * - clear autocomplete state
 * - focus the editor
 */
export type Accept = (item: Item) => string | undefined

/**
 * The events emitted by `Autocomplete`.
 */
export interface AutocompleteEvents {
    /**
     * Emitted when the `active` property is updated.
     */
    active: void
    /**
     * Emitted when the `items` property is updated.
     */
    items: void
    /**
     * Emitted when the `selectedIndex` property is updated.
     */
    selectedIndex: void
    /**
     * Emitted when the `matchedText` property is updated.
     */
    matchedText: void
    /**
     * Emitted when the `caretPosition` property is updated.
     */
    caretPosition: void
    /**
     * Emitted when the `editorPosition` property is updated.
     */
    editorPosition: void
    /**
     * Emitted when the `error` property is updated.
     */
    error: void
    /**
     * Emitted when the `loading` property is updated.
     */
    loading: void
}

/**
 * Provides autocomplete for a single editor.
 */
export interface Autocomplete
    extends EmitterInterface<TypedEventEmitter<AutocompleteEvents>> {
    /**
     * The adapter of the editor for which autocomplete is provided by this interface.
     */
    readonly editorAdapter: EditorAdapter
    /**
     * Indicates if Autocomplete has found an autocomplete pattern match in the `editorAdapter`.
     */
    readonly active: boolean
    /**
     * The autocomplete items for the matched text.
     */
    readonly items: Items
    /**
     * The index of the selected item in `items`.
     */
    selectedIndex: number
    /**
     * The matched text.
     */
    readonly matchedText: string
    /**
     * The screen coordinates of the caret.
     */
    readonly caretPosition: Position
    /**
     * The screen coordinates of the editor's visible area.
     */
    readonly editorPosition: Position
    /**
     * The error produced by `load`, if any.
     */
    readonly error: Error | undefined
    /**
     * Indicates if autocomplete items are currently being loaded.
     */
    readonly loading: boolean
    /**
     * Trigger a search for an autocomplete pattern.
     * This function is automatically debounced using `requestAnimationFrame`.
     */
    match(): void
    /**
     * Clears the autocomplete state.
     * This function is automatically debounced using `requestAnimationFrame`.
     */
    clear(): void
    /**
     * Update the `caretPosition` and `editorPosition` properties, if autocomplete is active.
     * This function is automatically debounced using `requestAnimationFrame`.
     */
    updatePosition(): void
    /**
     * Accepts the currently selected autocomplete item, if it exists.
     */
    accept(): void
    /**
     * Replaces the currently matched text with the specified text.
     * @param text The replacement text.
     */
    replace(text: string): void
    /**
     * Destroys this object and removes its event listeners.
     * It does NOT destroy the `editorAdapter` though, which should be destroyed separately when appropriate.
     */
    destroy(): void
}

/**
 * The options expected by `createAutocomplete`.
 */
export interface CreateAutocompleteOptions {
    /**
     * The adapter of the editor for which autocomplete should be provided.
     */
    editorAdapter: EditorAdapter
    /**
     * Matches autocomplete patterns.
     * Defaults to return no match.
     */
    match?: Match
    /**
     * Loads autocomplete items.
     * Defaults to return an empty array.
     */
    load?: Load
    /**
     * Accepts autocomplete items.
     * Defaults to return `item.text`.
     */
    accept?: Accept
    /**
     * Determines if `Autocomplete#clear` should be called automatically on selection change.
     * Defaults to `true`.
     */
    clearOnSelectionChange?: boolean
}

const defaultMatchedText = ''
const defaultItems: Items = Object.freeze([])
const defaultSelectedIndex = -1
const defaultPosition: Position = Object.freeze({
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
})
const noMatch = Object.freeze([-1, -1]) as ReturnType<Match>
const defaultMatch = () => noMatch
const defaultLoad = () => defaultItems
const defaultAccept = (item: Item) => item.text

/**
 * Creates an Autocomplete instace with the specified options.
 */
export function createAutocomplete({
    editorAdapter,
    match = defaultMatch,
    load = defaultLoad,
    accept = defaultAccept,
    clearOnSelectionChange = true,
}: CreateAutocompleteOptions): Autocomplete {
    return new AutocompleteClass(
        editorAdapter,
        match,
        load,
        accept,
        clearOnSelectionChange,
    )
}

class AutocompleteClass extends TypedEventEmitter<AutocompleteEvents>
    implements Autocomplete {
    public get items(): Items {
        return this._items
    }
    public set items(items: Items) {
        if (this._items !== items) {
            this._items = items
            this.selectedIndex = 0
            this.emitLater('items')
        }
    }
    private _items: Items = defaultItems

    public get selectedIndex(): number {
        return this._selectedIndex
    }
    public set selectedIndex(selectedIndex: number) {
        /* tslint:disable-next-line:no-bitwise */
        const number = selectedIndex | 0
        const divisor = this.items.length
        const index =
            divisor > 0
                ? ((number % divisor) + divisor) % divisor
                : defaultSelectedIndex
        if (this._selectedIndex !== index) {
            this._selectedIndex = index
            this.emitLater('selectedIndex')
        }
    }
    private _selectedIndex: number = defaultSelectedIndex

    public get matchedText(): string {
        return this._matchedText
    }
    public set matchedText(matchedText: string) {
        if (this._matchedText !== matchedText) {
            this._matchedText = matchedText
            this.emitLater('matchedText')
        }
    }
    private _matchedText: string = defaultMatchedText

    public get caretPosition(): Position {
        return this._caretPosition
    }
    public set caretPosition(caretPosition: Position) {
        if (this._caretPosition !== caretPosition) {
            this._caretPosition = caretPosition
            this.emitLater('caretPosition')
        }
    }
    private _caretPosition: Position = defaultPosition

    public get editorPosition(): Position {
        return this._editorPosition
    }
    public set editorPosition(editorPosition: Position) {
        if (this._editorPosition !== editorPosition) {
            this._editorPosition = editorPosition
            this.emitLater('editorPosition')
        }
    }
    private _editorPosition: Position = defaultPosition

    public get error(): Error | undefined {
        return this._error
    }
    public set error(error: Error | undefined) {
        if (this._error !== error) {
            this._error = error
            this.emitLater('error')
        }
    }
    private _error: Error | undefined = undefined

    public get active(): boolean {
        return this._active
    }
    public set active(active: boolean) {
        if (this._active !== active) {
            this._active = active
            this.emitLater('active')
        }
    }
    private _active: boolean = false

    public get loading(): boolean {
        return !!this.promise
    }
    private get promise(): Promise<Items> | undefined {
        return this._promise
    }
    private set promise(promise: Promise<Items> | undefined) {
        const oldLoading = this.loading
        this._promise = promise
        const newLoading = this.loading
        if (oldLoading !== newLoading) {
            this.emitLater('loading')
        }
    }
    private _promise: Promise<Items> | undefined = undefined

    private pending:
        | 'matchNow'
        | 'clearNow'
        | 'updatePositionNow'
        | undefined = undefined

    public constructor(
        public readonly editorAdapter: EditorAdapter,
        private readonly _match: Match,
        private readonly _load: Load,
        private readonly _accept: Accept,
        private readonly clearOnSelectionChange: boolean,
    ) {
        super()
        document.addEventListener('scroll', this.onScroll)
        window.addEventListener('resize', this.onResize)
        this.editorAdapter.on('input', this.onInput)
        this.editorAdapter.on('keyDown', this.onKeyDown)
        this.editorAdapter.on('scroll', this.onScroll)
        this.editorAdapter.on('resize', this.onResize)
        this.editorAdapter.on('selectionChange', this.onSelectionChange)
    }

    public destroy() {
        document.removeEventListener('scroll', this.onScroll)
        window.removeEventListener('resize', this.onResize)
        this.editorAdapter.off('input', this.onInput)
        this.editorAdapter.off('keyDown', this.onKeyDown)
        this.editorAdapter.off('scroll', this.onScroll)
        this.editorAdapter.off('resize', this.onResize)
        this.editorAdapter.off('selectionChange', this.onSelectionChange)
        this.clear()
    }

    public match(): void {
        if (!this.pending) {
            requestAnimationFrame(this.onAnimationFrame)
        }
        this.pending = 'matchNow'
    }

    public updatePosition(): void {
        if (!this.pending) {
            requestAnimationFrame(this.onAnimationFrame)
            this.pending = 'updatePositionNow'
        }
    }

    public clear(): void {
        if (!this.pending) {
            requestAnimationFrame(this.onAnimationFrame)
        }
        this.pending = 'clearNow'
    }

    public accept(): void {
        const item = this.items[this.selectedIndex]
        if (item) {
            const text = this._accept(item)
            if (typeof text === 'string') {
                this.editorAdapter.focus()
                this.replace(text)
                this.clear()
                this.editorAdapter.focus()
            }
        }
    }

    public replace(text: string): void {
        const textBefore = this.editorAdapter.textBeforeCaret
        const textAfter = this.editorAdapter.textAfterCaret
        const match = this._match(textBefore, textAfter)
        const lengthBefore = match[0]
        const lengthAfter = match[1]

        if (lengthBefore < 0 || lengthAfter < 0) {
            return
        }

        this.editorAdapter.textBeforeCaret =
            textBefore.substring(0, textBefore.length - lengthBefore) + text
        this.editorAdapter.textAfterCaret = textAfter.substring(lengthAfter)
    }

    private onAnimationFrame = (): void => {
        const action = this.pending!
        this.pending = undefined
        this[action]()
    }

    private async matchNow(): Promise<void> {
        const textBefore = this.editorAdapter.textBeforeCaret
        const textAfter = this.editorAdapter.textAfterCaret
        const match = this._match(textBefore, textAfter)
        const lengthBefore = match[0]
        const lengthAfter = match[1]

        if (lengthBefore < 0 || lengthAfter < 0) {
            this.clearNow()
            return
        }

        const matchedText =
            textBefore.substring(textBefore.length - lengthBefore) +
            textAfter.substring(0, lengthAfter)
        const pomise = this.loadItems(matchedText)

        this.active = true
        this.matchedText = matchedText
        this.caretPosition = this.editorAdapter.caretPosition
        this.editorPosition = this.editorAdapter.editorPosition
        this.promise = pomise

        try {
            const items = await pomise
            if (this.promise === pomise) {
                this.promise = undefined
                this.items = items
                this.error = undefined
            }
        } catch (error) {
            if (this.promise === pomise) {
                this.promise = undefined
                this.items = defaultItems
                this.error = error
            }
        }
    }

    private clearNow(): void {
        this.active = false
        this.matchedText = defaultMatchedText
        this.caretPosition = defaultPosition
        this.editorPosition = defaultPosition
        this.promise = undefined
        this.items = defaultItems
        this.error = undefined
    }

    private updatePositionNow(): void {
        if (this.active) {
            this.caretPosition = this.editorAdapter.caretPosition
            this.editorPosition = this.editorAdapter.editorPosition
        }
    }

    private async loadItems(matchedText: string): Promise<Items> {
        const items = await this._load(matchedText)
        return Array.isArray(items) ? items : defaultItems
    }

    private onScroll = (): void => {
        this.updatePosition()
    }

    private onResize = (): void => {
        this.updatePosition()
    }

    private onSelectionChange = (): void => {
        if (this.active) {
            if (this.clearOnSelectionChange) {
                if (this.pending !== 'matchNow') {
                    this.clear()
                }
            } else {
                if (this.pending !== 'clearNow') {
                    this.match()
                }
            }
        }
    }

    private onInput = (): void => {
        this.match()
    }

    private onKeyDown = (
        _editor: EditorAdapter,
        event: KeyboardEvent,
    ): void => {
        switch (event.key) {
            case 'Enter':
                if (
                    this.active &&
                    this.items.length > 0 &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey &&
                    !event.metaKey
                ) {
                    event.preventDefault()
                    this.accept()
                }
                break
            case 'Up': // IE11
            case 'ArrowUp':
                if (
                    this.active &&
                    this.items.length > 0 &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey &&
                    !event.metaKey
                ) {
                    event.preventDefault()
                    this.selectedIndex--
                }
                break
            case 'Down': // IE11
            case 'ArrowDown':
                if (
                    this.active &&
                    this.items.length > 0 &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey &&
                    !event.metaKey
                ) {
                    event.preventDefault()
                    this.selectedIndex++
                }
                break
            case 'Esc': // IE11
            case 'Escape':
                if (
                    this.active &&
                    !event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey &&
                    !event.metaKey
                ) {
                    event.preventDefault()
                    this.clear()
                }
                break
            case 'Spacebar': // IE11
            case ' ':
                if (
                    event.ctrlKey &&
                    !event.shiftKey &&
                    !event.altKey &&
                    !event.metaKey
                ) {
                    event.preventDefault()
                    this.match()
                }
                break
        }
    }

    private emitLater(eventName: keyof AutocompleteEvents): void {
        Promise.resolve().then(() => {
            // Ensure that there are some listeners before emitting
            // to avoid the defaul EventEmitter behaviour of throwing an error
            // when an "error" event is emitted and there are no listeners.
            if (this.listenerCount(eventName) > 0) {
                this.emit(eventName)
            }
        })
    }
}
