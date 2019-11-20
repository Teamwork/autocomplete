import ko from 'knockout'
import twAutocomplete from '@teamwork/autocomplete-ui-ko'

export function initUI(autocomplete) {
    const context = { autocomplete }
    const node = document.getElementById('autocomplete')
    node.setAttribute(
        'data-bind',
        'component:{name:"tw-autocomplete",params:autocomplete}',
    )
    ko.components.register('tw-autocomplete', twAutocomplete)
    ko.applyBindings(context, node)
    const app = ko.contextFor(node)
    window.app = app
    return app
}
