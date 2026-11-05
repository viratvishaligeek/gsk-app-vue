import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import api from './plugins/axios'

import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/css/gsk-mobile.css'
import './assets/css/gsk-arcade-v4.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Toast)

app.config.globalProperties.$axios = api

app.mount('#app')
