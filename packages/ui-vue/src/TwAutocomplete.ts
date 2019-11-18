import {
    Autocomplete,
    defaultCaretPosition,
    defaultItems,
    defaultMatchedText,
    defaultSelectedItem,
} from '@teamwork/autocomplete-core'
import Vue, { VNode } from 'vue'

/* tslint:disable:variable-name */
export const TwAutocomplete = Vue.extend({
    computed: {
        autocomplete: {
            get(): Autocomplete | undefined {
                return (this as any).private_autocomplete
            },
            set(autocomplete: Autocomplete | undefined) {
                ;(this as any).private_autocomplete = autocomplete
            },
        },
    },
    data() {
        return {
            active: false,
            caretPosition: defaultCaretPosition,
            error: undefined as Error | undefined,
            fetchingItems: false,
            items: defaultItems,
            matchedText: defaultMatchedText,
            selectedItem: defaultSelectedItem,
        }
    },
    methods: {
        /**
         * The parent component must call this function exactly once to activate this component.
         * @param autocomplete An instance of Autocomplete.
         */
        init(autocomplete: Autocomplete): void {
            if (autocomplete == null) {
                throw new TypeError('"autocomplete" must not be null')
            }
            if (this.autocomplete) {
                throw new Error('Already initialized')
            }
            this.autocomplete = autocomplete

            type Name =
                | 'active'
                | 'caretPosition'
                | 'error'
                | 'fetchingItems'
                | 'items'
                | 'matchedText'
                | 'selectedItem'
            interface Listener {
                name: Name
                listener: () => void
            }
            const names: Name[] = [
                'active',
                'caretPosition',
                'error',
                'fetchingItems',
                'items',
                'matchedText',
                'selectedItem',
            ]
            const listeners: Listener[] = names.map(name => ({
                listener: () => (this.$data[name] = autocomplete[name]),
                name,
            }))
            listeners.forEach(({ name, listener }) => {
                listener()
                autocomplete.on(name, listener)
            })
            this.$once('hook:beforeDestroy', () => {
                listeners.forEach(({ name, listener }) => {
                    autocomplete.off(name, listener)
                })
            })
        },
    },
    name: 'TwAutocomplete',
    render(createElement): VNode {
        return this.active
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
