<template>
  <div class="background-decor">
    <div class="background-decor-line1"></div>
    <div class="background-decor-line2"></div>
    <div class="background-decor-line3"></div>
    <div class="background-decor-line4"></div>
    <div class="background-decor-line5"></div>
    <div class="background-decor-circle"></div>
    <div class="background-decor-box1"></div>
    <div class="background-decor-box2"></div>
    <div class="background-decor-box3"></div>
    <div class="background-decor-box4"></div>
  </div>
  <v-container class="register-container d-flex align-center justify-center">
    <v-row no-gutters="true">
      <v-col cols="6" class="auth-visual-col d-flex justify-center">
        <!-- Left card -->
        <v-card class="left-card">
          <div class="logo-front">
            <img src="../../assets/images/logo.png" class="logo-bold" />
          </div>
          <div class="welcome-text-container welcome-container-position">
            <h2 class="welcome-text text-white text-center">
              {{ $t('login.welcome') }}
            </h2>
          </div>
          <div
            class="welcome-text-container-nonmask welcome-container-position"
          >
            <h2 class="welcome-text text-center">{{ $t('login.welcome') }}</h2>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6" class="auth-form-col d-flex justify-center">
        <!-- Right card -->
        <v-card class="right-card">
          <v-card-title>
            <h2 class="text-center">{{ $t('register.title') }}</h2>
          </v-card-title>
          <v-card-text>
            <v-alert
              v-if="validationSummary"
              type="error"
              dismissible
              class="mb-4"
            >
              {{ validationSummary }}
            </v-alert>
            <v-form @submit.prevent="handleSubmit" ref="form">
              <v-text-field
                v-model="userName"
                :label="$t('register.username')"
                variant="filled"
                required
                class="mb-4"
              ></v-text-field>
              <v-text-field
                v-model="email"
                :label="$t('register.email')"
                variant="filled"
                type="email"
                required
                class="mb-4"
              ></v-text-field>
              <v-text-field
                v-model="password"
                :label="$t('register.password')"
                variant="filled"
                type="password"
                required
                class="mb-4"
              ></v-text-field>
              <v-text-field
                v-model="confirmPassword"
                :label="$t('register.confirmPassword')"
                variant="filled"
                type="password"
                required
                class="mb-4"
              ></v-text-field>
              <v-checkbox
                v-model="acceptedTerms"
                :error-messages="termsError"
                class="terms-checkbox"
                density="compact"
                hide-details="auto"
              >
                <template #label>
                  <span class="terms-label">
                    {{ $t('authAgreement.prefix') }}
                    <RouterLink
                      class="terms-link"
                      :to="{ name: 'terms' }"
                      target="_blank"
                      @click.stop
                    >
                      {{ $t('authAgreement.terms') }}
                    </RouterLink>
                    {{ $t('authAgreement.suffix') }}
                  </span>
                </template>
              </v-checkbox>

              <!-- Register button -->
              <button class="register-button" type="submit" :disabled="isSubmitting" :aria-busy="isSubmitting">
                <div class="register-arrow"></div>
                <div class="register-whitebox"></div>
                <span class="register-text">{{ isSubmitting ? $t('loading') : $t('register.register') }}</span>
              </button>
            </v-form>
          </v-card-text>
          <v-card-text class="to-login-text">
            <p class="text-center">
              {{ $t('register.alreadyHaveAccount') }}
              <span @click="navigateToLogin" class="interactive-text">
                {{ $t('register.clickHere') }}
              </span>
            </p>
          </v-card-text>
        </v-card>
      </v-col>
      <div class="horizontal-line"></div>
    </v-row>
  </v-container>
</template>

<script>
import { apiClient } from '@/api'

