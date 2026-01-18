<template>
  <v-card class="media-card st-card" outlined>
    <v-img :src="cover" class="cover-image"></v-img>

    <v-card-title class="title">{{ title }}</v-card-title>

    <v-card-subtitle>
      <div class="subtitle">
        <span>{{ author }}</span>
        <span>{{ formatDate(date) }}</span>
      </div>
    </v-card-subtitle>
  </v-card>
</template>

<script>
export default {
  name: 'MediaFeed',
  props: {
    cover: String,
    title: String,
    author: String,
    date: Date,
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleDateString()
    },
  },
}
</script>

<style scoped>
.media-card {
  max-width: 400px;
  /* Adjust the width as needed */
  height: 305px;
  margin: 10px;
}

.cover-image {
  width: 100%;
  height: 225px;
  /* Adjust the height as needed */
  object-fit: cover;
}

.title {
  font-size: 1.2em;
  /* Adjust the font size as needed */
  font-weight: bold;
}

.subtitle {
  display: flex;
  justify-content: space-between;
  font-size: 0.9em;
  /* Adjust the font size as needed */
}
</style>
