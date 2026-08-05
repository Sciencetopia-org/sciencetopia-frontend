<template>
  <v-dialog :model-value="modelValue" max-width="420" @update:model-value="updateModel">
    <v-card class="login-required-dialog">
      <v-card-title class="login-required-dialog__title">
        <v-icon class="login-required-dialog__icon" size="24">mdi-lock-outline</v-icon>
        <span>{{ title || $t('loginRequired.title') }}</span>
      </v-card-title>
      <v-card-text class="login-required-dialog__message">
        {{ message || $t('loginRequired.defaultMessage') }}
      </v-card-text>
      <v-card-actions class="login-required-dialog__actions">
        <v-spacer />
        <v-btn variant="text" @click="close">{{ $t('cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" @click="goToLogin">{{ $t('header.login') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'LoginRequiredDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '' },
    message: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  methods: {
    updateModel(value) {
      this.$emit('update:modelValue', value)
    },
    close() {
      this.$emit('update:modelValue', false)
    },
    goToLogin() {
      this.close()
      this.$router.push({ name: 'login' })
    },
  },
}
</script>

<style scoped>
.login-required-dialog {
  border-radius: 12px;
  background: #fbf8f2;
  border: 1px solid rgba(197, 159, 89, 0.28);
}

.login-required-dialog__title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #304e75;
  font-size: 18px;
  font-weight: 700;
  padding-bottom: 8px;
}

.login-required-dialog__icon {
  color: #aa1b1d;
}

.login-required-dialog__message {
  color: #4f5f73;
  line-height: 1.7;
  padding-top: 0;
}

.login-required-dialog__actions {
  padding: 8px 20px 18px;
}
</style>
