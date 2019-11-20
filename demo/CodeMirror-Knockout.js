import './common'
import { initEditor } from './editor/codeMirror'
import { initAutocomplete } from './autocomplete'
import { initUI } from './ui/ko'

initUI(initAutocomplete(initEditor()))