export default {
  name: 'ReGister',
  data() {
    return {
      userName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
      validationSummary: '',
      termsError: '',
      isSubmitting: false,
    }
  },
  methods: {
    getErrorMessage(error) {
      const data = error?.response?.data
      if (!data) {
        return error?.message || this.$t('register.failed')
      }

      if (typeof data === 'string') {
        return data
      }

      if (data.error || data.message || data.title) {
        return data.error || data.message || data.title
      }

      if (Array.isArray(data.errors)) {
        return data.errors.join('\n')
      }

      if (data.errors && typeof data.errors === 'object') {
        return Object.values(data.errors).flat().join('\n')
      }

      const modelStateErrors = Object.values(data).flat().filter(Boolean)
      return modelStateErrors.length
        ? modelStateErrors.join('\n')
        : this.$t('register.failed')
    },
    async handleSubmit() {
      if (this.isSubmitting) return

      if (!this.acceptedTerms) {
        this.termsError = this.$t('authAgreement.required')
        this.validationSummary = this.$t('authAgreement.required')
        return
      }

      this.termsError = ''
      this.validationSummary = ''

      if (this.password !== this.confirmPassword) {
        this.validationSummary = this.$t('register.passwordMismatch')
        return
      }

      this.isSubmitting = true
      try {
        const response = await apiClient.post('/users/Account/Register', {
          userName: this.userName,
          email: this.email,
          password: this.password,
        })

        if (response.data.success) {
          this.$router.push({ name: 'login' })
        } else {
          this.validationSummary =
            response.data.error || this.$t('register.failed')
        }
      } catch (error) {
        this.validationSummary = this.getErrorMessage(error)
      } finally {
        this.isSubmitting = false
      }
    },
    navigateToLogin() {
      this.$router.push({ name: 'login' })
    },
  },
}
</script>

<style scoped>
@import '../../assets/css/login-background.css';

.logo {
  height: 68vh;
  width: auto;
  opacity: 0.1;
}

.logo-front {
  position: fixed;
  top: 16vh;
  left: 19vw;
  z-index: 1;
}

.logo-bold {
  height: 68vh;
  width: auto;
  clip-path: inset(7vh 0 7vh 9vw);
  z-index: 1;
}

.register-container {
  position: absolute;
  top: 23vh;
  left: 28vw;
  height: 54vh;
  width: 42vw;
  background-color: #ccc;
  margin: 0 !important;
  box-shadow: 0px 10px 50px 30px rgba(0, 0, 0, 0.1);
}

.left-card {
  position: fixed;
  height: 54vh;
  width: 42vw;
  margin: 0 !important;
  padding: 0 !important;
  background-color: #dfcba4;
}

.right-card {
  position: fixed;
  height: 54vh;
  width: 42vw;
  background-color: #f4eee1;
  padding: 10px !important;
}

.welcome-container-position {
  position: fixed;
  top: 16vh;
  left: 19vw;
  height: 68vh;
  width: 21vw;
  margin: 0 !important;
  padding: 20px !important;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.welcome-text-container {
  z-index: 100;
  /* background-color: red; */
  mask-image: url('../../assets/images/logo.png');
  mask-size: cover;
  mask-repeat: no-repeat;
  mask-position: 0%;
  -webkit-mask-image: url('../../assets/images/logo.png');
  -webkit-mask-size: cover;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: 0% 0%;
}

.welcome-text {
  position: absolute;
  top: 12vh;
  left: 10vw;
  font-size: 36px;
}

.welcome-text-container-nonmask {
  z-index: 0;
}

/* Register-specific styles */
.register-button {
  position: absolute;
  right: 2vw;
  top: 39vh;
  color: white;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: unset;
  }
}

