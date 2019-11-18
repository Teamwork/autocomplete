import { EmitterInterface, TypedEventEmitter } from '@syncot/util'
import { EditorAdapter, Position } from './adapter'
import { Item, PatternHandler } from './pattern'

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
     * Emitted when the `selectedItem` property is updated.
     */
    selectedItem: void
    /**
     * Emitted when the `matchedText` property is updated.
     */
    matchedText: void
    /**
     * Emitted when the `caretPosition` property is updated.
     */
    caretPosition: void
    /**
     * Emitted when the `error` property is updated.
     */
    error: void
    /**
     * Emitted when the `fetchingItems` property is updated.
     */
    fetchingItems: void
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
    readonly items: Readonly<Item[]>
    /**
     * The index of the selected item in `items`.
     */
    selectedItem: number
    /**
     * The matched text.
     */
    readonly matchedText: string
    /**
     * The caret position on the screen.
     */
    readonly caretPosition: Position
    /**
     * The error produced by `fetchItems`, if any.
     */
    readonly error: Error | undefined
    /**
     * Indicates if autocomplete items are currently being fetched.
     */
    readonly fetchingItems: boolean
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
     * Update the `caretPosition` property, if it exists.
     * This function is automatically debounced using `requestAnimationFrame`.
     */
    updateCaretPosition(): void
    /**
     * Accepts the currently selected autocomplete item, if it exists,
     * and then clears the autocomplete state, if it exists.
     */
    accept(): void
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
     * A list of pattern handlers. At least one is necessary for the system to work.
     */
    patternHandlers: PatternHandler[]
}

/**
 * Creates an Autocomplete instace with the specified options.
 */
export function createAutocomplete({
    editorAdapter,
    patternHandlers,
}: CreateAutocompleteOptions): Autocomplete {
    return new AutocompleteClass(editorAdapter, patternHandlers)
}

/**
 * The value of `matchedText`, when autocomplete is not active.
 */
export const defaultMatchedText = ''
/**
 * The value of `items`, when autocomplete is not active.
 */
export const defaultItems: Readonly<Item[]> = Object.freeze([])
/**
 * The value of `selectedItem`, when autocomplete is not active.
 */
export const defaultSelectedItem = -1
/**
 * The value of `caretPosition`, when autocomplete is not active.
 */
export const defaultCaretPosition: Position = Object.freeze({
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
})

