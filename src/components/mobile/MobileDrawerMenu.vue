<template>
  <v-navigation-drawer
    :model-value="modelValue"
    temporary
    location="start"
    width="310"
    class="mobile-drawer-menu"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="mobile-drawer-menu__header">
      <img :src="logo" alt="Sciencetopia" class="mobile-drawer-menu__logo" />
      <div>
        <div class="mobile-drawer-menu__title">Sciencetopia</div>
        <div class="mobile-drawer-menu__subtitle">Mobile web</div>
      </div>
    </div>

    <v-list density="comfortable" nav>
      <v-list-item prepend-icon="mdi-magnify" :title="$t('header.search')" @click="$emit('search')" />
      <v-list-item prepend-icon="mdi-rss" :title="$t('header.trend')" :to="{ name: 'allFeeds' }" />
      <v-list-item prepend-icon="mdi-account-group" :title="$t('header.studygroup')" :to="{ name: 'studyGroupList' }" />
      <v-list-item prepend-icon="mdi-translate" :title="$t('header.languageSwitch')" @click="$emit('toggle-language')" />
    </v-list>

    <v-divider />

    <v-list density="comfortable" nav>
      <v-list-subheader>{{ $t('more') || 'More' }}</v-list-subheader>
      <v-list-item prepend-icon="mdi-information-outline" :title="$t('footer.about')" :to="{ path: '/about' }" />
      <v-list-item prepend-icon="mdi-email-outline" :title="$t('footer.contact')" :to="{ path: '/contact' }" />
      <v-list-item prepend-icon="mdi-hand-heart-outline" :title="$t('footer.donate')" :to="{ path: '/support' }" />
    </v-list>
  </v-navigation-drawer>
</template>

<script>
export default {
  name: 'MobileDrawerMenu',
  props: {
    modelValue: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'search', 'toggle-language'],
  data() {
    return {
      logo: require('@/assets/images/logo.png'),
    }
  },
}
</script>

<style scoped>
.mobile-drawer-menu {
  background: #fbf8f2 !important;
}

.mobile-drawer-menu__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px 12px;
}

.mobile-drawer-menu__logo {
  width: 44px;
  height: 44px;
  border-radius: 50%;
}

.mobile-drawer-menu__title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.mobile-drawer-menu__subtitle {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.56);
}
</style>
