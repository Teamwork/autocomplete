import { Autocomplete } from './autocomplete'

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
     * Loads items for the given Autocomplete instance and matched text.
     * @param autocomplete An Autocomplete instance.
     * @param matchedText Some text returned by `match`.
     * @returns A list of items.
     */
    load(
        autocomplete: Autocomplete,
        matchedText: string,
    ): Item[] | Promise<Item[]>

    /**
     * Accepts the specified item in the specified Autocomplete instance.
     * @param autocomplete An Autocomplete instance.
     * @param item An item returned by `load`.
     */
    accept(autocomplete: Autocomplete, item: Item): void

    /**
     * Matches its associated autocomplete pattern in the specified Autocomplete instance.
     * @param autocomplete An Autocomplete instance.
     * @returns The matched text, or `undefined`, if no match was found.
     */
    match(autocomplete: Autocomplete): string | undefined

    /**
     * Finds a pattern match for the Autocomplete instance and replaces it with the specified text.
     * Does nothing, if the pattern does not match.
     * @param autocomplete An Autocomplete instance.
     * @param text The replacement text.
     */
    replace(autocomplete: Autocomplete, text: string): void
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
     * Overrides `PatternHandler#load`,
     * which returns an empty array by default.
     */
    readonly load?: (
        this: PatternHandler,
        autocomplete: Autocomplete,
        matchedText: string,
    ) => Item[] | Promise<Item[]>
    /**
     * Overrides `PatternHandler#accept`,
     * which replaces the matched text with `item.text` by default.
     */
    readonly accept?: (
        this: PatternHandler,
        autocomplete: Autocomplete,
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
        accept,
        load,
    }: CreatePatternHandlerOptions = {}) {
        this.patternBeforeCaret = patternBeforeCaret
        this.patternAfterCaret = patternAfterCaret
        if (accept) {
            this.accept = accept
        }
        if (load) {
            this.load = load
        }
    }

    public match({ editorAdapter }: Autocomplete): string | undefined {
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

    public replace({ editorAdapter }: Autocomplete, text: string): void {
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

    public load(
        _autocomplete: Autocomplete,
        _matchedText: string,
    ): Item[] | Promise<Item[]> {
        return []
    }

    public accept(autocomplete: Autocomplete, item: Item): void {
        this.replace(autocomplete, item.text)
        autocomplete.clear()
    }
}
