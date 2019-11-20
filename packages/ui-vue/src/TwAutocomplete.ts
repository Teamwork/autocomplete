import {
    Autocomplete,
    defaultItems,
    defaultMatchedText,
    defaultPosition,
    defaultSelectedItem,
} from '@teamwork/autocomplete-core'
import Vue, { VNode } from 'vue'

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
    },
    data() {
        const data = {
            active: false,
            caretPosition: defaultPosition,
            editorPosition: defaultPosition,
            error: undefined as Error | undefined,
            fetchingItems: false,
            items: defaultItems,
            matchedText: defaultMatchedText,
            selectedItem: defaultSelectedItem,
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
            const fetchingItemsListener = () =>
                (this.fetchingItems = autocomplete.fetchingItems)
            const itemsListener = () => (this.items = autocomplete.items)
            const matchedTextListener = () =>
                (this.matchedText = autocomplete.matchedText)
            const selectedItemListener = () =>
                (this.selectedItem = autocomplete.selectedItem)

            activeListener()
            caretPositionListener()
            editorPositionListener()
            errorListener()
            fetchingItemsListener()
            itemsListener()
            matchedTextListener()
            selectedItemListener()

            autocomplete.on('active', activeListener)
            autocomplete.on('caretPosition', caretPositionListener)
            autocomplete.on('editorPosition', editorPositionListener)
            autocomplete.on('error', errorListener)
            autocomplete.on('fetchingItems', fetchingItemsListener)
            autocomplete.on('items', itemsListener)
            autocomplete.on('matchedText', matchedTextListener)
            autocomplete.on('selectedItem', selectedItemListener)

            this.$once('hook:beforeDestroy', () => {
                autocomplete.off('active', activeListener)
                autocomplete.off('caretPosition', caretPositionListener)
                autocomplete.off('editorPosition', editorPositionListener)
                autocomplete.off('error', errorListener)
                autocomplete.off('fetchingItems', fetchingItemsListener)
                autocomplete.off('items', itemsListener)
                autocomplete.off('matchedText', matchedTextListener)
                autocomplete.off('selectedItem', selectedItemListener)
            })
        },
    },
    name: 'TwAutocomplete',
    render(createElement): VNode {
        return this.active && this.caretVisible
            ? createElement(
                  'div',
                  {
                      class: 'tw-autocomplete',
                      style: {
                          left: `${this.caretPosition.left}px`,
                          top: `${this.caretPosition.bottom}px`,
                      },
                  },
                  [
                      this.items.length > 0
                          ? createElement(
                                'ul',
                                {
                                    class: 'tw-autocomplete__list',
                                },
                                this.items.map((item, index) =>
                                    createElement(
                                        'li',
                                        {
                                            class: {
                                                'tw-autocomplete__list-item': true,
                                                'tw-autocomplete__list-item--selected':
                                                    this.selectedItem === index,
                                            },
                                            key: item.id,
                                            on: {
                                                mousedown: (
                                                    event: MouseEvent,
                                                ): void => {
                                                    event.preventDefault()
                                                    this.autocomplete.selectedItem = index
                                                    this.autocomplete.accept()
                                                },
                                            },
                                        },
                                        [item.text],
                                    ),
                                ),
                            )
                          : 'No content',
                  ],
              )
            : createElement()
    },
})

// TODO use error and fetchingItems in render
// TODO add unit tests
// TODO define slots
