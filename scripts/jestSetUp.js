/**
 * Fixes `instanceof Error` in jest. The fix does not affect anything else -
 * not even `instanceof SomeSubClassOfError`.
 *
 * The problem is that jest runs tests in a separate vm (context).
 * Each vm has its own globals, for example Error. In some cases,
 * an object from a different vm enters the test vm. It has different
 * objects in the prototype chain, so `instanceof` does not work as expected.
 * See https://github.com/facebook/jest/issues/2549#issuecomment-423202304.
 */
Object.defineProperty(Error, Symbol.hasInstance, {
    value: function (value) {
        if (this === Error) {
            return Object.prototype.toString.call(value) === '[object Error]'
        } else {
            return Object.getPrototypeOf(Error)[Symbol.hasInstance].call(
                this,
                value,
            )
        }
    },
})

if (typeof document === 'object') {
    // `document.createRange` is required by CodeMirror but
    // not provided by jsdom.
    document.createRange = () => {
        return {
            getBoundingClientRect: () => ({
                bottom: 0,
                left: 0,
                right: 0,
                top: 0,
            }),
            getClientRects: () => [],
            setEnd: () => undefined,
            setStart: () => undefined,
        }
    }

    // `document.getSelection` is required by editor-contenteditable but
    // not provided by jsdom.
    class Selection {
        anchorNode = null
        anchorOffset = 0
        focusNode = null
        focusOffset = 0
        removeAllRanges() {
            this.anchorNode = null
            this.anchorOffset = 0
            this.focusNode = null
            this.focusOffset = 0
        }
        collapse(node, offset) {
            this.anchorNode = node
            this.anchorOffset = offset
            this.focusNode = node
            this.focusOffset = offset
        }
        extend(node, offset) {
            this.focusNode = node
            this.focusOffset = offset
        }
    }
    const selection = new Selection()
    document.getSelection = () => selection
}
