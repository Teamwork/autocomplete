import { Autocomplete, Item, Position } from '@teamwork/autocomplete-core'
import ko, { Observable, PureComputed } from 'knockout'

/**
 * The possible view names.
 */
export const enum ViewName {
    error = 'error',
    items = 'items',
    loading = 'loading',
    blank = 'blank',
}

/**
 * A Knockout component displaying the state of an `Autocomplete` instance.
 *
 * Registering the component with the default template.
 *
 *  ```javascript
 *  import twAutocomplete from '@teamwork/autocomplete-ui-ko'
 *  ko.components.register('tw-autocomplete', twAutocomplete)
 *  ```
 *
 * Registering the component with a custom template.
 * The template fragments are evaluated in the context of the TwAutocomplete component,
 * so they have access to all properties of the TwAutocomplete component,
 * which are simply mapped from the component's Autocomplete instance.
 *
 *  ```javascript
 *  import { TwAutocomplete, createTemplate } from '@teamwork/autocomplete-ui-ko'
 *  ko.components.register('tw-autocomplete', {
 *      viewModel: TwAutocomplete,
 *      template: createTemplate({
 *          header: '...',
 *          beforeItem: '...',
 *          item: '...',
 *          afterItem: '...',
 *          error: '...',
 *          loading: '...',
 *          blank: '...',
 *          footer: '...',
 *      }),
 *  })
 *  ```
 *
 *  Using the component in a template.
 *  An Autocomplete instance must be passed in as a parameter.
 *
 *  ```html
 *  <!-- ko component: { name: "tw-autocomplete", params: autocomplete } --><!-- /ko -->
 *  ```
 */
export class TwAutocomplete {
    /**
     * The Autocomplete instance acting as the source of truth.
     */
    public readonly autocomplete: Autocomplete
    public readonly active: Observable<boolean>
    public readonly caretPosition: Observable<Position>
    public readonly editorPosition: Observable<Position>
    public readonly error: Observable<Error | undefined>
    public readonly loading: Observable<boolean>
    public readonly items: Observable<Readonly<Item[]>>
    public readonly matchedText: Observable<string>
    public readonly selectedIndex: Observable<number>
    public readonly caretVisible: PureComputed<boolean>
    public readonly visible: PureComputed<boolean>
    public readonly viewName: PureComputed<ViewName>
    private node: HTMLElement | undefined = undefined

    /**
     * Creates a new TwAutocomplete component.
     * @param autocomplete The Autocomplete instance to use as the source of truth.
     */
    public constructor(autocomplete: Autocomplete) {
        this.autocomplete = autocomplete
        this.active = ko.observable(autocomplete.active)
        this.caretPosition = ko.observable(autocomplete.caretPosition)
        this.editorPosition = ko.observable(autocomplete.editorPosition)
        this.error = ko.observable(autocomplete.error)
        this.loading = ko.observable(autocomplete.loading)
        this.items = ko.observable(autocomplete.items)
        this.matchedText = ko.observable(autocomplete.matchedText)
        this.selectedIndex = ko.observable(autocomplete.selectedIndex)

        this.autocomplete.on('active', this.activeListener)
        this.autocomplete.on('caretPosition', this.caretPositionListener)
        this.autocomplete.on('editorPosition', this.editorPositionListener)
        this.autocomplete.on('error', this.errorListener)
        this.autocomplete.on('loading', this.loadingListener)
        this.autocomplete.on('items', this.itemsListener)
        this.autocomplete.on('matchedText', this.matchedTextListener)
        this.autocomplete.on('selectedIndex', this.selectedIndexListener)
        document.addEventListener('mousedown', this.onMouseButton, true)
        document.addEventListener('mouseup', this.onMouseButton, true)

        this.caretVisible = ko.pureComputed(() => {
            const caretPosition = this.caretPosition()
            const editorPosition = this.editorPosition()
            return (
                caretPosition.top <= editorPosition.bottom &&
                caretPosition.bottom >= editorPosition.top &&
                caretPosition.left <= editorPosition.right &&
                caretPosition.right >= editorPosition.left
            )
        })
        this.visible = ko.pureComputed(
            () => this.active() && this.caretVisible(),
        )
        this.viewName = ko.pureComputed(() => {
            if (this.error()) {
                return ViewName.error
            } else if (this.items().length > 0) {
                return ViewName.items
            } else if (this.loading()) {
                return ViewName.loading
            } else {
                return ViewName.blank
            }
        })

        this.selectedIndex.subscribe(this.scheduleScrollList)
    }

