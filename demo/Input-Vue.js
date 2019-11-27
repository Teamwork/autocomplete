import './common'
import { initEditor } from './editor/input'
import { initAutocomplete } from './autocomplete'
import { initUI } from './ui/vue'

initUI(initAutocomplete(initEditor()))
