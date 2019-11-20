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
    public readonly selectedItem: Observable<number>
    public readonly caretVisible: PureComputed<boolean>
    public readonly viewName: PureComputed<ViewName>

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
        this.selectedItem = ko.observable(autocomplete.selectedItem)

        this.autocomplete.on('active', this.activeListener)
        this.autocomplete.on('caretPosition', this.caretPositionListener)
        this.autocomplete.on('editorPosition', this.editorPositionListener)
        this.autocomplete.on('error', this.errorListener)
        this.autocomplete.on('loading', this.loadingListener)
        this.autocomplete.on('items', this.itemsListener)
        this.autocomplete.on('matchedText', this.matchedTextListener)
        this.autocomplete.on('selectedItem', this.selectedItemListener)

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
    }

    public dispose(): void {
        this.autocomplete.off('active', this.activeListener)
        this.autocomplete.off('caretPosition', this.caretPositionListener)
        this.autocomplete.off('editorPosition', this.editorPositionListener)
        this.autocomplete.off('error', this.errorListener)
        this.autocomplete.off('loading', this.loadingListener)
        this.autocomplete.off('items', this.itemsListener)
        this.autocomplete.off('matchedText', this.matchedTextListener)
        this.autocomplete.off('selectedItem', this.selectedItemListener)
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
    private selectedItemListener = (): void =>
        this.selectedItem(this.autocomplete.selectedItem)
}

/**
 * The options expected by the `createTemplate` function.
 */
export interface CreateTemplateOptions {
    errorTemplate?: string
    itemTemplate?: string
    blankTemplate?: string
    loadingTemplate?: string
}

/**
 * Creates a new component template with optional customizations.
 */
export function createTemplate({
    errorTemplate = 'Loading failed',
    itemTemplate = '<!-- ko text: item.text --><!-- /ko -->',
    blankTemplate = 'No items',
    loadingTemplate = 'Loading',
}: CreateTemplateOptions = {}): string {
    return `
<!-- ko if: active() && caretVisible() -->
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
        "
    >
        <!-- ko if: viewName() === 'items' -->
            <ul
                class='tw-autocomplete__list'
                data-bind="
                    foreach: {
                        data: items,
                        as: 'item',
                        noChildContext: true
                    }
                "
            >
                <li
                    class="tw-autocomplete__list-item"
                    data-bind="
                        css: {
                            'tw-autocomplete__list-item--selected': selectedItem() === $index()
                        },
                        event: {
                            mousedown: function () {
                                $data.autocomplete.selectedItem = $index()
                                $data.autocomplete.accept()
                            }
                        }
                    "
                >
                    ${itemTemplate}
                </li>
            </ul>
        <!-- /ko -->
        <!-- ko if: viewName() === 'error' -->
            <div class="tw-autocomplete__error">
                ${errorTemplate}
            </div>
        <!-- /ko -->
        <!-- ko if: viewName() === 'loading' -->
            <div class="tw-autocomplete__loading">
                ${loadingTemplate}
            </div>
        <!-- /ko -->
        <!-- ko if: viewName() === 'blank' -->
            <div class="tw-autocomplete__blank">
                ${blankTemplate}
            </div>
        <!-- /ko -->
    </div>
<!-- /ko -->
`
}

/**
 * The default component template.
 */
export const template = createTemplate()
