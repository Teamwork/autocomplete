import { EditorAdapter } from './adapter'

/**
 * A pattern used by `Matcher` to match text within `EditorAdapter`.
 * Implementations of `Pattern` should match their specific pattern
 * starting from the beginning or the end of `text` and return the number
 * of matched characters, or a negative number to indicate that no match was found.
 */
export type Pattern = (text: string) => number

/**
 * Creates a new `Pattern` based on the specified `regex`.
 */
export const createRegexPattern = (
    regex: RegExp,
    group: number = 0,
): Pattern => (text: string): number => {
    const match = regex.exec(text)
    return match && typeof match[group] === 'string' ? match[group].length : -1
}

/**
 * An autocomplete item.
 */
export interface Item {
    /**
     * The item's ID.
     */
    id: string | number
    /**
     * The item's text for display.
     */
    text: string
}

/**
 * Handles a single autocomplete pattern by matching it in the editor
 * and providing autocomplete options.
 */
export interface PatternHandler {
    /**
     * Fetches autocomplete items for the given editor and matched text.
     * @param editorAdapter The editor for which to fetch the items.
     * @param matchedText The text matched in the editor.
     * @returns Autocomplete items.
     */
    fetchItems(
        editorAdapter: EditorAdapter,
        matchedText: string,
    ): Item[] | Promise<Item[]>
    /**
     * Accepts the specified autocomplete item in the specified editor adapter.
     * @param editorAdapter The editor in which to accept the item.
     * @param item An item returned by `fetchItems`.
     */
    acceptItem(editorAdapter: EditorAdapter, item: Item): void
    /**
     * Matches its associated autocomplete pattern in the specified editor adapter.
     * @param editorAdapter The editor in which to look for a pattern match.
     * @returns The matched text, or `undefined`, if no match was found.
     */
    match(editorAdapter: EditorAdapter): string | undefined
    /**
     * Finds a pattern match and replaces it with the specified text.
     * Does nothing, if the pattern does not match.
     * @param editorAdapter The editor in which to perform the replacement.
     * @param text The text with should replace the matched text.
     */
    replace(editorAdapter: EditorAdapter, text: string): void
}

/**
 * Configuration options for `createPatternHandler`.
 */
export interface CreatePatternHandlerOptions {
    /**
     * The pattern to match in the text which appears before the caret in the editor.
     * Returns the number of matched characters starting from the end of the string,
     * where a negative number indicates a failed match.
     * Defaults to a pattern which always fails.
     */
    readonly patternBeforeCaret?: Pattern
    /**
     * The pattern to match in the text which appears after the caret in the editor.
     * Returns the number of matched characters starting from the beginning of the string,
     * where a negative number indicates a failed match.
     * Defaults to a pattern which matches zero characters,
     * if the string is empty or starts with a whitespace character.
     */
    readonly patternAfterCaret?: Pattern
    /**
     * Overrides `PatternHandler#fetchItems`,
     * which returns an empty array by default.
     */
    readonly fetchItems?: (
        this: PatternHandler,
        editorAdapter: EditorAdapter,
        matchedText: string,
    ) => Item[] | Promise<Item[]>
    /**
     * Overrides `PatternHandler#acceptItem`,
     * which calls `this.replace(editorAdapter, item.text)` by default.
     */
    readonly acceptItem?: (
        this: PatternHandler,
        editorAdapter: EditorAdapter,
        item: Item,
    ) => void
}

const defaultPatternBeforeCaret: Pattern = (_text: string) => -1
const defaultPatternAfterCaret: Pattern = createRegexPattern(
    /^(?=$|\p{White_Space})/u,
)

/**
 * Creates a new `PatternHandler`.
 */
export function createPatternHandler(
    options?: CreatePatternHandlerOptions,
): PatternHandler {
    return new PatternHandlerClass(options)
}

class PatternHandlerClass implements PatternHandler {
    private readonly patternBeforeCaret: Pattern
    private readonly patternAfterCaret: Pattern

    public constructor({
        patternBeforeCaret = defaultPatternBeforeCaret,
        patternAfterCaret = defaultPatternAfterCaret,
        acceptItem,
        fetchItems,
    }: CreatePatternHandlerOptions = {}) {
        this.patternBeforeCaret = patternBeforeCaret
        this.patternAfterCaret = patternAfterCaret
        if (acceptItem) {
            this.acceptItem = acceptItem
        }
        if (fetchItems) {
            this.fetchItems = fetchItems
        }
    }

    public match(editorAdapter: EditorAdapter): string | undefined {
        const textBefore = editorAdapter.textBeforeCaret
        const lengthBefore = this.patternBeforeCaret(textBefore)
        if (lengthBefore < 0) {
            return
        }

        const textAfter = editorAdapter.textAfterCaret
        const lengthAfter = this.patternAfterCaret(textAfter)
        if (lengthAfter < 0) {
            return
        }

        return (
            textBefore.substring(textBefore.length - lengthBefore) +
            textAfter.substring(0, lengthAfter)
        )
    }

    public replace(editorAdapter: EditorAdapter, text: string): void {
        const textBefore = editorAdapter.textBeforeCaret
        const lengthBefore = this.patternBeforeCaret(textBefore)
        if (lengthBefore < 0) {
            return
        }

        const textAfter = editorAdapter.textAfterCaret
        const lengthAfter = this.patternAfterCaret(textAfter)
        if (lengthAfter < 0) {
            return
        }

        editorAdapter.textBeforeCaret =
            textBefore.substring(0, textBefore.length - lengthBefore) + text
        editorAdapter.textAfterCaret = textAfter.substring(lengthAfter)
    }

    public fetchItems(
        _editorAdapter: EditorAdapter,
        _matchedText: string,
    ): Item[] | Promise<Item[]> {
        return []
    }

    public acceptItem(editorAdapter: EditorAdapter, item: Item): void {
        this.replace(editorAdapter, item.text)
    }
}
