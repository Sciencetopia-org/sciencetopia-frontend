<template>
  <div class="join-group">
    <form @submit.prevent="joinGroup">
      <label>Group ID:</label>
      <input v-model="groupId" type="text" />
      <button type="submit">Join Group</button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      groupId: '',
    }
  },
  methods: {
    joinGroup() {
      // Logic to send join request to the backend
    },
  },
}
</script>
