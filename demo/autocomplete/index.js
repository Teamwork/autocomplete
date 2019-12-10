import { createAutocomplete } from '@teamwork/autocomplete-core'
import './style.css'

export function initAutocomplete(editorAdapter) {
    const autocomplete = createAutocomplete({
        editorAdapter,
        match(textBeforeCaret, textAfterCaret) {
            // See http://unicode.org/reports/tr18/#word
            const matchBeforeCaret = /(?:^|\p{White_Space})(@[\p{Alphabetic}\p{gc=Mark}\p{gc=Decimal_Number}\p{gc=Connector_Punctuation}\p{Join_Control}]*)$/u.exec(
                textBeforeCaret,
            )
            const matchAfterCaret = /^(?:$|\p{White_Space})/u.exec(
                textAfterCaret,
            )
            return [
                matchBeforeCaret ? matchBeforeCaret[1].length : -1,
                matchAfterCaret ? 0 : -1,
            ]
        },
        async load(matchedText) {
            matchedText = matchedText.substring(1)

            if (/^slow_/.test(matchedText)) {
                matchedText = matchedText.substring(5)
                await new Promise(resolve => setTimeout(resolve, 2000))
            }

            if (/^error_/.test(matchedText)) {
                throw new Error('Test error')
            }

            if (matchedText === '') {
                return []
            }

            const response = await fetch(
                `https://en.wikipedia.org/w/api.php?origin=*&action=opensearch&namespace=*&limit=10&namespace=0&format=json&search=${encodeURIComponent(
                    matchedText,
                )}`,
            )
            const body = await response.json()
            return body[1].map(text => ({
                id: text,
                text,
                title: text,
            }))
        },
    })
    window.autocomplete = autocomplete
    return autocomplete
}
