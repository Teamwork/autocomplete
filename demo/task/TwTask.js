import '../autocomplete/style.css'
import './TwTask.css'
import Vue from 'vue'
import { createAutocomplete } from '@teamwork/autocomplete-core'
import { createEditorAdapter } from '@teamwork/autocomplete-editor-text'
import { TwAutocomplete } from '@teamwork/autocomplete-ui-vue'
import { focus } from './directives/focus'

export const TwTask = Vue.extend({
    components: { TwAutocomplete },
    directives: { focus },
    props: {
        blockName: {
            type: String,
            default: 'tw-task',
        },
    },
    data() {
        return {
            name: '',
            description: '',
            startDate: null,
            dueDate: null,
            priority: 0,
            estimatedTime: 0,
            progress: 0,
            tags: [],
            assignees: [],
            descriptionEditorVisible: false,
            descriptionDraft: '',
        }
    },
    methods: {
        onNameInput(event) {
            this.name = event.target.value
        },
        onDescriptionInput() {
            this.descriptionDraft = event.target.value
        },
        onDescriptionKeyDown(event) {
            switch (event.key) {
                case 'Enter':
                    if (
                        (event.ctrlKey || event.metaKey) &&
                        !event.altKey &&
                        !event.shiftKey
                    ) {
                        this.saveDescription()
                        event.preventDefault()
                    }
                    break
                case 'Esc':
                case 'Escape':
                    if (
                        !event.ctrlKey &&
                        !event.metaKey &&
                        !event.altKey &&
                        !event.shiftKey
                    ) {
                        this.cancelDescription()
                        event.preventDefault()
                    }
                    break
            }
        },
        editDescription() {
            this.descriptionEditorVisible = true
            this.descriptionDraft = this.description
        },
        saveDescription() {
            this.descriptionEditorVisible = false
            this.description = this.descriptionDraft
            this.$refs.input.focus()
        },
        cancelDescription() {
            this.descriptionEditorVisible = false
            this.$refs.input.focus()
        },
    },
    mounted() {
        const editorAdapter = createEditorAdapter(this.$refs.input)
        const autocomplete = createAutocomplete({
            editorAdapter,
            match: (textBeforeCaret, textAfterCaret) => {
                const matchBeforeCaret = /(?:^|\s)([@#/][\w:/]*)$/.exec(
                    textBeforeCaret,
                )
                const matchAfterCaret = /^(?:$|\s)/.exec(textAfterCaret)
                return [
                    matchBeforeCaret ? matchBeforeCaret[1].length : -1,
                    matchAfterCaret ? 0 : -1,
                ]
            },
            load: matchedText => {
                const firstChar = matchedText[0]
                matchedText = matchedText.substring(1).toLocaleLowerCase()
                const subcommandIndex = matchedText.indexOf(':') + 1

                if (firstChar === '#') {
                    return tagItems(matchedText, this)
                } else if (firstChar === '@') {
                    return userItems(matchedText, this)
                } else if (subcommandIndex > 0) {
                    const commandId = matchedText.substring(0, subcommandIndex)
                    const subcommandId = matchedText.substring(subcommandIndex)
                    const command = findItem(staticCommandItems, commandId)
                    return command ? command.items(subcommandId, this) : []
                } else {
                    return commandItems(matchedText, this)
                }
            },
            accept: item => {
                const text = item.accept(autocomplete, this)
                if (typeof text === 'string') {
                    autocomplete.replace(text)
                    autocomplete.clear()
                    editorAdapter.focus()
                }
                this.name = this.$refs.input.value
            },
        })
        this.$refs.autocomplete.init(autocomplete)
        this.$once('hook:beforeDestroy', () => {
            autocomplete.destroy()
            editorAdapter.destroy()
        })
    },
    render(createElement) {
        return createElement('div', { class: this.blockName }, [
            createElement('p', { class: `${this.blockName}__tip` }, [
                'Press ',
                createElement('strong', '/'),
                ' for commands, ',
                createElement('strong', '@'),
                ' to mention people and ',
                createElement('strong', '#'),
                ' to add tags.',
            ]),
            createElement('input', {
                class: `${this.blockName}__input`,
                ref: 'input',
                domProps: { value: this.name },
                on: { input: this.onNameInput },
                directives: [{ name: 'focus' }],
            }),
            createElement('TwAutocomplete', {
                ref: 'autocomplete',
                scopedSlots: {
                    header({ matchedText }) {
                        matchedText = matchedText.toLocaleLowerCase()
                        return matchedText.startsWith('#')
                            ? 'Add a Tag'
                            : matchedText.startsWith('@')
                            ? 'Assign to a User'
                            : matchedText.startsWith('/priority:')
                            ? 'Set Priority'
                            : matchedText.startsWith('/progress:')
                            ? 'Set Progress'
                            : matchedText.startsWith('/estimatedtime:')
                            ? 'Set Estimated Time (units: d, h)'
                            : matchedText.startsWith('/startdate:')
                            ? 'Set Start Date (dd/mm/yyyy)'
                            : matchedText.startsWith('/duedate:')
                            ? 'Set Due Date (dd/mm/yyyy)'
                            : matchedText.startsWith('/')
                            ? 'Execute a Command'
                            : '\u00A0'
                    },
                },
            }),
            this.descriptionEditorVisible
                ? createElement(
                      'div',
                      { class: `${this.blockName}__description-editor` },
                      [
                          createElement(
                              'span',
                              {
                                  class: `${this.blockName}__description-editor-label`,
                              },
                              'Description',
                          ),
                          createElement('textarea', {
                              class: `${this.blockName}__description-editor-textarea`,
                              directives: [{ name: 'focus' }],
                              domProps: { value: this.descriptionDraft },
                              on: {
                                  input: this.onDescriptionInput,
                                  keydown: this.onDescriptionKeyDown,
                              },
                          }),
                          createElement(
                              'button',
                              {
                                  class: `${this.blockName}__description-editor-button`,
                                  on: { click: this.cancelDescription },
                              },
                              ['Cancel'],
                          ),
                          createElement(
                              'button',
                              {
                                  class: `${this.blockName}__description-editor-button`,
                                  on: { click: this.saveDescription },
                              },
                              ['Save'],
                          ),
                      ],
                  )
                : undefined,
            createElement(
                'table',
                { class: `${this.blockName}__properties` },
                taskProperties.map(({ name, displayName }) =>
                    createElement(
                        'tr',
                        { class: `${this.blockName}__property` },
                        [
                            createElement(
                                'th',
                                { class: `${this.blockName}__property-name` },
                                displayName,
                            ),
                            createElement(
                                'td',
                                { class: `${this.blockName}__property-value` },
                                taskPropertyValuetoString(this[name]),
                            ),
                        ],
                    ),
                ),
            ),
        ])
    },
})

function taskPropertyValuetoString(property) {
    return Array.isArray(property)
        ? property.map(item => item.text).join(', ')
        : property instanceof Date
        ? property.toDateString()
        : '' + property
}

const taskProperties = [
    { name: 'name', displayName: 'Name' },
    { name: 'description', displayName: 'Description' },
    { name: 'startDate', displayName: 'Start Date' },
    { name: 'dueDate', displayName: 'Due Date' },
    { name: 'priority', displayName: 'Priority' },
    { name: 'estimatedTime', displayName: 'Estimated Time' },
    { name: 'progress', displayName: 'Progress' },
    { name: 'tags', displayName: 'Tags' },
    { name: 'assignees', displayName: 'Assignees' },
]

const today = () => new Date()
const tomorrow = () => new Date(Date.now() + 24 * 60 * 60 * 1000)
const nextWeek = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

const filterItems = (items, matchedText) =>
    items.filter(item => item.id.indexOf(matchedText) >= 0)

const findItem = (items, id) => items.find(item => item.id === id)

function acceptTag(autocomplete, component) {
    component.tags.push(this)
    return ''
}

function acceptUser(autocomplete, component) {
    component.assignees.push(this)
    return ''
}

function acceptPriority(autocomplete, component) {
    component.priority = this.text
    return ''
}

const acceptParentCommand = text => autocomplete => {
    autocomplete.replace(text)
    autocomplete.editorAdapter.focus()
    requestAnimationFrame(() => autocomplete.match())
}

const staticTagItems = [
    'needs-review',
    'under-review',
    'reviewed',
    'needs-testing',
    'under-test',
    'tested',
    'blocked',
    'bug',
    'feature-request',
    'frontend',
    'backend',
    'database',
    'help-needed',
    'cannot-reproduce',
].map(text => ({
    id: text.replace(/\W/g, '').toLocaleLowerCase(),
    text,
    title: text,
    accept: acceptTag,
}))

const tagItems = (matchedText, component) =>
    staticTagItems.filter(
        tag =>
            tag.id.indexOf(matchedText) >= 0 && component.tags.indexOf(tag) < 0,
    )

const staticUserItems = [
    'Zabel Patel',
    'Yakel Jacobsen',
    'Zettler Karlsen',
    'Zobel Reid',
    'Zander Johnsen',
    'Yaddow Harris',
    'Yoder Eriksson',
    'Zachman Jansson',
    'Zabriskie Andreassen',
    'Zoellers Lewis',
    'Yelton Martinez',
    'Yeskey Pettersen',
    'Zerbe Persson',
    'Zillgitt Hughes',
    'Zepp Larsen',
    'Yoder Martinez',
    'Zeisler Pettersen',
    'Zacherl Watson',
    'Youst Robinson',
    'Zavelsky Stewart',
    'Zolnowski Jansson',
    'Youst Paterson',
    'Zampogna Jonsson',
    'Zopf Carlsson',
    'Yeldell Hall',
    'Zuehlke Thomson',
    'Youard Olofsson',
    'Zug Jones',
    'Zeiser Johansson',
    'Zeisler Andreassen',
    'Yaudes Jones',
    'Zappe Roberts',
    'Zielinski Walker',
    'Zufeldt Clark',
    'Zachary Watson',
    'Zolnierz Johansen',
    'Yoes Larsson',
    'Zollicoffer Martinez',
    'Zolleis Johannessen',
    'Zielinski Petersson',
    'Younts Kristiansen',
    'Zarley Jansson',
    'Youngblood Thomas',
    'Zolnierz Gustafsson',
    'Zeiser Pettersson',
    'Zuczek Thomas',
    'Zimmermann Andreassen',
    'Zellner Martin',
    'Zolnierz Nilsson',
    'Zeitler Andersson',
    'Zenichowski Karlsen',
    'Zoellers Jones',
    'Zolleis Gustafsson',
    'Zopf Andersson',
    'Zamastil Thomas',
    'Yeargin Pedersen',
    'Zerkey Robertson',
    'Yeaton Edwards',
    'Ziaja Williams',
    'Zastrow Eriksen',
].map(text => ({
    id: text.replace(/\W/g, '').toLocaleLowerCase(),
    text,
    title: text,
    accept: acceptUser,
}))

const userItems = (matchedText, component) =>
    staticUserItems.filter(
        user =>
            user.id.indexOf(matchedText) >= 0 &&
            component.assignees.indexOf(user) < 0,
    )

const staticPriorityItems = [
    { id: 'high', text: 'High', accept: acceptPriority },
    { id: 'medium', text: 'Medium', accept: acceptPriority },
    { id: 'low', text: 'Low', accept: acceptPriority },
]

const priorityItems = matchedText =>
    filterItems(staticPriorityItems, matchedText)

const progressItems = matchedText => {
    const progress = Math.min(100, Math.max(0, matchedText | 0))
    return [
        {
            id: '',
            text: `${progress}%`,
            accept(autocomplete, component) {
                component.progress = progress
                return ''
            },
        },
    ]
}

const estimatedTimeItems = matchedText => {
    const estimateMatch = /^(\d+)([dh]?)$/.exec(matchedText)
    let estimatedTime = 0
    if (estimateMatch) {
        const value = estimateMatch[1] | 0
        const unit = estimateMatch[2]
        estimatedTime = unit === 'd' ? value * 8 : value
    }

    const days = (estimatedTime / 8) | 0
    const hours = estimatedTime % 8
    const text =
        days > 0 && hours > 0
            ? `${days} days and ${hours} hours`
            : days > 0
            ? `${days} days`
            : `${hours} hours`

    return [
        {
            id: '',
            text,
            accept(autocomplete, component) {
                component.estimatedTime = text
                return ''
            },
        },
    ]
}

const staticDateItems = {
    startDate: [
        {
            id: 'today',
            text: 'Today',
            accept(autocomplete, component) {
                component.startDate = today()
                return ''
            },
        },
        {
            id: 'tomorrow',
            text: 'Tomorrow',
            accept(autocomplete, component) {
                component.startDate = tomorrow()
                return ''
            },
        },
        {
            id: 'nextweek',
            text: 'Next Week',
            accept(autocomplete, component) {
                component.startDate = nextWeek()
                return ''
            },
        },
    ],
    dueDate: [
        {
            id: 'today',
            text: 'Today',
            accept(autocomplete, component) {
                component.dueDate = today()
                return ''
            },
        },
        {
            id: 'tomorrow',
            text: 'Tomorrow',
            accept(autocomplete, component) {
                component.dueDate = tomorrow()
                return ''
            },
        },
        {
            id: 'nextweek',
            text: 'Next Week',
            accept(autocomplete, component) {
                component.dueDate = nextWeek()
                return ''
            },
        },
    ],
}

const dateItems = propertyName => matchedText => {
    const dateMatch = /^(\d{1,2})(?:\/(\d{0,2})(?:\/(\d{0,4}))?)?$/.exec(
        matchedText,
    )
    const now = new Date()

    if (dateMatch) {
        const day = dateMatch[1] | 0
        const month = dateMatch[2] ? (dateMatch[2] | 0) - 1 : now.getMonth()
        const year = dateMatch[3] ? dateMatch[3] | 0 : now.getFullYear()
        const date = new Date(year, month, day)
        return [
            {
                id: '',
                text: date.toDateString(),
                accept(autocomplete, component) {
                    component[propertyName] = date
                    return ''
                },
            },
        ]
    } else {
        return filterItems(staticDateItems[propertyName], matchedText)
    }
}

const staticCommandItems = [
    {
        id: 'description',
        text: 'Description',
        accept(_autocomplete, component) {
            component.editDescription()
            return ''
        },
    },
    {
        id: 'priority:',
        text: 'Priority',
        accept: acceptParentCommand('/Priority:'),
        items: priorityItems,
    },
    {
        id: 'progress:',
        text: 'Progress',
        accept: acceptParentCommand('/Progress:'),
        items: progressItems,
    },
    {
        id: 'estimatedtime:',
        text: 'Estimated Time',
        accept: acceptParentCommand('/EstimatedTime:'),
        items: estimatedTimeItems,
    },
    {
        id: 'startdate:',
        text: 'Start Date',
        accept: acceptParentCommand('/StartDate:'),
        items: dateItems('startDate'),
    },
    {
        id: 'duedate:',
        text: 'Due Date',
        accept: acceptParentCommand('/DueDate:'),
        items: dateItems('dueDate'),
    },
    {
        id: 'assign:',
        text: 'Assign',
        accept: acceptParentCommand('/Assign:'),
        items: userItems,
    },
    {
        id: 'tag:',
        text: 'Tag',
        accept: acceptParentCommand('/Tag:'),
        items: tagItems,
    },
]

const commandItems = matchedText => filterItems(staticCommandItems, matchedText)