.register-arrow {
  position: absolute;
  top: -80px;
  right: -80px;
  width: 80px;
  height: 240px;
  background: linear-gradient(to left, #aa1b1d 50%, #ec0017 50%);
  clip-path: polygon(0% 100%, 50% 30%, 100% 100%, 50% 90%, 50% 80%, 50% 90%);
  transform: rotate(90deg);
}

.register-whitebox {
  position: absolute;
  top: 0vh;
  right: 40px;
  width: 80px;
  height: 80px;
  background-color: white;
  clip-path: polygon(50% 0%, 80% 50%, 50% 100%, 20% 50%);
}

.register-text {
  /* position: absolute; */
  font-size: 20px;
  font-weight: normal;
  transform: perspective(500px) rotateX(20deg) rotateY(8deg) skewX(15deg)
    scaleX(1.5);
  transform-origin: center;
  display: inline-block;
  /* Ensures the transform applies correctly */
}

.to-login-text {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 10px !important;
  color: #666;
}

.horizontal-line {
  position: relative;
  bottom: 10.8vh;
  left: 15vw;
  width: calc(23.3vw - 50px);
  height: 4px;
  background-color: #ec0017;
  z-index: 1;
  /* box-shadow: 10px 10px 10px 10px rgba(0, 0, 0, 0.1); */
}

.register-button:disabled {
  cursor: default;
  opacity: 0.62;
  pointer-events: none;
}

.terms-checkbox {
  margin-top: -10px;
  margin-bottom: 6px;
}

.terms-label {
  color: #555;
  font-size: 13px;
  line-height: 1.4;
}

.terms-link {
  color: #aa1b1d;
  font-weight: 600;
  text-decoration: none;
}

.terms-link:hover {
  text-decoration: underline;
}

:global(body.phone-layout) .background-decor-line1,
:global(body.phone-layout) .background-decor-line3,
:global(body.phone-layout) .background-decor-line4,
:global(body.phone-layout) .background-decor-line5,
:global(body.phone-layout) .background-decor-circle,
:global(body.phone-layout) .background-decor-box1,
:global(body.phone-layout) .background-decor-box2,
:global(body.phone-layout) .background-decor-box3,
:global(body.phone-layout) .background-decor-box4 {
  display: none;
}

:global(body.phone-layout) .background-decor-line2 {
  top: 80px;
  left: 0;
  width: 100vw;
  z-index: 0;
}

:global(body.phone-layout) .register-container {
  position: relative;
  top: auto;
  left: auto;
  box-sizing: border-box;
  width: 100vw;
  min-height: calc(100dvh - 80px);
  height: auto;
  padding: clamp(16px, 6vw, 24px) clamp(12px, 4vw, 16px);
  background-color: transparent;
  box-shadow: none;
  overflow-x: hidden;
}

:global(body.phone-layout) .register-container :deep(.v-row) {
  width: 100%;
  max-width: min(430px, 100%);
  margin: 0;
}

:global(body.phone-layout) .auth-visual-col {
  display: none !important;
}

:global(body.phone-layout) .auth-form-col {
  flex: 0 0 100%;
  max-width: 100%;
}

:global(body.phone-layout) .right-card {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  height: auto;
  min-height: auto;
  padding: clamp(16px, 5vw, 20px) clamp(12px, 4vw, 16px) !important;
  border-radius: 8px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14);
}

:global(body.phone-layout) .right-card :deep(.v-card-title) {
  padding-bottom: 8px;
}

:global(body.phone-layout) .right-card h2 {
  width: 100%;
  font-size: 26px;
}

:global(body.phone-layout) .to-login-text {
  position: static;
  padding: 8px 0 0 !important;
}

:global(body.phone-layout) .register-button {
  position: relative;
  top: auto;
  right: auto;
  width: 100%;
  min-height: 48px;
  margin-top: 8px;
  border-radius: 6px;
  background-color: #ec0017;
  color: #fff;
}

:global(body.phone-layout) .register-button:hover {
  background-color: #c90014;
}

:global(body.phone-layout) .register-arrow,
:global(body.phone-layout) .register-whitebox {
  display: none;
}

:global(body.phone-layout) .register-text {
  font-size: 18px;
  font-weight: 600;
  transform: none;
}

:global(body.phone-layout) .horizontal-line {
  display: none;
}
</style>
