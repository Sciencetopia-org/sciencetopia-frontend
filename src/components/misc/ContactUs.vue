<template>
  <v-container class="contact-page py-5">
    <h1>{{ $t('contactPage.title') }}</h1>
    <v-spacer class="my-5"></v-spacer>
    <p>{{ $t('contactPage.intro') }}</p>
    <v-spacer class="my-5"></v-spacer>
    <p>{{ $t('contactPage.email') }}:</p>
    <p>
      {{ $t('contactPage.bilibili') }}：<a
        href="https://space.bilibili.com/3493268788612034"
        target="_blank"
        class="bilibili-url"
        >Sciencetopia</a
      >
    </p>
  </v-container>
</template>

<script>
export default {
  name: 'ContactUs',
}
</script>

<style scoped>
.contact-page {
  padding: 0 10%;
}

.bilibili-url {
  color: #3f51b5;
}

.bilibili-url:hover {
  text-decoration: underline;
}
</style>
