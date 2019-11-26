import './common'
import { initEditor } from './editor/textarea'
import { initAutocomplete } from './autocomplete'
import { initUI } from './ui/vue'

initUI(initAutocomplete(initEditor()))
