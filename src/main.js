import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import axios from 'axios'

const baseURL = process.env.VUE_APP_API_URL || 'http://localhost:3000'

const axiosInstance = axios.create({
  baseURL
})

Vue.config.productionTip = false
Vue.$http = axiosInstance
Vue.prototype.$http = axiosInstance

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
