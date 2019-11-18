import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Vue from 'vue'
import * as codeMirror from './codeMirror'
import './index.css'
import {
    createAutocomplete,
    createPatternHandler,
    createRegexPattern,
} from '@teamwork/autocomplete-core'
import { TwAutocomplete } from '@teamwork/autocomplete-ui-vue'

// Init autocomplete.
const autocomplete = createAutocomplete({
    editorAdapter: codeMirror.editorAdapter,
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

// Display UI.
Vue.config.productionTip = false
const app = new Vue({
    name: 'App',
    el: '#autocomplete',
    components: { TwAutocomplete },
    mounted() {
        this.$refs.autocomplete.init(autocomplete)
    },
    render(createElement) {
        return createElement('TwAutocomplete', {
            ref: 'autocomplete',
        })
    },
})

// Expose for use in dev tools.
window.autocomplete = autocomplete
window.app = app