    public dispose(): void {
        this.autocomplete.off('active', this.activeListener)
        this.autocomplete.off('caretPosition', this.caretPositionListener)
        this.autocomplete.off('editorPosition', this.editorPositionListener)
        this.autocomplete.off('error', this.errorListener)
        this.autocomplete.off('loading', this.loadingListener)
        this.autocomplete.off('items', this.itemsListener)
        this.autocomplete.off('matchedText', this.matchedTextListener)
        this.autocomplete.off('selectedIndex', this.selectedIndexListener)
        document.removeEventListener('mousedown', this.onMouseButton, true)
        document.removeEventListener('mouseup', this.onMouseButton, true)
    }

    private scheduleScrollList = (): void => {
        requestAnimationFrame(this.scrollList)
    }

    // Can't test this function properly because jsdom does not support layout.
    /* istanbul ignore next */
    private scrollList = (): void => {
        if (!this.node) {
            return
        }

        const selectedItemElement = this.node.querySelector(
            '.tw-autocomplete__list-item--selected',
        ) as HTMLElement | null

        if (!selectedItemElement) {
            return
        }

        const offsetParentElement = selectedItemElement.offsetParent

        if (!offsetParentElement) {
            return
        }

        if (selectedItemElement.offsetTop < offsetParentElement.scrollTop) {
            offsetParentElement.scrollTop = selectedItemElement.offsetTop
        } else if (
            selectedItemElement.offsetTop + selectedItemElement.offsetHeight >
            offsetParentElement.scrollTop + offsetParentElement.clientHeight
        ) {
            offsetParentElement.scrollTop =
                selectedItemElement.offsetTop +
                selectedItemElement.offsetHeight -
                offsetParentElement.clientHeight
        }
    }

    private activeListener = (): void => this.active(this.autocomplete.active)
    private caretPositionListener = (): void =>
        this.caretPosition(this.autocomplete.caretPosition)
    private editorPositionListener = (): void =>
        this.editorPosition(this.autocomplete.editorPosition)
    private errorListener = (): void => this.error(this.autocomplete.error)
    private loadingListener = (): void =>
        this.loading(this.autocomplete.loading)
    private itemsListener = (): void => this.items(this.autocomplete.items)
    private matchedTextListener = (): void =>
        this.matchedText(this.autocomplete.matchedText)
    private selectedIndexListener = (): void =>
        this.selectedIndex(this.autocomplete.selectedIndex)

    private onMouseButton = (event: MouseEvent): void => {
        if (
            this.active() &&
            this.node &&
            !this.node.contains(event.target as Node)
        ) {
            this.autocomplete.clear()
        }
    }
}

/**
 * The options expected by the `createTemplate` function,
 * where each property specifies a template fragment.
 */
export interface CreateTemplateOptions {
    header?: string
    footer?: string
    error?: string
    beforeItem?: string
    item?: string
    afterItem?: string
    blank?: string
    loading?: string
}

/**
 * Creates a new component template with optional template fragment overrides.
 */
export function createTemplate({
    header = '',
    footer = '',
    error = 'Loading failed',
    beforeItem = '',
    item = '<!-- ko text: item.text --><!-- /ko -->',
    afterItem = '',
    blank = 'No items',
    loading = 'Loading',
}: CreateTemplateOptions = {}): string {
    return `
<!-- ko if: visible -->
    <div
        class="tw-autocomplete"
        data-bind="
            style: {
                left: caretPosition().left + 'px',
                top: caretPosition().bottom + 'px'
            },
            css: {
                'tw-autocomplete--loading': loading()
            },
            let: ($component.node = $element, undefined)
        "
    >
        <div class="tw-autocomplete__header">
            ${header}
        </div>
        <!-- ko if: viewName() === 'items' -->
            <div
                class='tw-autocomplete__list'
                data-bind="
                    foreach: {
                        data: items,
                        as: 'item',
                        noChildContext: true
                    }
                "
            >
                ${beforeItem}
                <div
                    class="tw-autocomplete__list-item"
                    data-bind="
                        attr: {
                            title: item.title
                        },
                        css: {
                            'tw-autocomplete__list-item--selected': $data.selectedIndex() === $index()
                        },
                        event: {
                            click: function () {
                                $data.autocomplete.selectedIndex = $index()
                                $data.autocomplete.accept()
                            }
                        }
                    "
                >
                    ${item}
                </div>
                ${afterItem}
            </div>
        <!-- /ko -->
        <!-- ko if: viewName() === 'error' -->
            <div class="tw-autocomplete__error">
                ${error}
            </div>
        <!-- /ko -->
        <!-- ko if: viewName() === 'loading' -->
            <div class="tw-autocomplete__loading">
                ${loading}
            </div>
        <!-- /ko -->
        <!-- ko if: viewName() === 'blank' -->
            <div class="tw-autocomplete__blank">
                ${blank}
            </div>
        <!-- /ko -->
        <div class="tw-autocomplete__footer">
            ${footer}
        </div>
    </div>
<!-- /ko -->
`
}

/**
 * The default component template.
 */
export const template = createTemplate()
