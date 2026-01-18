<template>
  <v-container>
    <h3>{{ $t('user.accountsetting') }}</h3>
  </v-container>
  <v-divider></v-divider>

  <!-- 显示当前密码强度 -->
  <v-container>
    <v-row align="center">
      <h1>🔐</h1>
      <v-col>
        <h4>{{ $t('accountsetting.strengthofpassword') }}</h4>
        <p>
          <strong>{{ currentPasswordStrength }}</strong>
        </p>
      </v-col>
      <v-col class="d-flex justify-end">
        <v-btn variant="outlined" @click="toggleChangePasswordForm">{{
          $t('accountsetting.changepassword')
        }}</v-btn>
      </v-col>
    </v-row>
  </v-container>

  <!-- 更改密码 -->
  <v-container v-if="showChangePasswordForm">
    <v-card>
      <div class="text-danger">{{ changePasswordSummary }}</div>
      <v-form ref="passwordForm" v-model="valid">
        <v-card-text>
          <v-text-field
            :label="$t('accountsetting.currentpassword')"
            type="password"
            v-model="currentPassword"
            :rules="[rules.required]"
          ></v-text-field>
          <v-text-field
            :label="$t('accountsetting.newpassword')"
            type="password"
            v-model="newPassword"
            :rules="[rules.required, rules.passwordStrength]"
          ></v-text-field>
          <v-text-field
            :label="$t('accountsetting.repeatnewpassword')"
            type="password"
            v-model="newPasswordRepeat"
            :rules="[rules.required, rules.passwordMatch]"
          ></v-text-field>
          <!-- 显示新密码强度 -->
          <p>
            {{ $t('accountsetting.strengthofnewpassword') }}:
            <strong>{{ newPasswordStrength }}</strong>
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            :disabled="!valid || loading"
            @click="changePassword"
          >
            <v-progress-circular
              v-if="loading"
              indeterminate
              color="white"
              size="20"
            ></v-progress-circular>
            {{ $t('accountsetting.changepassword') }}
          </v-btn>
          <v-btn color="grey" @click="hideChangePasswordForm">{{
            $t('cancel')
          }}</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-container>
  <v-divider></v-divider>

  <!-- 更改邮箱 -->
  <v-container>
    <v-row align="center">
      <h1>✉️</h1>
      <v-col>
        <h4>{{ $t('accountsetting.currentemail') }}</h4>
        <p>
          {{
            userInfo.email == null
              ? $t('accountsetting.noemail')
              : userInfo.email
          }}
        </p>
      </v-col>
      <v-col class="d-flex justify-end">
        <v-btn
          class="ml-auto"
          variant="outlined"
          @click="toggleChangeEmailForm"
          >{{ $t('accountsetting.changenewemail') }}</v-btn
        >
      </v-col>
    </v-row>
  </v-container>
  <v-container v-if="showChangeEmailForm">
    <v-card>
      <div class="text-danger">{{ changeEmailSummary }}</div>
      <v-form ref="emailForm" v-model="valid">
        <v-card-text>
          <v-text-field
            :label="$t('accountsetting.newemail')"
            type="email"
            v-model="newEmail"
            :rules="[rules.required, rules.emailFormat]"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            :disabled="!valid || loading"
            @click="changeEmail"
          >
            <v-progress-circular
              v-if="loading"
              indeterminate
              color="white"
              size="20"
            ></v-progress-circular>
            {{ $t('accountsetting.changenewemail') }}
          </v-btn>
          <v-btn color="grey" @click="hideChangeEmailForm">{{
            $t('cancel')
          }}</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-container>

  <!-- 弹出消息窗口 -->
  <v-dialog v-model="showDialog" max-width="400">
    <v-card>
      <v-card-title class="headline">验证邮件已发送</v-card-title>
      <v-card-text>
        邮箱确认链接已发送，请检查您的邮箱！
        <br />
        没有收到邮件？
        <v-btn
          :color="!resendDisabled ? 'blue-darken-3' : ''"
          :variant="!resendDisabled ? 'outlined' : ''"
          :disabled="resendDisabled"
          @click="resendVerificationEmail"
        >
          {{ resendDisabled ? `重新发送 (${countdown}s)` : '重新发送' }}
        </v-btn>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="closeDialog">知道了</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-divider></v-divider>

  <!-- 更改手机号 -->
  <v-container>
    <v-row align="center">
      <h1>📱</h1>
      <v-col>
        <h4>{{ $t('accountsetting.currentphone') }}</h4>
        <p>
          {{
            userInfo.phoneNumber === null
              ? $t('accountsetting.nophone')
              : userInfo.phoneNumber
          }}
        </p>
      </v-col>
      <v-btn
        class="ml-auto"
        variant="outlined"
        @click="toggleChangePhoneNumberForm"
        >{{ $t('accountsetting.changephone') }}</v-btn
      >
    </v-row>
  </v-container>
  <v-container v-if="showChangePhoneNumberForm">
    <v-card>
      <div class="text-danger">{{ changePhoneNumberSummary }}</div>
      <v-form ref="phoneForm" v-model="valid">
        <v-card-text>
          <v-row>
            <v-col cols="4">
              <v-select
                v-model="selectedCountryCode"
                :items="countryCodes"
                item-text="title"
                item-value="value"
                :label="$t('accountsetting.areacode')"
                outlined
              >
              </v-select>
            </v-col>
            <v-col cols="8">
              <v-text-field
                :label="$t('accountsetting.phonenumber')"
                type="tel"
                v-model="newPhoneNumber"
                :rules="[rules.required, rules.phoneFormat]"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            :disabled="!valid || loading"
            @click="changePhoneNumber"
          >
            <v-progress-circular
              v-if="loading"
              indeterminate
              color="white"
              size="20"
            ></v-progress-circular>
            {{ $t('accountsetting.changephone') }}
          </v-btn>
          <v-btn color="grey" @click="hideChangePhoneNumberForm">{{
            $t('cancel')
          }}</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-container>
  <v-divider></v-divider>

  <!-- 绑定微信 -->
  <v-container>
    <v-row align="center">
      <svg
        height="64px"
        style="enable-background: new 0 0 512 512"
        version="1.1"
        viewBox="0 0 512 512"
        width="64px"
        xml:space="preserve"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        <g id="_x33_71-wechat">
          <g>
            <g>
              <path
                d="M342.248,169.517c8.712,0,17.221,0.724,25.616,1.759C352.687,104.625,282.682,54.21,198.503,54.21     c-95.28,0-172.502,64.541-172.502,144.134c0,45.889,25.819,86.602,65.866,112.945l-22.742,45.605l61.953-26.608     c13.285,4.731,27.09,8.627,41.835,10.44c-2.015-8.796-3.16-17.813-3.16-27.068C169.753,234.178,247.115,169.517,342.248,169.517z      M256.003,119.066c11.905,0,21.56,9.685,21.56,21.623c0,11.942-9.654,21.62-21.56,21.62c-11.912,0-21.563-9.678-21.563-21.62     C234.44,128.75,244.091,119.066,256.003,119.066z M141.001,162.309c-11.907,0-21.562-9.678-21.562-21.62     c0-11.938,9.656-21.623,21.562-21.623s21.563,9.685,21.563,21.623C162.563,152.631,152.906,162.309,141.001,162.309z"
                style="fill: #51c332"
              />
              <path
                d="M485.999,313.656c0-63.684-64.376-115.312-143.751-115.312     c-79.378,0-143.745,51.628-143.745,115.312c0,63.679,64.367,115.308,143.745,115.308c13.054,0,25.471-1.845,37.519-4.465     l77.483,33.291l-26.798-53.701C464.035,382.983,485.999,350.527,485.999,313.656z M299.125,306.448     c-11.906,0-21.563-9.681-21.563-21.625c0-11.938,9.656-21.616,21.563-21.616c11.91,0,21.561,9.682,21.561,21.616     C320.686,296.768,311.033,306.448,299.125,306.448z M385.373,306.448c-11.912,0-21.561-9.681-21.561-21.625     c0-11.938,9.648-21.616,21.561-21.616c11.911,0,21.563,9.682,21.563,21.616C406.936,296.768,397.284,306.448,385.373,306.448z"
                style="fill: #51c332"
              />
            </g>
          </g>
        </g>
        <g id="Layer_1" />
      </svg>
      <v-col>
        <h4>{{ $t('accountsetting.currentwechat') }}</h4>
        <p>
          {{
            userInfo.weChatOpenId
              ? $t('accountsetting.bound')
              : $t('accountsetting.nowechat')
          }}
        </p>
      </v-col>
      <v-btn class="ml-auto" variant="outlined" @click="bindWeChat">{{
        $t('accountsetting.bindwechat')
      }}</v-btn>
    </v-row>
  </v-container>
  <v-divider></v-divider>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { apiClient } from '@/api' // 根据api.js的实际路径进行调整
