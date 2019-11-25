# @teamwork/autocomplete

An autocomplete module for all text editors and frameworks.

## Usage

This is just a trivial example using [CodeMirror](https://codemirror.net/) and [Vue](https://vuejs.org/), however, you can use any other editor and framework in a similar way - `@teamwork/autocomplete` supports a few out of the box and more can be implemented easily. Be sure to check the `./demo` folder for more exmples, which you can try at https://teamwork.github.io/autocomplete/index.html or by running `npm start`.

```javascript
import 'codemirror/lib/codemirror.css'
import CodeMirror from 'codemirror'
import Vue from 'vue'
import {
    createAutocomplete,
    createPatternHandler,
    createRegexPattern,
} from '@teamwork/autocomplete-core'
import { createEditorAdapter } from '@teamwork/autocomplete-editor-codemirror'
import { TwAutocomplete } from '@teamwork/autocomplete-ui-vue'

// Prepare the editor.
const node = document.getElementById('editor')
const editor = CodeMirror(node)
const editorAdapter = createEditorAdapter(editor)

// Define the pattern(s) to search for and how to load autocomplete items.
const mentionPatternHandler = createPatternHandler({
    patternBeforeCaret: createRegexPattern(/(?:^|\s)(@\w*)$/, 1),
    load(_autocomplete, match) {
        return loadUsers(match.substring(1))
    },
})
const autocomplete = createAutocomplete({
    editorAdapter,
    patternHandlers: [mentionPatternHandler],
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
