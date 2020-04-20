import './common'
import { initEditor } from './editor/contenteditable'
import { initAutocomplete } from './autocomplete'
import { initUI } from './ui/vue'

initUI(initAutocomplete(initEditor()))
