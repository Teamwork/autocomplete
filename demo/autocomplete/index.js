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
                patternAfterCaret: createRegexPattern(
                    /^(?:$|\p{White_Space})/u,
                ),
                patternBeforeCaret: createRegexPattern(
                    // See http://unicode.org/reports/tr18/#word
                    /(?:^|\p{White_Space})(@[\p{Alphabetic}\p{gc=Mark}\p{gc=Decimal_Number}\p{gc=Connector_Punctuation}\p{Join_Control}]*)$/u,
                    1,
                ),
                async load(_autocomplete, match) {
                    match = match.substring(1)

                    if (/^slow_/.test(match)) {
                        match = match.substring(5)
                        await new Promise(resolve => setTimeout(resolve, 2000))
                    }

                    if (/^error_/.test(match)) {
                        throw new Error('Test error')
                    }

                    if (match === '') {
                        return []
                    }

                    const response = await fetch(
                        `https://en.wikipedia.org/w/api.php?origin=*&action=opensearch&namespace=*&limit=10&namespace=0&format=json&search=${encodeURIComponent(
                            match,
                        )}`,
                    )
                    const body = await response.json()
                    return body[1].map(text => ({
                        id: text,
                        text,
                        title: text,
                    }))
                },
            }),
        ],
    })
    window.autocomplete = autocomplete
    return autocomplete
}
