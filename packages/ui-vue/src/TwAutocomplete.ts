import { Autocomplete, Item, Position } from '@teamwork/autocomplete-core'
import Vue, { VNode } from 'vue'
import { PropValidator } from 'vue/types/options'

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
 * A Vue component displaying the state of an Autocomplete instance.
 *
 * Usage:
 *
 *  ```javascript
 *  const vm = new Vue({
 *      name: 'App',
 *      el: '#autocomplete',
 *      components: { TwAutocomplete },
 *      mounted() {
 *          // Important, `init` must be called exactly once
 *          // to tell the component which Autocomplete instance to use.
 *          this.$refs.autocomplete.init(autocomplete)
 *      },
 *      render(createElement) {
 *          return createElement('TwAutocomplete', {
 *              props: {
 *                  // The "Block" in the "Block Element Modifier" methodology,
 *                  // see http://getbem.com/. Optional.
 *                  blockName: 'tw-autocomplete'
 *              },
 *              // All slots are optional.
 *              scopedSlots: {
 *                  header({ matchedText, viewName }) {},
 *                  beforeItem({ index, item, items, matchedText }) {},
 *                  item({ index, item, items, matchedText }) {},
 *                  afterItem({ viewName, matchedText }) {},
 *                  error({ error, matchedText }) {},
 *                  loading({ matchedText }) {},
 *                  blank({ matchedText }) {},
 *                  footer({ matchedText, viewName }) {},
 *              }
 *          }, {
 *              // The `ref` is needed,
 *              // so that the component can be initialized in `mounted`.
 *              ref: 'autocomplete'
 *          })
 *      },
 *  })
 * ```
 */
