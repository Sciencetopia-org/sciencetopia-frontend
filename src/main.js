/* Set up using Vue 3 */
import { createApp } from 'vue'
import store from './store';  // Import the store
import App from './App.vue'

/* import router */
import router from './router'

/* import custom css */ 
import './assets/css/site.css'

/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'

/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

/* import specific icons */
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { faSun } from '@fortawesome/free-solid-svg-icons'
import {faTrashCan} from '@fortawesome/free-solid-svg-icons';
import {faHeartCirclePlus} from '@fortawesome/free-solid-svg-icons';
import {faCircleNodes} from '@fortawesome/free-solid-svg-icons';
import {faShareNodes} from '@fortawesome/free-solid-svg-icons';
import {faArrowsRotate} from '@fortawesome/free-solid-svg-icons';

/* add icons to the library */
library.add(faSearch, faSun, faTrashCan, faHeartCirclePlus, faCircleNodes, faShareNodes, faArrowsRotate)

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css';

const vuetify = createVuetify({
  icons: {
    iconfont: 'mdi', // 默认值 - 只有在使用其他图标集时才需要更改
  },
  components,
  directives,
})

/* Create Vue app */
const app = createApp(App)

app.component('font-awesome-icon', FontAwesomeIcon)
app.use(router)
app.use(store)
app.use(vuetify)

app.mount('#app')