import { Autocomplete, Item, Position } from '@teamwork/autocomplete-core'
import ko, { Observable, PureComputed } from 'knockout'

export class TwAutocomplete {
    /**
     * The Autocomplete instance acting as the source of truth.
     */
    public readonly autocomplete: Autocomplete
    public readonly active: Observable<boolean>
    public readonly caretPosition: Observable<Position>
    public readonly editorPosition: Observable<Position>
    public readonly error: Observable<Error | undefined>
    public readonly fetchingItems: Observable<boolean>
    public readonly items: Observable<Readonly<Item[]>>
    public readonly matchedText: Observable<string>
    public readonly selectedItem: Observable<number>
    public readonly hasItems: PureComputed<boolean>
    public readonly caretVisible: PureComputed<boolean>

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
        this.fetchingItems = ko.observable(autocomplete.fetchingItems)
        this.items = ko.observable(autocomplete.items)
        this.matchedText = ko.observable(autocomplete.matchedText)
        this.selectedItem = ko.observable(autocomplete.selectedItem)

        this.autocomplete.on('active', this.activeListener)
        this.autocomplete.on('caretPosition', this.caretPositionListener)
        this.autocomplete.on('editorPosition', this.editorPositionListener)
        this.autocomplete.on('error', this.errorListener)
        this.autocomplete.on('fetchingItems', this.fetchingItemsListener)
        this.autocomplete.on('items', this.itemsListener)
        this.autocomplete.on('matchedText', this.matchedTextListener)
        this.autocomplete.on('selectedItem', this.selectedItemListener)

        this.hasItems = ko.pureComputed(() => this.items().length > 0)
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
    }

    public dispose(): void {
        this.autocomplete.off('active', this.activeListener)
        this.autocomplete.off('caretPosition', this.caretPositionListener)
        this.autocomplete.off('editorPosition', this.editorPositionListener)
        this.autocomplete.off('error', this.errorListener)
        this.autocomplete.off('fetchingItems', this.fetchingItemsListener)
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
    private fetchingItemsListener = (): void =>
        this.fetchingItems(this.autocomplete.fetchingItems)
    private itemsListener = (): void => this.items(this.autocomplete.items)
    private matchedTextListener = (): void =>
        this.matchedText(this.autocomplete.matchedText)
    private selectedItemListener = (): void =>
        this.selectedItem(this.autocomplete.selectedItem)
}

export const template = `
<!-- ko if: active() && caretVisible() -->
    <div
        class="tw-autocomplete"
        data-bind="
            style: {
                left: caretPosition().left + 'px',
                top: caretPosition().bottom + 'px'
            }
        "
    >
        <!-- ko if: hasItems -->
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
                        text: item.text,
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
                ></li>
            </ul>
        <!-- /ko -->
        <!-- ko ifnot: hasItems -->
            No content
        <!-- /ko -->
    </div>
<!-- /ko -->
`
