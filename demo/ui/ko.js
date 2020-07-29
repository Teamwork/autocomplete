import ko from 'knockout'
import { TwAutocomplete, createTemplate } from '@teamwork/autocomplete-ui-ko'

export function initUI(autocomplete) {
    const uiPosition = 'caret'
    const context = { autocomplete, uiPosition }
    const node = document.getElementById('autocomplete')
    node.setAttribute(
        'data-bind',
        'component:{name:"tw-autocomplete",params:{autocomplete,uiPosition}}',
    )
    ko.components.register('tw-autocomplete', {
        viewModel: TwAutocomplete,
        template: createTemplate({
            header: 'Type something',
        }),
    })
    ko.applyBindings(context, node)
    const app = ko.contextFor(node)
    window.app = app
    return app
}
