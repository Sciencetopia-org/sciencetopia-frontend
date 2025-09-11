<template>
  <v-container class="d-flex align-center justify-center personal-information-container">
    <!-- Display Mode -->
    <div v-if="!isEditMode">
      <v-container>
        <div align="center">
          <v-btn :disabled="true" icon="dots-vertical" class="default-avatar profile-avatar" size="200">
            <v-avatar size="196">
              <img :src="avatarUrl" alt="Avatar" />
            </v-avatar>
          </v-btn>
        </div>
        <v-card class="st-card profile-card">
          <div>
            <div class="profile-title">
              <v-card-title class="username">{{
                userInfo.userName
              }}</v-card-title>
              <!-- Show edit button only if it's the current user's profile -->
              <v-btn v-if="isCurrentUser" icon variant="text" @click="enterEditMode">✏️</v-btn>
              <slot v-if="!isCurrentUser"></slot>
            </div>
            <div class="profile-text">
              <p>
                {{ $t('userprofile.gender') }}{{ $t(':') }}{{ userInfo.gender }}
              </p>
              <p>
                {{ $t('userprofile.dateofbirth') }}{{ $t(':')
                }}{{ userInfo.formattedBirthDate }}
              </p>
              <p>
                {{ $t('userprofile.aboutme') }}{{ $t(':')
                }}{{ userInfo.selfIntroduction }}
              </p>
              <v-divider class="border-opacity-0"></v-divider>
              <p>
                {{
                  $t('userprofile.completedStudyPlanCountmsg', {
                    completedStudyPlanCount,
                  })
                }}
              </p>
              <p>
                {{
                  $t('userprofile.contributeNodemsg', {
                    contributedNodeCount,
                    contributedLinkCount,
                  })
                }}
              </p>
            </div>
          </div>
        </v-card>
      </v-container>
    </div>

    <!-- Edit Mode -->
    <v-form v-else ref="form" v-model="valid">
      <v-card class="st-card">
        <v-card-text>
          <v-container>
            <v-row>
              <v-col>
                <v-avatar size="120" class="mb-2">
                  <img :src="avatarUrl" alt="Avatar" />
                </v-avatar>
                <v-btn icon variant="text" @click="openFilePicker">📷</v-btn>
                <input type="file" ref="fileInput" hidden @change="onFileSelected" accept="image/*" />
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-text-field variant="outlined" :label="$t('username')" v-model="userInfo.userName"
                  :rules="usernameRules"></v-text-field>
                <v-select variant="outlined" :label="$t('userprofile.gender')" v-model="userInfo.gender"
                  :items="['Male', 'Female', 'Others', 'Secret']"></v-select>
                <!-- 日期（生日）选择：点击文本框才弹出，悬浮层，不占位 -->
                <v-menu v-model="menu" :close-on-content-click="false" location="bottom start" :offset="[0, 8]">
                  <template #activator="{ props }">
                    <v-text-field variant="outlined" v-bind="props" :label="$t('userprofile.dateofbirth')"
                      prepend-icon="mdi-calendar" readonly :model-value="userInfo.formattedBirthDate || ''" />
                  </template>

                  <v-date-picker
                    :model-value="userInfo.formattedBirthDate ? new Date(userInfo.formattedBirthDate) : null"
                    :max="new Date()"
                    show-adjacent-months
                    scrollable
                    @update:modelValue="onPickBirthDate"
                  />
                </v-menu>
                <v-textarea variant="outlined" :label="$t('userprofile.aboutme')"
                  v-model="userInfo.selfIntroduction"></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" :disabled="!valid" @click="updateUserInfo({ formRef: $refs.form })">{{
            $t('save')
          }}</v-btn>
          <v-btn color="grey" @click="exitEditMode">{{ $t('cancel') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-container>
</template>

<script>
import { apiClient } from '@/api'
import { mapState, mapActions } from 'vuex'
import { normalizeDateString } from '@/utils/date'

export default {
  name: 'PersonalInformation',
  props: {
    userId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      valid: true,
      isEditMode: false,
      usernameRules: [
        (v) => !!v || 'Username is required',
        (v) =>
          (v && v.length <= 20) || 'Username must be less than 20 characters',
      ],
      menu: false,
      completedStudyPlanCount: 0,
      contributedNodeCount: 0,
      contributedLinkCount: 0,
      userInfo: {}, // Holds user info when fetching for other users
    }
  },
  computed: {
    ...mapState({
      currentUserInfo: (state) => state.userInfo, // Vuex store for current user
      currentUserId: (state) => state.currentUserID, // Vuex store for current user's ID
    }),
    avatarUrl() {
      return this.isCurrentUser
        ? this.$store.state.avatarUrl
        : this.userInfo.avatarUrl
    },
    isCurrentUser() {
      // Check if the userId passed as a prop matches the current authenticated user
      return this.userId === this.currentUserId
    },
    today() {
      return new Date().toISOString().slice(0, 10) // 限制生日不超过今天
    },
  },
  methods: {
    ...mapActions(['fetchUserInfo', 'updateUserInfo']),
    onPickBirthDate(val) {
      // v-date-picker(v3) 通常已给 'YYYY-MM-DD'，这里再保险规整一下：
      this.userInfo.formattedBirthDate = normalizeDateString
        ? normalizeDateString(val)
        : (typeof val === 'string' ? val.slice(0, 10) : '')
      this.menu = false
    },
    async fetchUserStatistics() {
      try {
        const userId = this.isCurrentUser ? this.currentUserId : this.userId
        const response = await apiClient.get(`/users/${userId}/statistics`)
        this.completedStudyPlanCount = response.data.completedStudyPlanCount
        this.contributedNodeCount = response.data.contributedNodeCount
        this.contributedLinkCount = response.data.contributedLinkCount
      } catch (error) {
        console.error('Error fetching user statistics:', error)
      }
    },
    async fetchOtherUserInfo() {
      try {
        const response = await apiClient.get(
          `/AllUsers/GetUserInfoById/${this.userId}`
        )
        const avatarResponse = await apiClient.get(
          `/AllUsers/GetUserAvatarById/${this.userId}`
        )
        this.userInfo = response.data // Set the userInfo to the fetched data for another user
        this.userInfo.avatarUrl = avatarResponse.data.avatarUrl
      } catch (error) {
        console.error('Error fetching user information:', error)
      }
    },
    enterEditMode() {
      if (this.isCurrentUser) {
        this.isEditMode = true
      }
    },
    exitEditMode() {
      this.isEditMode = false
    },
    openFilePicker() {
      this.$refs.fileInput.click()
    },
    onFileSelected(event) {
      const file = event.target.files[0]
      if (file) {
        this.selectedFile = file
        this.uploadAvatar()
      }
    },
    async uploadAvatar() {
      if (!this.selectedFile) {
        this.$emit('show-snackbar', {
          text: 'Please select a file to upload.',
          color: 'error',
        })
        return
      }

      const formData = new FormData()
      formData.append('avatarFile', this.selectedFile)

      this.loading = true // Start loading

      try {
        const response = await apiClient.post(
          '/users/UserInformation/UploadAvatar',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )
        this.loading = false // End loading

        if (response.status === 200) {
          this.$emit('show-snackbar', {
            text: 'Avatar uploaded successfully',
            color: 'success',
          })
          this.avatarUrl = response.data.AvatarUrl // Update avatar URL
        }
      } catch (error) {
        console.error('Error uploading avatar:', error)
        this.loading = false // End loading
        this.$emit('show-snackbar', {
          text: 'Error uploading avatar.',
          color: 'error',
        })
      }
    },
  },
  async mounted() {
    if (this.isCurrentUser) {
      await this.fetchUserInfo() // Use Vuex to fetch the current user's info
      this.userInfo = this.currentUserInfo // Set the userInfo to the current user's info
    } else {
      await this.fetchOtherUserInfo() // Fetch another user's info via API
    }
    await this.fetchUserStatistics() // Fetch the statistics (common for both cases)

    // 如果后端返回的是 ISO（带 T），初始化时裁成 'YYYY-MM-DD'，避免显示跨天
    if (this.userInfo && this.userInfo.formattedBirthDate) {
      this.userInfo.formattedBirthDate = normalizeDateString
        ? normalizeDateString(this.userInfo.formattedBirthDate)
        : (String(this.userInfo.formattedBirthDate).slice(0, 10))
    }
  },
}
</script>

<style scoped>
.profile-card {
  /* width: 12vw; */
  padding: 20px;
  padding-top: 100px;
  margin-top: -90px;
  padding-bottom: 40px;
}

.profile-title {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-avatar-icon {
  position: relative;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
}

.profile-avatar {
  position: relative;
  z-index: 100;
}

.username {
  font-size: 32px;
  color: #1c2b42;
  font-weight: bold;
}

.personal-information-container {
  padding: 0;
  margin: 0;
}

.profile-text {
  font-size: 18px;
  padding: 20px;
}
</style>
