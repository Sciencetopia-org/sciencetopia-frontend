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
      <v-col cols="6" class="d-flex justify-center">
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
      <v-col cols="6" class="d-flex justify-center">
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

              <!-- Register button -->
              <button class="register-button" type="submit" block>
                <div class="register-arrow"></div>
                <div class="register-whitebox"></div>
                <span class="register-text">{{ $t('register.register') }}</span>
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
      validationSummary: '',
    }
  },
  methods: {
    async handleSubmit() {
      if (this.password !== this.confirmPassword) {
        this.validationSummary = this.$t('register.passwordMismatch')
        return
      }

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
        this.validationSummary =
          error.response?.data?.error || this.$t('register.failed')
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
  height: 62vh;
  width: auto;
  opacity: 0.1;
}

.logo-front {
  position: fixed;
  top: 19vh;
  left: 19vw;
  z-index: 1;
}

.logo-bold {
  height: 62vh;
  width: auto;
  clip-path: inset(7vh 0 7vh 9vw);
  z-index: 1;
}

.register-container {
  position: absolute;
  top: 26vh;
  left: 28vw;
  height: 48vh;
  width: 42vw;
  background-color: #ccc;
  margin: 0 !important;
  box-shadow: 0px 10px 50px 30px rgba(0, 0, 0, 0.1);
}

.left-card {
  position: fixed;
  height: 48vh;
  width: 42vw;
  margin: 0 !important;
  padding: 0 !important;
  background-color: #dfcba4;
}

.right-card {
  position: fixed;
  height: 48vh;
  width: 42vw;
  background-color: #f4eee1;
  padding: 10px !important;
}

.welcome-container-position {
  position: fixed;
  top: 19vh;
  left: 19vw;
  height: 62vh;
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
  top: 35vh;
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
  bottom: 7.8vh;
  left: 15vw;
  width: calc(23.3vw - 50px);
  height: 4px;
  background-color: #ec0017;
  z-index: 1;
  /* box-shadow: 10px 10px 10px 10px rgba(0, 0, 0, 0.1); */
}
</style>
