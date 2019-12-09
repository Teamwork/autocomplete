import './common'
import Vue from 'vue'
import { TwTask } from './task/TwTask'

Vue.config.productionTip = false
window.app = new Vue({
    name: 'App',
    el: '#app',
    components: { TwTask },
    render(createElement) {
        return createElement('TwTask')
    },
})
