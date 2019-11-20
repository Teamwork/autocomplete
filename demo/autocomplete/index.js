import {
    createAutocomplete,
    createPatternHandler,
    createRegexPattern,
} from '@teamwork/autocomplete-core'
import './style.css'

export function initAutocomplete(editorAdapter) {
    const autocomplete = createAutocomplete({
        editorAdapter,
        patternHandlers: [
            createPatternHandler({
                patternBeforeCaret: createRegexPattern(
                    // See http://unicode.org/reports/tr18/#word
                    /(?:^|\p{White_Space})(@[\p{Alphabetic}\p{gc=Mark}\p{gc=Decimal_Number}\p{gc=Connector_Punctuation}\p{Join_Control}]*)$/u,
                    1,
                ),
                async fetchItems(_editorAdapter, match) {
                    const response = await fetch(
                        `https://en.wikipedia.org/w/api.php?origin=*&action=opensearch&namespace=*&limit=10&namespace=0&format=json&search=${encodeURIComponent(
                            match,
                        )}`,
                    )
                    const body = await response.json()
                    return body[1].map(text => ({
                        id: text,
                        text,
                    }))
                },
            }),
        ],
    })
    window.autocomplete = autocomplete
    return autocomplete
}
