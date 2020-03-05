import { Autocomplete, Item, Position } from '@teamwork/autocomplete-core'
import Vue, { VNode } from 'vue'

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
                caretPosition.top <= editorPosition.bottom &&
                caretPosition.bottom >= editorPosition.top &&
                caretPosition.left <= editorPosition.right &&
                caretPosition.right >= editorPosition.left
            )
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
            selectedIndex: -1,
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
            const selectedIndexListener = () =>
                (this.selectedIndex = autocomplete.selectedIndex)

            activeListener()
            caretPositionListener()
            editorPositionListener()
            errorListener()
            loadingListener()
            itemsListener()
            matchedTextListener()
            selectedIndexListener()

            autocomplete.on('active', activeListener)
            autocomplete.on('caretPosition', caretPositionListener)
            autocomplete.on('editorPosition', editorPositionListener)
            autocomplete.on('error', errorListener)
            autocomplete.on('loading', loadingListener)
            autocomplete.on('items', itemsListener)
            autocomplete.on('matchedText', matchedTextListener)
            autocomplete.on('selectedIndex', selectedIndexListener)

            this.$once('hook:beforeDestroy', () => {
                autocomplete.off('active', activeListener)
                autocomplete.off('caretPosition', caretPositionListener)
                autocomplete.off('editorPosition', editorPositionListener)
                autocomplete.off('error', errorListener)
                autocomplete.off('loading', loadingListener)
                autocomplete.off('items', itemsListener)
                autocomplete.off('matchedText', matchedTextListener)
                autocomplete.off('selectedIndex', selectedIndexListener)
            })
        },
    },
    mounted() {
        // Can't test this function properly because jsdom does not support layout.
        /* istanbul ignore next */
        const handlePointer = (event: MouseEvent): void => {
            if (this.clearOnPointerOutside && this.active) {
                const target = document.elementFromPoint(
                    event.clientX,
                    event.clientY,
                )
                if (!target || !this.$el.contains(target)) {
                    this.autocomplete.clear()
                }
            }
        }
        document.addEventListener('pointerdown', handlePointer, true)
        document.addEventListener('pointerup', handlePointer, true)
        this.$once('hook:beforeDestroy', () => {
            document.removeEventListener('pointerdown', handlePointer, true)
            document.removeEventListener('pointerup', handlePointer, true)
        })
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
                style: {
                    left: `${this.caretPosition.left}px`,
                    top: `${this.caretPosition.bottom}px`,
                },
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
                                          click: (event: MouseEvent): void => {
                                              event.preventDefault()
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
    // Can't test this function properly because jsdom does not support layout.
    /* istanbul ignore next */
    updated() {
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
            selectedItemElement.offsetTop + selectedItemElement.offsetHeight >
            offsetParentElement.scrollTop + offsetParentElement.clientHeight
        ) {
            offsetParentElement.scrollTop =
                selectedItemElement.offsetTop +
                selectedItemElement.offsetHeight -
                offsetParentElement.clientHeight
        }
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