/* tslint:disable-next-line:variable-name */
export const TwAutocomplete = Vue.extend({
    computed: {
        caretVisible(): boolean {
            const caretPosition = this.caretPosition
            const editorPosition = this.editorPosition
            return (
                caretPosition.top < editorPosition.bottom + 1 &&
                caretPosition.bottom > editorPosition.top - 1 &&
                caretPosition.left < editorPosition.right + 1 &&
                caretPosition.right > editorPosition.left - 1
            )
        },

        // Can't test this function properly because jsdom does not support layout.
        /* istanbul ignore next */
        style(): Style {
            // These 2 properties are accessed just to set up a dependency,
            // so that the style would be updated.
            if (!this.caretPosition || !this.editorPosition) {
                throw new Error('Should never get here')
            }

            const {
                viewportSize: { width: viewportWidth, height: viewportHeight },
                componentSize: {
                    width: componentWidth,
                    height: componentHeight,
                },
            } = this
            const offset =
                this.uiPosition === UIPosition.start
                    ? -this.caretOffset
                    : this.uiPosition === UIPosition.end
                    ? this.matchedText.length - this.caretOffset
                    : 0
            const {
                top: caretTop,
                right: caretRight,
                bottom: caretBottom,
                left: caretLeft,
            } = this.autocomplete.editorAdapter.getCaretPosition(offset)
            const style: Style = {}

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
        },

        visible(): boolean {
            return this.active && this.caretVisible
        },

        viewName(): ViewName {
            if (this.error) {
                return ViewName.error
            } else if (this.items.length > 0) {
                return ViewName.items
            } else if (this.loading) {
                return ViewName.loading
            } else {
                return ViewName.blank
            }
        },
    },
    data() {
        const data = {
            active: false,
            caretPosition: defaultPosition,
            editorPosition: defaultPosition,
            error: undefined as Error | undefined,
            items: defaultItems,
            loading: false,
            matchedText: '',
            caretOffset: 0,
            selectedIndex: -1,
            viewportSize: {
                width: document.documentElement.clientWidth,
                height: document.documentElement.clientHeight,
            },
            componentSize: {
                width: 0,
                height: 0,
            },
        }
        // Make `autocomplete` a valid property
        // but do not add it to `data` to avoid making it reactive.
        return data as typeof data & { autocomplete: Autocomplete }
    },
    methods: {
        /**
         * The parent component must call this function exactly once to initialize this component.
         * The specified Autocomplete instance is the source of truth of this component and
         * the component's reactive data is kept in sync with it.
         * @param autocomplete An instance of Autocomplete to synchronize with.
         */
        init(autocomplete: Autocomplete): void {
            if (autocomplete == null) {
                throw new TypeError('"autocomplete" must not be null')
            }
            if (this.autocomplete) {
                throw new Error('Already initialized')
            }
            this.autocomplete = autocomplete

            const activeListener = () => (this.active = autocomplete.active)
            const caretPositionListener = () =>
                (this.caretPosition = autocomplete.caretPosition)
            const editorPositionListener = () =>
                (this.editorPosition = autocomplete.editorPosition)
            const errorListener = () => (this.error = autocomplete.error)
            const loadingListener = () => (this.loading = autocomplete.loading)
            const itemsListener = () => (this.items = autocomplete.items)
            const matchedTextListener = () =>
                (this.matchedText = autocomplete.matchedText)
            const caretOffsetListener = () =>
                (this.caretOffset = autocomplete.caretOffset)
            const selectedIndexListener = () =>
                (this.selectedIndex = autocomplete.selectedIndex)

            activeListener()
            caretPositionListener()
            editorPositionListener()
            errorListener()
            loadingListener()
            itemsListener()
            matchedTextListener()
            caretOffsetListener()
            selectedIndexListener()

            autocomplete.on('active', activeListener)
            autocomplete.on('caretPosition', caretPositionListener)
            autocomplete.on('editorPosition', editorPositionListener)
            autocomplete.on('error', errorListener)
            autocomplete.on('loading', loadingListener)
            autocomplete.on('items', itemsListener)
            autocomplete.on('matchedText', matchedTextListener)
            autocomplete.on('caretOffset', caretOffsetListener)
            autocomplete.on('selectedIndex', selectedIndexListener)

            this.$once('hook:beforeDestroy', () => {
                autocomplete.off('active', activeListener)
                autocomplete.off('caretPosition', caretPositionListener)
                autocomplete.off('editorPosition', editorPositionListener)
                autocomplete.off('error', errorListener)
                autocomplete.off('loading', loadingListener)
                autocomplete.off('items', itemsListener)
                autocomplete.off('matchedText', matchedTextListener)
                autocomplete.off('caretOffset', caretOffsetListener)
                autocomplete.off('selectedIndex', selectedIndexListener)
            })
        },

        // Can't test this function properly because jsdom does not support layout.
        /* istanbul ignore next */
        scrollList() {
            const { selectedItemElement } = this.$refs as Refs

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
                selectedItemElement.offsetTop +
                    selectedItemElement.offsetHeight >
                offsetParentElement.scrollTop + offsetParentElement.clientHeight
            ) {
                offsetParentElement.scrollTop =
                    selectedItemElement.offsetTop +
                    selectedItemElement.offsetHeight -
                    offsetParentElement.clientHeight
            }
        },

        // Can't test this function properly because jsdom does not support layout.
        /* istanbul ignore next */
        handlePointer(event: MouseEvent): void {
            if (this.clearOnPointerOutside && this.active) {
                const rootNode =
                    typeof this.$el.getRootNode === 'function'
                        ? (this.$el.getRootNode() as ShadowRoot | Document)
                        : document
                const target = rootNode.elementFromPoint(
                    event.clientX,
                    event.clientY,
                )
                if (!target || !this.$el.contains(target)) {
                    this.autocomplete.clear()
                }
            }
        },

        // Can't test this function properly because jsdom does not support layout.
        /* istanbul ignore next */
        updateViewportSize() {
            this.viewportSize.width = document.documentElement.clientWidth
            this.viewportSize.height = document.documentElement.clientHeight
        },

        // Can't test this function properly because jsdom does not support layout.
        /* istanbul ignore next */
        updateComponentSize() {
            const element = this.$el as HTMLElement
            this.componentSize.width = element.offsetWidth
            this.componentSize.height = element.offsetHeight
        },
    },
    mounted() {
        document.addEventListener('pointerdown', this.handlePointer, true)
        document.addEventListener('pointerup', this.handlePointer, true)
        window.addEventListener('resize', this.updateViewportSize)
    },
    beforeDestroy() {
        document.removeEventListener('pointerdown', this.handlePointer, true)
        document.removeEventListener('pointerup', this.handlePointer, true)
        window.removeEventListener('resize', this.updateViewportSize)
    },
    name: 'TwAutocomplete',
    props: {
        /**
         * The "Block" in the "Block Element Modifier" methodology, see http://getbem.com/.
         * Defaults to `'tw-autocomplete'`.
         */
        blockName: {
            default: 'tw-autocomplete',
            type: String,
        },
        /**
         * Determines if `autocomplete.clear()` should be called automatically when
         * pointerdown or pointerup is emitted when the pointer is outside this component.
         * Defaults to `true`.
         */
        clearOnPointerOutside: {
            default: true,
            type: Boolean,
        },
        /**
         * Determines the position of the autocomplete UI.
         * Defaults to `"caret"`.
         */
        uiPosition: {
            default: UIPosition.caret,
            type: String,
        } as PropValidator<UIPosition>,
    },
    render(createElement): VNode {
        if (!this.visible) {
            return createElement()
        }
        const { matchedText, viewName } = this
        return createElement(
            'div',
            {
                class: {
                    [this.blockName]: true,
                    [`${this.blockName}--loading`]: this.loading,
                    [`${this.blockName}--blank`]: viewName === ViewName.blank,
                    [`${this.blockName}--items`]: viewName === ViewName.items,
                    [`${this.blockName}--error`]: viewName === ViewName.error,
                },
                style: this.style,
            },
            [
                createElement(
                    'div',
                    {
                        class: `${this.blockName}__header`,
                    },
                    this.$scopedSlots.header?.({
                        matchedText,
                        viewName,
                    }),
                ),
                viewName === ViewName.items
                    ? createElement(
                          'div',
                          {
                              class: `${this.blockName}__list`,
                          },
                          this.items.map((item, index, items) => [
                              this.$scopedSlots.beforeItem?.({
                                  index,
                                  item,
                                  items,
                                  matchedText,
                              }),
                              createElement(
                                  'div',
                                  {
                                      attrs: {
                                          title: item.title || '',
                                      },
                                      class: {
                                          [`${this.blockName}__list-item`]: true,
                                          [`${this.blockName}__list-item--selected`]:
                                              this.selectedIndex === index,
                                      },
                                      key: item.id,
                                      on: {
                                          click: (_event: MouseEvent): void => {
                                              this.autocomplete.selectedIndex = index
                                              this.autocomplete.accept()
                                          },
                                      },
                                      ref:
                                          this.selectedIndex === index
                                              ? 'selectedItemElement'
                                              : undefined,
                                  },
                                  this.$scopedSlots.item?.({
                                      index,
                                      item,
                                      items,
                                      matchedText,
                                  }) || item.text,
                              ),
                              this.$scopedSlots.afterItem?.({
                                  index,
                                  item,
                                  items,
                                  matchedText,
                              }),
                          ]),
                      )
                    : viewName === ViewName.error
                    ? createElement(
                          'div',
                          {
                              class: `${this.blockName}__error`,
                          },
                          this.$scopedSlots.error?.({
                              error: this.error,
                              matchedText,
                          }) || 'Loading failed',
                      )
                    : viewName === ViewName.loading
                    ? createElement(
                          'div',
                          {
                              class: `${this.blockName}__loading`,
                          },
                          this.$scopedSlots.loading?.({
                              matchedText,
                          }) || 'Loading',
                      )
                    : createElement(
                          'div',
                          {
                              class: `${this.blockName}__blank`,
                          },
                          this.$scopedSlots.blank?.({
                              matchedText,
                          }) || 'No content',
                      ),
                createElement(
                    'div',
                    {
                        class: `${this.blockName}__footer`,
                    },
                    this.$scopedSlots.footer?.({
                        matchedText,
                        viewName,
                    }),
                ),
            ],
        )
    },

    updated() {
        this.scrollList()
        this.updateComponentSize()
    },
})
export type TwAutocomplete = typeof TwAutocomplete

interface Refs {
    selectedItemElement?: HTMLElement
}

const defaultItems: Readonly<Item[]> = Object.freeze([])
const defaultPosition: Position = Object.freeze({
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
})

type Style = {
    [propertyName in string]: string
}
