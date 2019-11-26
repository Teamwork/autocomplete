import './textarea.css'
import { createEditorAdapter } from '@teamwork/autocomplete-editor-text'

export function initEditor() {
    const node = document.getElementById('editor')
    const editor = document.createElement('textarea')
    const editorAdapter = createEditorAdapter(editor)
    editor.classList.add('editor')
    node.appendChild(editor)
    window.editor = editor
    window.editorAdapter = editorAdapter
    return editorAdapter
}
