import menuHtml from './menu.html'
import './menu.css'

export function initMenu() {
    document.body.insertAdjacentHTML('afterbegin', menuHtml)
}
