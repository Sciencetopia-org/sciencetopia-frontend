<template>
  <v-container fluid class="feed-page">
    <header class="feed-page__header">
      <div>
        <div class="feed-page__eyebrow">{{ $t('header.trend') }}</div>
        <h1 class="feed-page__title">{{ $t('header.trend') }}</h1>
      </div>
    </header>

    <v-row class="feed-grid" dense>
      <v-col v-for="feed in feeds" :key="feed.id" cols="12" sm="6" lg="4">
        <v-card class="st-card feed-card" @click="toFeedDetail(feed.id)">
          <v-img
            v-if="feed.cover"
            :src="feed.cover"
            class="feed-card__image"
            cover
          />

          <div class="feed-card__body">
            <v-card-title class="feed-card__title">{{ feed.title }}</v-card-title>

            <div class="feed-card__meta">
              <v-btn
                icon
                size="40"
                class="default-avatar feed-card__avatar"
                @click.stop="navigateToProfile(feed.authorId)"
                :aria-label="feed.author"
              >
                <v-avatar size="38">
                  <img :src="feed.authorAvatar" alt="" />
                </v-avatar>
              </v-btn>
              <div class="feed-card__author">
                <div>{{ feed.author }}</div>
                <div class="text-caption">{{ feed.date }}</div>
              </div>
            </div>

            <v-card-text v-if="feed.description" class="feed-card__description">
              {{ feed.description }}
            </v-card-text>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useGlobalLoading } from '@/components/ui/GlobalLoader.vue'
import { mapActions } from 'vuex'
// import { apiClient } from '@/api'

export default {
  name: 'FeedList',
  setup() {
    const { isLoading, showLoading, hideLoading } = useGlobalLoading()

    return {
      isLoading,
      showLoading,
      hideLoading,
    }
  },
  data() {
    return {
      feeds: [
        {
          id: 1,
          cover: require('@/assets/images/banner.png'),
          title: '动态推送功能开发中，敬请期待！',
          description: '我们正在努力开发动态推送功能，让用户能够更好地了解和分享学习动态。',
          author: 'Sciencetopia团队',
          authorId: 1,
          authorAvatar: require('@/assets/images/avatar.svg'),
          date: '2024-01-14',
        },
      ],
    }
  },
  methods: {
    ...mapActions(['goToProfile']),

    toFeedDetail(feedId) {
      this.$router.push({
        name: 'feedDetail',
        params: { feedId },
      })
    },

    async navigateToProfile(userId) {
      this.goToProfile({ userId, router: this.$router })
    },

    async fetchFeeds() {
      // 后续可以添加从API获取动态数据的逻辑
      // try {
      //   const response = await apiClient.get('/Feed/GetAllFeeds')
      //   this.feeds = response.data
      // } catch (error) {
      //   console.error('Error fetching feeds:', error)
      // }
    },
  },
  mounted() {
    this.fetchFeeds()
  },
}
</script>

<style scoped>
@import '../../assets/css/avatar.css';

.feed-page {
  max-width: 1180px;
  padding: 24px;
}

.feed-page__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 18px;
}

.feed-page__eyebrow {
  color: rgba(48, 78, 117, 0.72);
  font-size: 13px;
  font-weight: 700;
}

.feed-page__title {
  margin: 0;
  color: #1c2b42;
  font-size: 28px;
  line-height: 1.2;
}

.feed-grid {
  row-gap: 16px;
}

.feed-card {
  height: 100%;
  cursor: pointer;
  overflow: hidden;
  background-color: #f4eee1;
  transition: transform 0.2s, box-shadow 0.2s;
}

.feed-card:hover {
  transform: translateY(-4px);
}

.feed-card__image {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.feed-card__body {
  padding: 14px 16px 16px;
}

.feed-card__title {
  padding: 0;
  color: #1c2b42;
  font-size: 18px;
  line-height: 1.35;
  white-space: normal;
  word-break: break-word;
}

.feed-card__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  color: #304e75;
}

.feed-card__avatar {
  flex: 0 0 auto;
}

.feed-card__author {
  min-width: 0;
}

.feed-card__description {
  padding: 12px 0 0;
  color: #304e75;
  line-height: 1.55;
}

:global(body.phone-layout) .feed-page {
  padding: 12px 8px calc(88px + env(safe-area-inset-bottom));
}

:global(body.phone-layout) .feed-page__header {
  margin-bottom: 12px;
}

:global(body.phone-layout) .feed-page__title {
  font-size: 22px;
}

:global(body.phone-layout) .feed-grid {
  margin: 0;
}

:global(body.phone-layout) .feed-grid > .v-col {
  padding: 0 0 12px;
}

:global(body.phone-layout) .feed-card {
  border-radius: 12px !important;
  box-shadow: none !important;
}

:global(body.phone-layout) .feed-card__body {
  padding: 12px;
}
</style>