import countryCodes from '@/assets/data/countryCodes.json' // 根据实际路径进行调整

export default {
  data() {
    return {
      showChangePasswordForm: false,
      showChangeEmailForm: false,
      showChangePhoneNumberForm: false,
      currentPassword: '',
      newPassword: '',
      newPasswordRepeat: '',
      newEmail: '',
      // emailVerificationSent: false, // 邮箱验证邮件发送状态
      newPhoneNumber: '',
      selectedCountryCode: '', // 默认区号
      countryCodes,
      valid: false,
      loading: false,
      showDialog: false, // 控制dialog显示
      resendDisabled: true, // 控制重新发送按钮
      countdown: 30, // 倒计时初始值 30 秒
      countdownTimer: null, // 存储倒计时的定时器
      rules: {
        required: (value) => !!value || this.$t('validation.required'),
        emailFormat: (value) =>
          /.+@.+\..+/.test(value) || this.$t('validation.incorrectemailFormat'),
        passwordStrength: (value) =>
          value.length >= 8 || this.$t('validation.passwordrequirement'),
        passwordMatch: () =>
          this.newPassword === this.newPasswordRepeat ||
          this.$t('validation.inconsistentpassword'),
        phoneFormat: (value) =>
          /^\d{10,15}$/.test(value) ||
          this.$t('validation.incorrectphoneFormat'),
      },
      changePasswordSummary: '',
      changeEmailSummary: '',
      changePhoneNumberSummary: '',
      fetchedPasswordStrength: '', // 从API获取的当前密码强度
    }
  },
  computed: {
    ...mapState(['userInfo']),
    currentPasswordStrength() {
      if (this.fetchedPasswordStrength === '强') {
        return this.$t('strong')
      } else if (this.fetchedPasswordStrength === '中') {
        return this.$t('medium')
      } else if (this.fetchedPasswordStrength === '弱') {
        return this.$t('weak')
      }
      return this.$t('unknown')
    },
    newPasswordStrength() {
      const length = this.newPassword.length
      if (length >= 12) {
        return this.$t('strong')
      } else if (length >= 8) {
        return this.$t('medium')
      } else if (length > 0) {
        return this.$t('weak')
      }
      return this.$t('unknown')
    },
    cleanSelectedCountryCode() {
      return this.selectedCountryCode.split('-')[0]
    },
  },
  methods: {
    ...mapActions(['fetchUserInfo', 'updateUserInfo']),
    toggleChangePasswordForm() {
      this.showChangePasswordForm = !this.showChangePasswordForm
    },
    hideChangePasswordForm() {
      this.showChangePasswordForm = false
    },
    toggleChangeEmailForm() {
      this.showChangeEmailForm = !this.showChangeEmailForm
    },
    hideChangeEmailForm() {
      this.showChangeEmailForm = false
    },
    closeDialog() {
      this.showDialog = false
      this.hideChangeEmailForm()
    },
    async resendVerificationEmail() {
      this.loading = true
      try {
        await this.$apiClient.post('/users/Account/ResendVerificationEmail')
        this.startCountdown() // 重置倒计时
      } catch (error) {
        console.error(
          this.$t('accountsetting.emailvalidationresentfailedmsg'),
          error
        )
      } finally {
        this.loading = false
      }
    },
    toggleChangePhoneNumberForm() {
      this.showChangePhoneNumberForm = !this.showChangePhoneNumberForm
    },
    hideChangePhoneNumberForm() {
      this.showChangePhoneNumberForm = false
    },
    async fetchCurrentPasswordStrength() {
      // 假设 API 返回当前密码的强度
      const response = await apiClient.get('/users/Account/GetPasswordStrength')
      this.fetchedPasswordStrength = response.data.strength
    },
    // updateNewPasswordStrength() {
    // 使用简单的逻辑计算新密码强度，这里仅作示例，实际应用中可以使用更复杂的规则
    // const length = this.newPassword.length;
    // if (length >= 12) {
    //     this.newPasswordStrength = '强';
    // } else if (length >= 8) {
    //     this.newPasswordStrength = '中';
    // } else {
    //     this.newPasswordStrength = '弱';
    // }
    // },
    async changePassword() {
      if (this.$refs.passwordForm.validate()) {
        this.loading = true
        try {
          await apiClient.post('/users/Account/ChangePassword', {
            currentPassword: this.currentPassword,
            newPassword: this.newPassword,
          })

          alert(this.$t('accountsetting.changepasswordsuccessmsg'))
          this.hideChangePasswordForm()
          this.clearPasswordFields()
        } catch (error) {
          this.handleError(
            error,
            'changePasswordSummary',
            this.$t('accountsetting.changepasswordfailedmsg')
          )
        } finally {
          this.loading = false
        }
      }
    },
    handleError(error, summaryField, defaultMessage) {
      console.error(error)
      if (error.response && error.response.data) {
        this[summaryField] = error.response.data.error || defaultMessage
      } else {
        this[summaryField] = defaultMessage
      }
    },
    clearPasswordFields() {
      this.currentPassword = ''
      this.newPassword = ''
      this.newPasswordRepeat = ''
    },
    async changeEmail() {
      if (this.$refs.emailForm.validate()) {
        this.loading = true
        try {
          await apiClient.post('/users/Account/ChangeEmail', {
            newEmail: this.newEmail,
          })
          this.showDialog = true // 显示成功消息窗口
          this.startCountdown() // 开始倒计时
          // alert('邮箱确认链接已发送，请检查你的邮箱！');
          // this.hideChangeEmailForm();
        } catch (error) {
          this.handleError(error, 'changeEmailSummary', '更改邮箱失败')
        } finally {
          this.loading = false
        }
      }
    },
    async changePhoneNumber() {
      if (this.$refs.phoneForm.validate()) {
        this.loading = true
        try {
          const fullPhoneNumber = `${this.selectedCountryCode}${this.newPhoneNumber}`
          await apiClient.post('/users/Account/ChangePhoneNumber', {
            newPhoneNumber: fullPhoneNumber,
          })
          alert(this.$t('accountsetting.changephonesuccessmsg'))
          this.hideChangePhoneNumberForm()
        } catch (error) {
          this.handleError(
            error,
            'changePhoneNumberSummary',
            this.$t('accountsetting.changephonefailedmsg')
          )
        } finally {
          this.loading = false
        }
      }
    },
    async bindWeChat() {
      const weChatAppId = 'your-wechat-app-id'
      const redirectUri = encodeURIComponent(
        window.location.origin + '/wechat-callback'
      )
      const weChatAuthUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${weChatAppId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=bindWeChat#wechat_redirect`

      window.location.href = weChatAuthUrl
    },
    startCountdown() {
      this.resendDisabled = true
      this.countdown = 30 // 重置倒计时为 30 秒

      if (this.countdownTimer) clearInterval(this.countdownTimer) // 清除之前的定时器

      // 开始新的定时器
      this.countdownTimer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown -= 1
        } else {
          this.resendDisabled = false
          clearInterval(this.countdownTimer)
        }
      }, 1000)
    },
  },
  async mounted() {
    await this.fetchUserInfo()
    await this.fetchCurrentPasswordStrength() // 获取当前密码强度
  },
}
</script>

<style scoped>
/* Add any custom styles here */
</style>
