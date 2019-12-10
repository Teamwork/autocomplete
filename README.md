# @teamwork/autocomplete

An autocomplete system designed to support virtually any text editor and UI framework with minimal effort.

## Usage

This is just a trivial example using [CodeMirror](https://codemirror.net/) and [Vue](https://vuejs.org/), however, you can use any other editor and framework in a similar way - `@teamwork/autocomplete` supports a few out of the box and more can be implemented easily.

Keep in mind that autocomplete component styles are not included - you can use `./demo/autocomplete/style.css` as an inspiration when defining your own.

```javascript
import 'codemirror/lib/codemirror.css'
import CodeMirror from 'codemirror'
import Vue from 'vue'
import { createAutocomplete } from '@teamwork/autocomplete-core'
import { createEditorAdapter } from '@teamwork/autocomplete-editor-codemirror'
import { TwAutocomplete } from '@teamwork/autocomplete-ui-vue'

// Prepare the editor.
const node = document.getElementById('editor')
const editor = CodeMirror(node)
const editorAdapter = createEditorAdapter(editor)

// Configure autocomplete.
const autocomplete = createAutocomplete({
    editorAdapter,
    match(textBeforeCaret, textAfterCaret) {
        // Match `@\w*` before caret surrounded by white space or end of string.
        const match = /(?:^|\s)(@\w*)$/.exec(textBeforeCaret)
        if (match && /^($|\s)/.test(textAfterCaret)) {
            return [match[1].length, 0]
        } else {
            return [-1, -1]
        }
    },
    load(matchedText) {
        // Load users filtered by the matched text.
        return loadUsers(match.substring(1))
    },
    accept(user) {
        // Autocomplete with the user's first and last names.
        return `${user.firstName} ${user.lastName}`
    },
})

// Display an autocomplete list as needed.
const vm = new Vue({
    name: 'App',
    el: '#autocomplete',
    components: { TwAutocomplete },
    mounted() {
        this.$refs.autocomplete.init(autocomplete)
    },
    render(createElement) {
        return createElement('TwAutocomplete', { ref: 'autocomplete' })
    },
})
```

## Demo and API Docs

Visit https://teamwork.github.io/autocomplete/ or run `npm start` locally.

## Notable npm Scripts

-   `npm start`: Compiles TypeScript in "watch" mode, runs the demo app with life reload and serves static API docs.
-   `npm test`: Runs all unit tests.
-   `npm run build`: Builds and tests all code. It runs automatically on commit.
-   `npm run docs`: Generates the demo app and API docs in the `./docs` folder for [GitHub Pages](https://pages.github.com/).
-   `npm run gh-pages`: Builds API docs and demo, and then pushes them to gh-pages branch.
