import { Position } from '@teamwork/autocomplete-core/src'
import { WritableKeys } from 'ts-essentials'
import { Editor } from './text'

/**
 * Returns screen coordinates of a caret placed at the specified offset
 * within the content of the specified textarea or input[text] element.
 *
 * It works as follows:
 *
 * 1. Copy content and styles from the `textarea` or `input[text]` to a `div`.
 * 2. Set a Range instance at `offset` within the `div`.
 * 3. Return the range position obtained using `getBoundingClientRect`.
 *
 * @param element A textarea or input[text] element.
 * @param offset The character offset within `element.value`.
 * @returns Screen coordinates.
 */
export function getCaretPosition(element: Editor, offset: number): Position {
    // Content must have at least one character,
    // so we fall back to a zero-width space.
    const content = element.value || '\u200b'

    // We get the position of a character starting at `offset`,
    // as this handles line wrapping correctly.
    const startOffset = Math.max(0, Math.min(content.length, offset))
    const endOffset = Math.max(0, Math.min(content.length, startOffset + 1))

    const elementStyle = window.getComputedStyle(element)
    const elementPosition = element.getBoundingClientRect()
    const mirrorStyle = mirror.style

    // Set content.
    mirror.textContent = content

    // Copy styles.
    for (const styleName of styleNames) {
        mirrorStyle[styleName] = elementStyle[styleName]
    }

    // Apply overrides for input[text].
    if (element.tagName === 'INPUT') {
        mirrorStyle.whiteSpace = 'pre'
        mirrorStyle.overflow = 'hidden'
        mirrorStyle.overflowX = 'hidden'
        mirrorStyle.overflowY = 'hidden'
    }

    // Set position and size.
    mirrorStyle.position = 'fixed'
    mirrorStyle.boxSizing = 'border-box'
    mirrorStyle.top = elementPosition.top + 'px'
    mirrorStyle.left = elementPosition.left + 'px'
    mirrorStyle.width = elementPosition.width + 'px'
    mirrorStyle.height = elementPosition.height + 'px'

    // Get caret position.
    document.body.appendChild(mirror)
    mirror.scrollTop = element.scrollTop
    mirror.scrollLeft = element.scrollLeft
    const range = document.createRange()
    range.setStart(mirror.firstChild!, startOffset)
    range.setEnd(mirror.firstChild!, endOffset)
    const position = range.getBoundingClientRect()
    document.body.removeChild(mirror)

    return {
        bottom: position.bottom,
        left: position.left,
        right: position.right,
        top: position.top,
    }
}

const mirror = document.createElement('div')
const styleNames: WritableKeys<CSSStyleDeclaration>[] = [
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderTopStyle',
    'borderRightStyle',
    'borderBottomStyle',
    'borderLeftStyle',
    'direction',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'letterSpacing',
    'lineHeight',
    'outlineWidth',
    'overflow',
    'overflowX',
    'overflowY',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'textAlign',
    'textOverflow',
    'textTransform',
    'whiteSpace',
    'wordBreak',
    'wordWrap',
]
