<template>
  <v-card class="join-requests">
    <v-card-title>加入请求</v-card-title>
    <v-card-text>
      <v-simple-table class="full-width-table">
        <thead>
          <tr>
            <th>头像</th>
            <th>用户名</th>
            <th>请求日期</th>
            <th class="actions-column">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="request in requests" :key="request.id">
            <td>
              <v-btn icon="dots-vertical" size="40">
                <v-avatar size="35">
                  <img :src="request.avatarUrl" alt="用户头像">
                </v-avatar>
              </v-btn>
            </td>
            <td>{{ request.name }}</td>
            <td>{{ request.appliedOn }}</td>
            <td class="actions-column">
              <v-btn variant="text" color="primary" @click="approveRequest(request.id)">同意</v-btn>
              <v-btn variant="text" color="secondary" @click="rejectRequest(request.id)">拒绝</v-btn>
            </td>
          </tr>
        </tbody>
      </v-simple-table>
    </v-card-text>
  </v-card>
</template>

<script>
import { apiClient } from '@/api';

export default {
  props: {
    groupId: String
  },
  data() {
    return {
      requests: []
    };
  },
  async mounted() {
    const response = await apiClient.get(`/StudyGroup/GetJoinRequests/${this.groupId}`);
    this.requests = response.data;
  },
  methods: {
    async approveRequest(requestId) {
      await apiClient.post(`/StudyGroupManage/ApproveJoinRequest/${this.groupId}`, { requestId });
      this.fetchRequests();
    },
    async rejectRequest(requestId) {
      await apiClient.post(`/StudyGroupManage/RejectJoinRequest/${this.groupId}`, { requestId });
      this.fetchRequests();
    },
    async fetchRequests() {
      const response = await apiClient.get(`/StudyGroup/GetJoinRequests/${this.groupId}`);
      this.requests = response.data;
    }
  }
};
</script>

<style scoped>
@import "../../assets/css/table.css";

.join-requests {
  width: 100%;
  max-width: 1200px;
  margin: auto;
}
</style>