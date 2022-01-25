import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000',
  headers: { common: { 'Access-Control-Allow-Origin': '*' } }
})

Vue.config.productionTip = false
Reflect.defineProperty(Vue, '$http', { value: axiosInstance })

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
