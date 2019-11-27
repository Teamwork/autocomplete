import { createEditorAdapter } from '@teamwork/autocomplete-editor-text'
import './input.css'

export function initEditor() {
    const node = document.getElementById('editor')
    const editor = document.createElement('input')
    const editorAdapter = createEditorAdapter(editor)
    editor.classList.add('editor')
    node.appendChild(editor)
    window.editor = editor
    window.editorAdapter = editorAdapter
    return editorAdapter
}
