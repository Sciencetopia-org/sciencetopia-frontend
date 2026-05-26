<template>
  <v-container fluid class="feed-detail-page">
    <v-row class="feed-detail-layout" dense>
      <v-col cols="12" md="7" lg="8">
        <v-card class="feed-info-card">
          <v-img
            v-if="feed.cover"
            :src="feed.cover"
            class="feed-info-card__cover"
            cover
          />

          <div class="feed-info-card__body">
            <v-card-title class="feed-info-card__title">{{ feed.title }}</v-card-title>

            <div class="feed-info-card__meta">
              <v-btn
                icon
                size="40"
                class="default-avatar feed-info-card__avatar"
                @click="navigateToProfile(feed.authorId)"
                :aria-label="feed.author"
              >
                <v-avatar size="38">
                  <img :src="feed.authorAvatar" alt="" />
                </v-avatar>
              </v-btn>
              <div>
                <div>{{ feed.author }}</div>
                <div class="text-caption">{{ feed.date }}</div>
              </div>
            </div>

            <v-card-text class="feed-info-card__content">
              <div v-html="feed.content"></div>
            </v-card-text>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="5" lg="4">
        <aside class="feed-side-panel">
          <v-card class="feed-side-card comments-card">
            <v-card-title>评论</v-card-title>
            <v-card-text>
              <p>评论功能开发中...</p>
            </v-card-text>
          </v-card>

          <v-card class="feed-side-card related-feeds-card">
            <v-card-title>相关动态</v-card-title>
            <v-card-text>
              <p>相关动态推荐开发中...</p>
            </v-card-text>
          </v-card>
        </aside>
      </v-col>
    </v-row>
  </v-container>
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
      //   const response = await apiClient.get(`/Feed/GetFeedById/${this.feedId}`)
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

.feed-detail-page {
  max-width: 1180px;
  padding: 24px;
}

.feed-detail-layout {
  align-items: stretch;
}

.feed-info-card,
.feed-side-card {
  overflow: hidden;
  background-color: #f4eee1;
}

.feed-info-card {
  min-height: calc(100dvh - 160px);
}

.feed-info-card__cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 360px;
}

.feed-info-card__body {
  padding: 24px;
}

.feed-info-card__title {
  padding: 0;
  color: #1c2b42;
  font-size: 26px;
  line-height: 1.3;
  white-space: normal;
  word-break: break-word;
}

.feed-info-card__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  color: #304e75;
}

.feed-info-card__avatar {
  flex: 0 0 auto;
}

.feed-info-card__content {
  padding: 18px 0 0;
  color: #304e75;
  font-size: 16px;
  line-height: 1.7;
}

.feed-side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.feed-side-card {
  box-shadow: 8px 0 8px rgba(0, 0, 0, 0.05) !important;
}

.comments-card {
  flex: 1 1 55%;
  min-height: 280px;
}

.related-feeds-card {
  flex: 1 1 35%;
  min-height: 220px;
}

:global(body.phone-layout) .feed-detail-page {
  padding: 8px 8px calc(88px + env(safe-area-inset-bottom));
}

:global(body.phone-layout) .feed-detail-layout {
  margin: 0;
}

:global(body.phone-layout) .feed-detail-layout > .v-col {
  padding: 0 0 12px;
}

:global(body.phone-layout) .feed-info-card,
:global(body.phone-layout) .feed-side-card {
  border-radius: 0 !important;
  box-shadow: none !important;
}

:global(body.phone-layout) .feed-info-card {
  min-height: 0;
}

:global(body.phone-layout) .feed-info-card__body {
  padding: 14px 12px 16px;
}

:global(body.phone-layout) .feed-info-card__title {
  font-size: 22px;
}

:global(body.phone-layout) .feed-info-card__content {
  font-size: 15px;
}

:global(body.phone-layout) .feed-side-panel {
  gap: 12px;
}

:global(body.phone-layout) .comments-card,
:global(body.phone-layout) .related-feeds-card {
  min-height: 160px;
}
</style>
