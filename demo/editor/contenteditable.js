import './contenteditable.css'
import { createEditorAdapter } from '@teamwork/autocomplete-editor-contenteditable'

export function initEditor() {
    const node = document.getElementById('editor')
    const editor = document.createElement('div')
    const editorAdapter = createEditorAdapter(editor)
    editor.setAttribute('contenteditable', 'true')
    editor.classList.add('editor')
    node.appendChild(editor)
    window.editor = editor
    window.editorAdapter = editorAdapter
    return editorAdapter
}
