import 'codemirror/lib/codemirror.css'
import CodeMirror from 'codemirror'
import { createEditorAdapter } from '@teamwork/autocomplete-editor-codemirror'

const editor = CodeMirror(document.getElementById('codeMirror'), {
    lineWrapping: true,
})
const editorAdapter = createEditorAdapter(editor)

export { editorAdapter }
