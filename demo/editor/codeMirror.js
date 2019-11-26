import 'codemirror/lib/codemirror.css'
import './codeMirror.css'
import CodeMirror from 'codemirror'
import { createEditorAdapter } from '@teamwork/autocomplete-editor-codemirror'

export function initEditor() {
    const node = document.getElementById('editor')
    const options = { autofocus: true, lineWrapping: true }
    const editor = CodeMirror(node, options)
    const editorAdapter = createEditorAdapter(editor)
    window.editor = editor
    window.editorAdapter = editorAdapter
    return editorAdapter
}
