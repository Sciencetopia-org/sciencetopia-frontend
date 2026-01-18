<template>
  <v-container class="about-page py-5">
    <h1>{{ $t('about.title') }}</h1>
    <v-spacer class="my-5"></v-spacer>
    <p>
      {{ $t('about.tagline.before') }}
      <button class="team-button" @click="toBottom">{{ $t('about.independentTeam') }}</button>
      {{ $t('about.tagline.after') }}
    </p>
    <v-divider class="my-5"></v-divider>
    <p>{{ $t('about.p1') }}</p>
    <p>{{ $t('about.p2') }}</p>
    <p>{{ $t('about.p3') }}</p>
    <p>{{ $t('about.p4') }}</p>
    <p>{{ $t('about.p5') }}</p>
    <v-divider class="my-5"></v-divider>
    <p>{{ $t('about.p6') }}</p>
    <p>{{ $t('about.p7') }}</p>
    <v-spacer class="my-5"></v-spacer>
    <p>{{ $t('about.goal1') }}</p>
    <p>{{ $t('about.goal2') }}</p>
    <p>{{ $t('about.goal3') }}</p>
    <p>{{ $t('about.goal4') }}</p>
    <v-spacer class="my-5"></v-spacer>
    <p>{{ $t('about.p8') }}</p>
    <v-divider class="my-5"></v-divider>
    <p>{{ $t('about.p9') }}</p>
    <p>{{ $t('about.p10') }}</p>
    <v-divider class="my-5"></v-divider>
    <p>{{ $t('about.p11') }}</p>
    <v-spacer class="my-5"></v-spacer>
    <p>
      {{ $t('about.joinPrompt.before') }}
      <button class="join-us-botton" @click="joinUs">{{ $t('about.joinUs') }}</button>
      {{ $t('about.joinPrompt.after') }}
    </p>
    <v-spacer class="my-10"></v-spacer>
    <v-row justify="left">
      <v-col cols="12" md="8">
        <v-simple-table>
          <thead>
            <tr>
              <th
                colspan="3"
                class="text-center"
                style="border: 1px solid black"
              >
                {{ $t('about.team.title') }}
              </th>
            </tr>
            <tr>
              <th class="text-left" style="border: 1px solid black">{{ $t('about.team.name') }}</th>
              <th class="text-left" style="border: 1px solid black">{{ $t('about.team.role') }}</th>
              <th class="text-left" style="border: 1px solid black">{{ $t('about.team.contribution') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid black">@大法师猫定谔</td>
              <td style="border: 1px solid black">{{ $t('about.roles.fullstack') }}</td>
              <td style="border: 1px solid black">{{ $t('about.desc.fullstack') }}</td>
            </tr>
            <tr>
              <td style="border: 1px solid black">@狐灵</td>
              <td style="border: 1px solid black">{{ $t('about.roles.db') }}</td>
              <td style="border: 1px solid black">{{ $t('about.desc.db') }}</td>
            </tr>
            <tr>
              <td style="border: 1px solid black">@木之子</td>
              <td style="border: 1px solid black">{{ $t('about.roles.art') }}</td>
              <td style="border: 1px solid black">{{ $t('about.desc.art') }}</td>
            </tr>
            <tr>
              <td style="border: 1px solid black">@千古啸</td>
              <td style="border: 1px solid black">{{ $t('about.roles.ux') }}</td>
              <td style="border: 1px solid black">{{ $t('about.desc.ux') }}</td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'AboutUs',
  methods: {
    toBottom() {
      window.scrollTo(0, document.body.scrollHeight)
    },
    joinUs() {
      this.$router.push('/contact')
    },
  },
}
</script>

<style scoped>
/* Add your custom styles here */
.team-button {
  color: #1976d2;
  font-weight: bold;
  cursor: pointer;
}

.team-button:hover {
  text-decoration: underline;
}

.join-us-botton {
  /* background-color: #D5282A; */
  color: #d5282a;
  font-weight: bold;
  cursor: pointer;
  padding: 5px 10px;
  border: 2px solid #d5282a;
  border-radius: 5px;
}

.join-us-botton:hover {
  background-color: #ff0000;
  color: white;
  border: 2px solid #ff0000;
}

.about-page {
  padding: 0 10%;
}
</style>
