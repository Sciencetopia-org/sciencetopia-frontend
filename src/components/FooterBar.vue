<template>
  <!-- <div style="background-color: #DFCBA4; position: absolute; top: 0vh; left: 0vw; width: 66vw; height: 6vh;"></div> -->
  <v-container>
    <v-row justify="center" align="center">
      <v-col cols="3">
        <v-btn class="Chinese-text-btn" variant="plain" :to="{ path: '/about' }" style="padding: 0; height: 100%">
          <img
            width="40"
            height="40"
            src="https://img.icons8.com/hatch/64/conference-call.png"
            alt="conference-call"
          />
          <v-spacer style="width: 10px"></v-spacer>
          {{ $t('footer.about') }}
        </v-btn>
      </v-col>
      <v-col cols="3">
        <v-btn class="Chinese-text-btn" variant="plain" :to="{ path: '/contact' }" style="padding: 0; height: 100%">
          <img
            width="36"
            height="36"
            src="https://img.icons8.com/pulsar-line/48/email.png"
            alt="email"
          />
          <v-spacer style="width: 10px"></v-spacer>
          {{ $t('footer.contact') }}
        </v-btn>
      </v-col>
      <v-col cols="3">
        <v-btn class="Chinese-text-btn" variant="plain" :to="{ path: '/support' }" style="padding: 0; height: 100%">
          <img
            width="40"
            height="40"
            src="https://img.icons8.com/ios/50/giving.png"
            alt="giving"
          />
          <v-spacer style="width: 10px"></v-spacer>
          {{ $t('footer.donate') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'FooterBar',
  data() {
    return {}
  },
  methods: {},
}
</script>
