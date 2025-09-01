<template>
  <v-dialog v-model="inner" max-width="520">
    <v-card>
      <v-card-title>{{ $t('switchCohort.title') }}</v-card-title>
      <v-card-text>
        <v-radio-group v-model="mode">
          <v-radio :label="$t('switchCohort.migrate')" value="migrate" />
          <v-radio :label="$t('switchCohort.fresh')" value="fresh" />
        </v-radio-group>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="cancel">{{ $t('cancel') }}</v-btn>
        <v-btn color="primary" @click="confirm">{{ $t('confirm') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'SwitchCohortConfirmDialog',
  props: {
    modelValue: { type: Boolean, default: false },
  },
  data() {
    return { inner: this.modelValue, mode: 'migrate' }
  },
  watch: {
    modelValue(v) { this.inner = v },
    inner(v) { this.$emit('update:modelValue', v) },
  },
  methods: {
    cancel() { this.inner = false },
    confirm() { this.$emit('confirm', { migrateIfCompatible: this.mode === 'migrate' }); this.inner = false },
  },
}
</script>

<style scoped>
</style>

