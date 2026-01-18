`<template>
  <div class="feed-detail">
    <v-container>
      <v-row>
        <v-col cols="auto" class="feed-info-container">
          <v-card class="feed-info-card">
            <v-img v-if="feed.cover" :src="feed.cover" aspect-ratio="16/9" cover
              style="max-width: 90%; max-height: 40%"></v-img>
            <v-card-title>{{ feed.title }}</v-card-title>
            <v-card-subtitle>
              <v-row>
                <v-col cols="auto">
                  <v-btn icon="dots-vertical" size="40" class="justify-center align-center default-avatar"
                    @click="navigateToProfile(feed.authorId)">
                    <v-avatar size="38">
                      <img :src="feed.authorAvatar" alt="作者头像" />
                    </v-avatar>
                  </v-btn>
                </v-col>
                <v-col>
                  {{ feed.author }}
                  <div class="text-caption">{{ feed.date }}</div>
                </v-col>
              </v-row>
            </v-card-subtitle>
            <v-card-text>
              <div v-html="feed.content"></div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="auto" class="feed-interaction-container">
          <v-card class="comments-card">
            <v-card-title>评论</v-card-title>
            <v-card-text>
              <p>评论功能开发中...</p>
            </v-card-text>
          </v-card>

          <v-spacer style="height: 20px"></v-spacer>

          <v-card class="related-feeds-card">
            <v-card-title>相关动态</v-card-title>
            <v-card-text>
              <p>相关动态推荐开发中...</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
// import { apiClient } from '@/api'

export default {
  name: 'FeedDetail',
  props: {
    feedId: {
      type: [String, Number],
      required: true,
    },
  },
  data() {
    return {
      feed: {
        id: 1,
        cover: require('@/assets/images/banner.png'),
        title: '动态推送功能开发中，敬请期待！',
        content: '<p>我们正在努力开发动态推送功能，让用户能够更好地了解和分享学习动态。</p><p>敬请期待更多功能！</p>',
        author: 'Sciencetopia团队',
        authorId: 1,
        authorAvatar: require('@/assets/images/avatar.svg'),
        date: '2024-01-14',
      },
    }
  },
  methods: {
    ...mapActions(['goToProfile']),

    async navigateToProfile(userId) {
      this.goToProfile({ userId, router: this.$router })
    },

    async fetchFeedDetail() {
      // 后续可以添加从API获取动态详情的逻辑
      // try {
      //   const response = await apiClient.get(\`/Feed/GetFeedById/\${this.feedId}\`)
      //   this.feed = response.data
      // } catch (error) {
      //   console.error('Error fetching feed detail:', error)
      // }
    },
  },
  mounted() {
    this.fetchFeedDetail()
  },
}
</script>

<style scoped>
@import '../../assets/css/avatar.css';

.feed-detail {
  position: relative;
  top: -2vh;
}

.feed-info-container {
  width: 38.2%;
  min-height: 84vh;
}

.feed-info-card {
  width: 100%;
  height: 100%;
  background-color: #f4eee1;
  padding: 40px;
}

.feed-interaction-container {
  width: 61.8%;
}

.comments-card,
.related-feeds-card {
  background-color: #f4eee1;
  box-shadow: 8px 0px 8px 0px rgba(0, 0, 0, 0.05) !important;
}

.comments-card {
  min-height: 52vh;
}

.related-feeds-card {
  min-height: 32vh;
}

.v-card-title {
  font-size: 1.4rem;
  color: #1c2b42;
  line-height: 1.4;
}

.v-card-text {
  color: #304e75;
  font-size: 1rem;
  line-height: 1.6;
}
</style>`