class AutocompleteClass extends TypedEventEmitter<AutocompleteEvents>
    implements Autocomplete {
    public get items(): Readonly<Item[]> {
        return this._items
    }
    public set items(items: Readonly<Item[]>) {
        if (this._items !== items) {
            this._items = items
            this.selectedItem = 0
            this.emitLater('items')
        }
    }
    private _items: Readonly<Item[]> = defaultItems

    public get selectedItem(): number {
        return this._selectedItem
    }
    public set selectedItem(selectedItem: number) {
        /* tslint:disable-next-line:no-bitwise */
        const int = selectedItem | 0
        const max = this.items.length - 1
        const min = 0
        const index = Math.min(max, Math.max(min, int))
        if (this._selectedItem !== index) {
            this._selectedItem = index
            this.emitLater('selectedItem')
        }
    }
    private _selectedItem: number = defaultSelectedItem

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
    private _caretPosition: Position = defaultCaretPosition

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
        return !!this.activePatternHandler
    }
    private get activePatternHandler(): PatternHandler | undefined {
        return this._activePatternHandler
    }
    private set activePatternHandler(
        activePatternHandler: PatternHandler | undefined,
    ) {
        const oldActive = this.active
        this._activePatternHandler = activePatternHandler
        const newActive = this.active
        if (oldActive !== newActive) {
            this.emitLater('active')
        }
    }
    private _activePatternHandler: PatternHandler | undefined = undefined

    public get fetchingItems(): boolean {
        return !!this.promise
    }
    private get promise(): Promise<Item[]> | undefined {
        return this._promise
    }
    private set promise(promise: Promise<Item[]> | undefined) {
        const oldFetchingItems = this.fetchingItems
        this._promise = promise
        const newFetchingItems = this.fetchingItems
        if (oldFetchingItems !== newFetchingItems) {
            this.emitLater('fetchingItems')
        }
    }
    private _promise: Promise<Item[]> | undefined = undefined

    private pending:
        | 'matchNow'
        | 'clearNow'
        | 'updateCaretPositionNow'
        | undefined = undefined

    public constructor(
        public readonly editorAdapter: EditorAdapter,
        private readonly patternHandlers: Array<Required<PatternHandler>>,
    ) {
        super()
        document.addEventListener('scroll', this.onScroll)
        window.addEventListener('resize', this.onResize)
        this.editorAdapter.on('input', this.onInput)
        this.editorAdapter.on('keyDown', this.onKeyDown)
        this.editorAdapter.on('scroll', this.onScroll)
        this.editorAdapter.on('resize', this.onResize)
        this.editorAdapter.on('selectionChange', this.onSelectionChange)
        this.editorAdapter.on('blur', this.onBlur)
    }

    public destroy() {
        document.removeEventListener('scroll', this.onScroll)
        window.removeEventListener('resize', this.onResize)
        this.editorAdapter.off('input', this.onInput)
        this.editorAdapter.off('keyDown', this.onKeyDown)
        this.editorAdapter.off('scroll', this.onScroll)
        this.editorAdapter.off('resize', this.onResize)
        this.editorAdapter.off('selectionChange', this.onSelectionChange)
        this.editorAdapter.off('blur', this.onBlur)
        this.clear()
    }

    public match(): void {
        if (!this.pending) {
            requestAnimationFrame(this.onAnimationFrame)
        }
        this.pending = 'matchNow'
    }

    public updateCaretPosition(): void {
        if (!this.pending) {
            requestAnimationFrame(this.onAnimationFrame)
            this.pending = 'updateCaretPositionNow'
        }
    }

    public clear(): void {
        if (!this.pending) {
            requestAnimationFrame(this.onAnimationFrame)
        }
        this.pending = 'clearNow'
    }

    public accept(): void {
        const patternHandler = this.activePatternHandler
        if (patternHandler) {
            const item = this.items[this.selectedItem]
            if (item) {
                patternHandler.acceptItem(this.editorAdapter, item)
            }
            this.clear()
        }
    }

    private onAnimationFrame = (): void => {
        const action = this.pending!
        this.pending = undefined
        this[action]()
    }

    private matchNow(): void {
        for (const patternHandler of this.patternHandlers) {
            const match = patternHandler.match(this.editorAdapter)

            if (match) {
                this.activePatternHandler = patternHandler
                this.matchedText = match
                this.caretPosition = this.editorAdapter.caretPosition
                try {
                    const itemsOrPomise = patternHandler.fetchItems(
                        this.editorAdapter,
                        match,
                    )
                    if (Array.isArray(itemsOrPomise)) {
                        this.promise = undefined
                        this.items = itemsOrPomise
                        this.error = undefined
                    } else {
                        this.promise = itemsOrPomise
                        itemsOrPomise.then(
                            items => {
                                if (this.promise === itemsOrPomise) {
                                    this.promise = undefined
                                    this.items = items
                                    this.error = undefined
                                }
                            },
                            error => {
                                if (this.promise === itemsOrPomise) {
                                    this.promise = undefined
                                    this.items = defaultItems
                                    this.error = error
                                }
                            },
                        )
                    }
                } catch (error) {
                    this.promise = undefined
                    this.items = defaultItems
                    this.error = error
                }
                return
            }
        }

        this.clearNow()
    }

    private clearNow(): void {
        this.activePatternHandler = undefined
        this.matchedText = defaultMatchedText
        this.caretPosition = defaultCaretPosition
        this.promise = undefined
        this.items = defaultItems
        this.error = undefined
    }

    private updateCaretPositionNow(): void {
        if (this.active) {
            this.caretPosition = this.editorAdapter.caretPosition
        }
    }

    private onBlur = (): void => {
        this.clear()
    }

    private onScroll = (): void => {
        this.updateCaretPosition()
    }

    private onResize = (): void => {
        this.updateCaretPosition()
    }

    private onSelectionChange = (): void => {
        if (this.pending !== 'matchNow') {
            this.clear()
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
                    this.selectedItem--
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
                    this.selectedItem++
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
