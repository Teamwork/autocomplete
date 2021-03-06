import Vue from 'vue'
import { TwAutocomplete } from '@teamwork/autocomplete-ui-vue'

export function initUI(autocomplete) {
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
                scopedSlots: {
                    header() {
                        return 'Type something'
                    },
                },
                props: {
                    uiPosition: 'caret',
                },
            })
        },
    })
    window.app = app
    return app
}
