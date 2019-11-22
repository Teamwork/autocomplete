import {
    Autocomplete,
    defaultItems,
    defaultMatchedText,
    defaultPosition,
    defaultSelectedIndex,
} from '@teamwork/autocomplete-core'
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
            matchedText: defaultMatchedText,
            selectedIndex: defaultSelectedIndex,
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
        const onMouseButton = (event: MouseEvent): void => {
            if (this.active && !this.$el.contains(event.target as Node)) {
                this.autocomplete.clear()
            }
        }
        document.addEventListener('mousedown', onMouseButton, true)
        document.addEventListener('mouseup', onMouseButton, true)
        this.$once('hook:beforeDestroy', () => {
            document.removeEventListener('mousedown', onMouseButton, true)
            document.removeEventListener('mouseup', onMouseButton, true)
        })
    },
    name: 'TwAutocomplete',
    render(createElement): VNode {
        return this.visible
            ? createElement(
                  'div',
                  {
                      class: {
                          'tw-autocomplete': true,
                          'tw-autocomplete--loading': this.loading,
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
                              class: 'tw-autocomplete__header',
                          },
                          this.$scopedSlots.header?.({
                              viewName: this.viewName,
                          }),
                      ),
                      this.viewName === ViewName.items
                          ? createElement(
                                'div',
                                {
                                    class: 'tw-autocomplete__list',
                                },
                                this.items.map((item, index, items) => [
                                    this.$scopedSlots.beforeItem?.({
                                        index,
                                        item,
                                        items,
                                    }),
                                    createElement(
                                        'div',
                                        {
                                            class: {
                                                'tw-autocomplete__list-item': true,
                                                'tw-autocomplete__list-item--selected':
                                                    this.selectedIndex ===
                                                    index,
                                            },
                                            key: item.id,
                                            on: {
                                                click: (
                                                    event: MouseEvent,
                                                ): void => {
                                                    event.preventDefault()
                                                    this.autocomplete.selectedIndex = index
                                                    this.autocomplete.accept()
                                                },
                                            },
                                        },
                                        this.$scopedSlots.item?.({
                                            index,
                                            item,
                                            items,
                                            matchedText: this.matchedText,
                                        }) || item.text,
                                    ),
                                    this.$scopedSlots.afterItem?.({
                                        index,
                                        item,
                                        items,
                                    }),
                                ]),
                            )
                          : this.viewName === ViewName.error
                          ? createElement(
                                'div',
                                {
                                    class: 'tw-autocomplete__error',
                                },
                                this.$scopedSlots.error?.({
                                    error: this.error,
                                }) || 'Loading failed',
                            )
                          : this.viewName === ViewName.loading
                          ? createElement(
                                'div',
                                {
                                    class: 'tw-autocomplete__loading',
                                },
                                this.$scopedSlots.loading?.(undefined) ||
                                    'Loading',
                            )
                          : createElement(
                                'div',
                                {
                                    class: 'tw-autocomplete__blank',
                                },
                                this.$scopedSlots.blank?.(undefined) ||
                                    'No content',
                            ),
                      createElement(
                          'div',
                          {
                              class: 'tw-autocomplete__footer',
                          },
                          this.$scopedSlots.footer?.({
                              viewName: this.viewName,
                          }),
                      ),
                  ],
              )
            : createElement()
    },
})
