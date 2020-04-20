import { Editor, getCaretPosition } from '.'

// Just some sanity texting, as proper testing of `getCaretPosition`
// can be done only manually in a real browser.

// Mock the Range, as jsdom does not support layout.
const range = document.createRange()
const rect = {
    ...range.getBoundingClientRect(),
    bottom: 101,
    left: 102,
    right: 103,
    top: 104,
}
range.getBoundingClientRect = () => rect
document.createRange = () => range

describe.each(['textarea', 'input'])('%s', (elementName) => {
    test.each<[string, number]>([
        ['', -2],
        ['', -1],
        ['', 0],
        ['', 1],
        ['', 2],
        ['', 3],
        ['a', -2],
        ['a', -1],
        ['a', 0],
        ['a', 1],
        ['a', 2],
        ['a', 3],
        ['ab', -2],
        ['ab', -1],
        ['ab', 0],
        ['ab', 1],
        ['ab', 2],
        ['ab', 3],
        ['ab', 4],
    ])('content: %p offset: %d', (content, offset) => {
        const element = document.createElement(elementName) as Editor
        element.value = content
        expect(getCaretPosition(element, offset)).toStrictEqual({
            bottom: 101,
            left: 102,
            right: 103,
            top: 104,
        })
    })
})
