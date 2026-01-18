<template>
  <v-container class="sponsorship-page py-5">
    <v-row class="text-center">
      <v-col>
        <h1>{{ $t('sponsor.title') }}</h1>
        <h1>❤️</h1>
        <p>{{ $t('sponsor.intro') }}</p>
      </v-col>
    </v-row>

    <v-row class="text-center mb-5">
      <v-col>
        <!-- <v-img src="../../assets/images/sponsorship.png" aspect-ratio="16/9" class="sponsorship-image" /> -->
      </v-col>
    </v-row>

    <v-row class="text-center">
      <v-col>
        <h2>{{ $t('sponsor.howToSupport') }}</h2>
        <p>{{ $t('sponsor.supportWays') }}</p>
      </v-col>
    </v-row>

    <v-row class="text-center">
      <v-col cols="12" md="4">
        <v-card class="sponsorship-card">
          <v-card-title>{{ $t('sponsor.wechat') }}</v-card-title>
          <v-card-text>
            <v-img
              src="../../assets/images/wechat_qr.png"
              aspect-ratio="1"
              class="qr-code"
            />
            <p>{{ $t('sponsor.scanToSupport') }}</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="sponsorship-card">
          <v-card-title>{{ $t('sponsor.alipay') }}</v-card-title>
          <v-card-text>
            <v-img
              src="../../assets/images/alipay_qr.png"
              aspect-ratio="1"
              class="qr-code"
            />
            <p>{{ $t('sponsor.scanToSupport') }}</p>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="sponsorship-card">
          <v-card-title>{{ $t('sponsor.paypal') }}</v-card-title>
          <v-card-text>
            <v-img
              src="../../assets/images/paypal_qr.png"
              aspect-ratio="1"
              class="qr-code"
            />
            <p>{{ $t('sponsor.scanToSupport') }}</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="text-center mt-5">
      <v-col>
        <h2>{{ $t('sponsor.thanksTitle') }}</h2>
        <p>{{ $t('sponsor.thanksText') }}</p>
      </v-col>
    </v-row>

    <v-row class="text-center mt-5">
      <v-col>
        <h2>{{ $t('sponsor.contact') }}</h2>
        <p>{{ $t('sponsor.contactPrompt') }}</p>
        <p>Email: support@sciencetopia.org</p>
        <p>{{ $t('sponsor.phone') }}: +123 456 7890</p>
      </v-col>
    </v-row>

    <v-row class="text-center mt-5">
      <v-col>
        <h2>{{ $t('sponsor.sponsors') }}</h2>
        <v-list>
          <v-list-item v-for="sponsor in sponsors" :key="sponsor.id">
            <v-list-item-content>
              <v-list-item-title>{{ sponsor.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ sponsor.message }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'SponsorShip',
}
</script>

<style scoped>
.sponsorship-page {
  padding-top: 20px;
}

.text-center {
  text-align: center;
}

.mb-5 {
  margin-bottom: 20px;
}

.mt-5 {
  margin-top: 20px;
}

.sponsorship-card {
  margin-bottom: 20px;
}

.qr-code {
  max-width: 150px;
  margin: 0 auto;
  display: block;
}
</style>
