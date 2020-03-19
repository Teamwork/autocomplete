import { Autocomplete, Item, Position } from '@teamwork/autocomplete-core'
import ko from 'knockout'

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
 * The options expected by the TwAutocomplete component.
 */
export interface TwAutocompleteOptions {
    /**
     * The Autocomplete instance to use as the source of truth.
     */
    autocomplete: Autocomplete
    /**
     * Determines if `autocomplete.clear()` should be called automatically when
     * pointerdown or pointerup is emitted when the pointer is outside this component.
     * Defaults to `true`.
     */
    clearOnPointerOutside?: boolean
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
 *          blockName: '...',
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
    public readonly active: KnockoutObservable<boolean>
    public readonly caretPosition: KnockoutObservable<Position>
    public readonly editorPosition: KnockoutObservable<Position>
    public readonly error: KnockoutObservable<Error | undefined>
    public readonly loading: KnockoutObservable<boolean>
    public readonly items: KnockoutObservable<Readonly<Item[]>>
    public readonly matchedText: KnockoutObservable<string>
    public readonly selectedIndex: KnockoutObservable<number>
    public readonly caretVisible: KnockoutComputed<boolean>
    public readonly visible: KnockoutComputed<boolean>
    public readonly viewName: KnockoutComputed<ViewName>
    private node: HTMLElement | undefined = undefined
    private selectedNode: HTMLElement | undefined = undefined
    private readonly clearOnPointerOutside: boolean

    /**
     * Creates a new TwAutocomplete component.
     */
    public constructor({
        autocomplete,
        clearOnPointerOutside = true,
    }: TwAutocompleteOptions) {
        this.clearOnPointerOutside = clearOnPointerOutside
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
        document.addEventListener('pointerdown', this.handlePointer, true)
        document.addEventListener('pointerup', this.handlePointer, true)

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
        document.removeEventListener('pointerdown', this.handlePointer, true)
        document.removeEventListener('pointerup', this.handlePointer, true)
    }

    private scheduleScrollList = (): void => {
        requestAnimationFrame(this.scrollList)
    }

    // Can't test this function properly because jsdom does not support layout.
    /* istanbul ignore next */
    private scrollList = (): void => {
        if (!this.selectedNode) {
            return
        }

        const offsetParentElement = this.selectedNode.offsetParent

        if (!offsetParentElement) {
            return
        }

        if (this.selectedNode.offsetTop < offsetParentElement.scrollTop) {
            offsetParentElement.scrollTop = this.selectedNode.offsetTop
        } else if (
            this.selectedNode.offsetTop + this.selectedNode.offsetHeight >
            offsetParentElement.scrollTop + offsetParentElement.clientHeight
        ) {
            offsetParentElement.scrollTop =
                this.selectedNode.offsetTop +
                this.selectedNode.offsetHeight -
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

    // Can't test this function properly because jsdom does not support layout.
    /* istanbul ignore next */
    private handlePointer = (event: PointerEvent): void => {
        if (this.clearOnPointerOutside && this.active && this.node) {
            const rootNode =
                typeof this.node.getRootNode === 'function'
                    ? (this.node.getRootNode() as ShadowRoot | Document)
                    : document
            const target = rootNode.elementFromPoint(
                event.clientX,
                event.clientY,
            )
            if (!target || !this.node.contains(target)) {
                this.autocomplete.clear()
            }
        }
    }
}

/**
 * The options expected by the `createTemplate` function.
 */
export interface CreateTemplateOptions {
    /**
     * The "Block" in the "Block Element Modifier" methodology, see http://getbem.com/.
     * Defaults to `'tw-autocomplete'`.
     */
    blockName?: string
    /**
     * Template fragment for header.
     * Defaults to `''`.
     */
    header?: string
    /**
     * Template fragment for footer.
     * Defaults to `''`.
     */
    footer?: string
    /**
     * Template fragment for error.
     * Defaults to `'Loading failed'`.
     */
    error?: string
    /**
     * Template fragment displayed before each item.
     * Defaults to `''`.
     */
    beforeItem?: string
    /**
     * Template fragment for a single item.
     * Defaults to `'<!-- ko text: $data.text --><!-- /ko -->'`.
     */
    item?: string
    /**
     * Template fragment displayed after each item.
     * Defaults to `''`.
     */
    afterItem?: string
    /**
     * Template fragment for a situation where no matching items are found.
     * Defaults to `'No items'`.
     */
    blank?: string
    /**
     * Template fragment displayed while loading items.
     * Defaults to `'Loading'`.
     */
    loading?: string
}

/**
 * Creates a new component template with optional template fragment overrides.
 */
export function createTemplate({
    blockName = 'tw-autocomplete',
    header = '',
    footer = '',
    error = 'Loading failed',
    beforeItem = '',
    item = '<!-- ko text: $data.text --><!-- /ko -->',
    afterItem = '',
    blank = 'No items',
    loading = 'Loading',
}: CreateTemplateOptions = {}): string {
    return `
<!-- ko if: visible -->
    <div
        class="${blockName}"
        data-bind="
            style: {
                left: caretPosition().left + 'px',
                top: caretPosition().bottom + 'px'
            },
            css: {
                '${blockName}--loading': loading(),
                '${blockName}--blank': viewName() === 'blank',
                '${blockName}--items': viewName() === 'items',
                '${blockName}--error': viewName() === 'error'
            },
            if: ($component.node = $element, true)
        "
    >
        <div class="${blockName}__header">
            ${header}
        </div>
        <!-- ko if: viewName() === 'items' -->
            <div
                class='${blockName}__list'
                data-bind="foreach: items"
            >
                ${beforeItem}
                <div
                    class="${blockName}__list-item"
                    data-bind="
                        attr: {
                            title: $data.title
                        },
                        css: {
                            '${blockName}__list-item--selected': $component.selectedIndex() === $index()
                        },
                        event: {
                            click: function () {
                                $component.autocomplete.selectedIndex = $index()
                                $component.autocomplete.accept()
                            }
                        },
                        if: ($component.selectedIndex() === $index() && ($component.selectedNode = $element), true)
                    "
                >
                    ${item}
                </div>
                ${afterItem}
            </div>
        <!-- /ko -->
        <!-- ko if: viewName() === 'error' -->
            <div class="${blockName}__error">
                ${error}
            </div>
        <!-- /ko -->
        <!-- ko if: viewName() === 'loading' -->
            <div class="${blockName}__loading">
                ${loading}
            </div>
        <!-- /ko -->
        <!-- ko if: viewName() === 'blank' -->
            <div class="${blockName}__blank">
                ${blank}
            </div>
        <!-- /ko -->
        <div class="${blockName}__footer">
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
