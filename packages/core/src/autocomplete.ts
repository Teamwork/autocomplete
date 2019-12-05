import { EmitterInterface, TypedEventEmitter } from '@syncot/events'
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
    readonly items: Readonly<Item[]>
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

const defaultMatchedText = ''
const defaultItems: Readonly<Item[]> = Object.freeze([])
const defaultSelectedIndex = -1
const defaultPosition: Position = Object.freeze({
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
            this.selectedIndex = 0
            this.emitLater('items')
        }
    }
    private _items: Readonly<Item[]> = defaultItems

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

    public get loading(): boolean {
        return !!this.promise
    }
    private get promise(): Promise<Item[]> | undefined {
        return this._promise
    }
    private set promise(promise: Promise<Item[]> | undefined) {
        const oldLoading = this.loading
        this._promise = promise
        const newLoading = this.loading
        if (oldLoading !== newLoading) {
            this.emitLater('loading')
        }
    }
    private _promise: Promise<Item[]> | undefined = undefined

    private pending:
        | 'matchNow'
        | 'clearNow'
        | 'updatePositionNow'
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
        const patternHandler = this.activePatternHandler
        if (patternHandler) {
            const item = this.items[this.selectedIndex]
            if (item) {
                patternHandler.accept(this, item)
            }
        }
    }

    private onAnimationFrame = (): void => {
        const action = this.pending!
        this.pending = undefined
        this[action]()
    }

    private matchNow(): void {
        for (const patternHandler of this.patternHandlers) {
            const match = patternHandler.match(this)

            if (match) {
                this.activePatternHandler = patternHandler
                this.matchedText = match
                this.caretPosition = this.editorAdapter.caretPosition
                this.editorPosition = this.editorAdapter.editorPosition
                try {
                    const itemsOrPomise = patternHandler.load(this, match)
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

    private onScroll = (): void => {
        this.updatePosition()
    }

    private onResize = (): void => {
        this.updatePosition()
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
