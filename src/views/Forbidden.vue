<template>
  <v-container class="d-flex align-center justify-center" style="height: 60vh;">
    <div class="text-center">
      <h1>403</h1>
      <p>你没有访问该页面的权限。</p>
      <p><em>如需访问，请联系管理员。</em></p>
      <v-btn color="primary" class="mt-2" @click="$router.back()">返回</v-btn>
    </div>
  </v-container>
  
</template>

<script>
export default { name: 'Forbidden' }
</script>

<style scoped>
h1 { font-size: 64px; margin-bottom: 8px; }
</style>

