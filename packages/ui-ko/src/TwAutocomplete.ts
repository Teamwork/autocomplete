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
 * The possible UI positions.
 */
export const enum UIPosition {
    /**
     * Align with the caret.
     */
    caret = 'caret',
    /**
     * Align with the start of the matched text.
     */
    start = 'start',
    /**
     * Align with the end of the matched text.
     */
    end = 'end',
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
    /**
     * Determines the position of the autocomplete UI.
     * Defaults to `"caret"`.
     */
    uiPosition?: UIPosition
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
    public readonly caretOffset: KnockoutObservable<number>
    public readonly selectedIndex: KnockoutObservable<number>
    public readonly caretVisible: KnockoutComputed<boolean>
    public readonly visible: KnockoutComputed<boolean>
    public readonly viewName: KnockoutComputed<ViewName>
    public readonly style: KnockoutComputed<Style>
    private node: HTMLElement | undefined = undefined
    private selectedNode: HTMLElement | undefined = undefined
    private readonly clearOnPointerOutside: boolean
    private readonly uiPosition: UIPosition
    private readonly viewportWidth: KnockoutObservable<number>
    private readonly viewportHeight: KnockoutObservable<number>
    private readonly componentWidth: KnockoutObservable<number>
    private readonly componentHeight: KnockoutObservable<number>

    /**
     * Creates a new TwAutocomplete component.
     */
    public constructor({
        autocomplete,
        clearOnPointerOutside = true,
        uiPosition = UIPosition.caret,
    }: TwAutocompleteOptions) {
        const { documentElement } = document
        this.clearOnPointerOutside = clearOnPointerOutside
        this.uiPosition = uiPosition
        this.autocomplete = autocomplete
        this.active = ko.observable(autocomplete.active)
        this.caretPosition = ko.observable(autocomplete.caretPosition)
        this.editorPosition = ko.observable(autocomplete.editorPosition)
        this.error = ko.observable(autocomplete.error)
        this.loading = ko.observable(autocomplete.loading)
        this.items = ko.observable(autocomplete.items)
        this.matchedText = ko.observable(autocomplete.matchedText)
        this.caretOffset = ko.observable(autocomplete.caretOffset)
        this.selectedIndex = ko.observable(autocomplete.selectedIndex)
        this.viewportWidth = ko.observable(documentElement.clientWidth)
        this.viewportHeight = ko.observable(documentElement.clientHeight)
        this.componentWidth = ko.observable(0)
        this.componentHeight = ko.observable(0)

        this.autocomplete.on('active', this.activeListener)
        this.autocomplete.on('caretPosition', this.caretPositionListener)
        this.autocomplete.on('editorPosition', this.editorPositionListener)
        this.autocomplete.on('error', this.errorListener)
        this.autocomplete.on('loading', this.loadingListener)
        this.autocomplete.on('items', this.itemsListener)
        this.autocomplete.on('matchedText', this.matchedTextListener)
        this.autocomplete.on('caretOffset', this.caretOffsetListener)
        this.autocomplete.on('selectedIndex', this.selectedIndexListener)
        document.addEventListener('pointerdown', this.handlePointer, true)
        document.addEventListener('pointerup', this.handlePointer, true)
        window.addEventListener('resize', this.updateViewportSize)

        this.caretVisible = ko.pureComputed(() => {
            const caretPosition = this.caretPosition()
            const editorPosition = this.editorPosition()
            return (
                caretPosition.top < editorPosition.bottom + 1 &&
                caretPosition.bottom > editorPosition.top - 1 &&
                caretPosition.left < editorPosition.right + 1 &&
                caretPosition.right > editorPosition.left - 1
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

        // Can't test this function properly because jsdom does not support layout.
        /* istanbul ignore next */
        this.style = ko.pureComputed(() => {
            // These 2 properties are accessed just to set up a dependency,
            // so that the style would be updated.
            this.caretPosition()
            this.editorPosition()

            const viewportWidth = this.viewportWidth()
            const viewportHeight = this.viewportHeight()
            const componentWidth = this.componentWidth()
            const componentHeight = this.componentHeight()
            const offset =
                this.uiPosition === UIPosition.start
                    ? -this.caretOffset()
                    : this.uiPosition === UIPosition.end
                    ? this.matchedText().length - this.caretOffset()
                    : 0
            const {
                top: caretTop,
                right: caretRight,
                bottom: caretBottom,
                left: caretLeft,
            } = this.autocomplete.editorAdapter.getCaretPosition(offset)
            const style: Style = {
                top: 'auto',
                right: 'auto',
                bottom: 'auto',
                left: 'auto',
            }

            if (
                caretBottom + componentHeight <= viewportHeight ||
                viewportHeight - caretBottom >= caretTop
            ) {
                style.top = `${caretBottom}px`
            } else {
                style.bottom = `${viewportHeight - caretTop}px`
            }

            if (
                caretRight + componentWidth <= viewportWidth ||
                viewportWidth - caretRight >= caretLeft
            ) {
                style.left = `${caretRight}px`
            } else {
                style.right = `${viewportWidth - caretLeft}px`
            }

            return style
        })

        this.selectedIndex.subscribe(this.scrollListAsync)
        this.items.subscribe(this.updateComponentSizeAsync)
        this.viewName.subscribe(this.updateComponentSizeAsync)
    }

    public dispose(): void {
        this.autocomplete.off('active', this.activeListener)
        this.autocomplete.off('caretPosition', this.caretPositionListener)
        this.autocomplete.off('editorPosition', this.editorPositionListener)
        this.autocomplete.off('error', this.errorListener)
        this.autocomplete.off('loading', this.loadingListener)
        this.autocomplete.off('items', this.itemsListener)
        this.autocomplete.off('matchedText', this.matchedTextListener)
        this.autocomplete.off('caretOffset', this.caretOffsetListener)
        this.autocomplete.off('selectedIndex', this.selectedIndexListener)
        document.removeEventListener('pointerdown', this.handlePointer, true)
        document.removeEventListener('pointerup', this.handlePointer, true)
        window.removeEventListener('resize', this.updateViewportSize)
    }

    private scrollListAsync = (): void => {
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

    public updateComponentSizeAsync = (): void => {
        requestAnimationFrame(this.updateComponentSize)
    }

    // Can't test this function properly because jsdom does not support layout.
    /* istanbul ignore next */
    private updateComponentSize = (): void => {
        if (this.node) {
            this.componentWidth(this.node.offsetWidth)
            this.componentHeight(this.node.offsetHeight)
        }
    }

    // Can't test this function properly because jsdom does not support layout.
    /* istanbul ignore next */
    private updateViewportSize = (): void => {
        this.viewportWidth(document.documentElement.clientWidth)
        this.viewportHeight(document.documentElement.clientHeight)
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
    private caretOffsetListener = (): void =>
        this.caretOffset(this.autocomplete.caretOffset)
    private selectedIndexListener = (): void =>
        this.selectedIndex(this.autocomplete.selectedIndex)

    // Can't test this function properly because jsdom does not support layout.
    /* istanbul ignore next */
    private handlePointer = (event: PointerEvent): void => {
        if (this.clearOnPointerOutside && this.active() && this.node) {
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
            style: style,
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

type Style = {
    [propertyName in string]: string
}
