<template>
  <v-app>
    <v-main>
      <v-app-bar dark elevation="4">
        Conversor de vídeos
      </v-app-bar>
      <v-container>
        <router-view/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>

export default {
  name: 'App',

  data: () => ({
    //
  })
}
</script>
