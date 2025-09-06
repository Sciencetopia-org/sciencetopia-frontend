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
  <!-- <div class="logo-background">
        <img src="../assets/images/logo.png" class="logo" />
    </div> -->
  <v-container class="login-container d-flex align-center justify-center">
    <v-row no-gutters="true">
      <v-col cols="6" class="d-flex justify-center">
        <!-- left card -->
        <v-card class="left-card">
          <div class="logo-front">
            <img src="../assets/images/logo.png" class="logo-bold" />
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
            <h2 class="text-center">{{ $t('login.title') }}</h2>
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
                :label="$t('login.userNameLabel')"
                :error-messages="userNameError"
                variant="filled"
                required
                class="mb-4"
              ></v-text-field>
              <v-text-field
                v-model="password"
                :label="$t('login.passwordLabel')"
                :error-messages="passwordError"
                type="password"
                variant="filled"
                shaped
                required
                class="mb-4"
              ></v-text-field>
              <v-checkbox
                v-model="rememberMe"
                :label="$t('login.rememberMeLabel')"
                dense
              ></v-checkbox>

              <!-- Login button -->
              <button class="login-button" type="submit" block>
                <div class="login-arrow"></div>
                <div class="login-whitebox"></div>
                <span class="login-text">{{ $t('header.login') }}</span>
              </button>
            </v-form>
          </v-card-text>
          <v-card-text class="to-register-text">
            <p class="text-center">
              {{ $t('login.dontHaveAccount') }}
              <span @click="navigateToRegister" class="interactive-text">
                {{ $t('login.clickHere') }}
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
import { apiClient } from '@/api' // Ensure the path to api.js is correct

export default {
  name: 'LogIn',
  data() {
    return {
      userName: '',
      password: '',
      rememberMe: false,
      validationSummary: '',
      userNameError: '',
      passwordError: '',
    }
  },
  methods: {
    async handleSubmit() {
      try {
        const response = await apiClient.post('/users/Account/Login', {
          userName: this.userName,
          password: this.password,
          rememberMe: this.rememberMe,
        })

        this.$router.push('/')
        this.$store.dispatch('checkAuthenticationStatus')
        // this.$store.dispatch('connectSignalR');

        console.log(this.$t('login.success'), response.config.data)
      } catch (error) {
        console.error(this.$t('login.failed'), error)
        if (error.response && error.response.data) {
          this.validationSummary =
            error.response.data.error || this.$t('login.failed')
        } else {
          this.validationSummary = this.$t('login.failed')
        }
      }
    },

    navigateToRegister() {
      this.$router.push({ name: 'register' })
    },
  },
}
</script>

<style scoped>
@import '../assets/css/login-background.css';

.logo-background {
  position: fixed;
  top: 19vh;
  left: 19vw;
  z-index: 0;
}

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
  clip-path: inset(10vh 0 10vh 9vw);
  z-index: 1;
}

.login-container {
  position: absolute;
  top: 29vh;
  left: 28vw;
  height: 42vh;
  width: 42vw;
  background-color: #ccc;
  margin: 0 !important;
  box-shadow: 0px 10px 50px 30px rgba(0, 0, 0, 0.1);
}

.left-card {
  height: 42vh;
  width: 42vw;
  margin: 0 !important;
  padding: 0 !important;
  background-color: #dfcba4;
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
  mask-image: url('../assets/images/logo.png');
  mask-size: cover;
  mask-repeat: no-repeat;
  mask-position: 0%;
  -webkit-mask-image: url('../assets/images/logo.png');
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

.to-register-text {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 10px !important;
  color: #666;
}

.right-card {
  position: relative;
  height: 42vh;
  width: 42vw;
  background-color: #f4eee1;
  padding: 10px !important;
}

.login-button {
  position: absolute;
  right: 2vw;
  top: 27vh;
  color: white;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: unset;
  }
}

.login-arrow {
  position: absolute;
  top: -80px;
  right: -80px;
  width: 80px;
  height: 240px;
  background: linear-gradient(to left, #aa1b1d 50%, #ec0017 50%);
  clip-path: polygon(0% 100%, 50% 30%, 100% 100%, 50% 90%, 50% 80%, 50% 90%);
  transform: rotate(90deg);
}

.login-whitebox {
  position: absolute;
  top: 0vh;
  right: 40px;
  width: 80px;
  height: 80px;
  background-color: white;
  clip-path: polygon(50% 0%, 80% 50%, 50% 100%, 20% 50%);
}

.login-text {
  /* position: absolute; */
  top: 0vh;
  /* right: 100px; */
  font-size: 20px;
  font-weight: normal;
  transform: perspective(500px) rotateX(20deg) rotateY(8deg) skewX(15deg) scaleX(1.5);
  transform-origin: center;
  display: inline-block;
}

.horizontal-line {
  position: absolute;
  bottom: 9.3vh;
  left: 15.6vw;
  width: calc(22vw - 40px);
  height: 4px;
  background-color: #ec0017;
  z-index: 1;
  /* box-shadow: 10px 10px 10px 10px rgba(0, 0, 0, 0.1); */
}

.v-alert {
  border-radius: 8px;
}
</style>
