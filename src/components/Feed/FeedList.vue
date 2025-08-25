`<template>
  <v-container>
    <div class="feed-list">
      <v-row>
        <v-col cols="12" sm="6" md="4" v-for="feed in feeds" :key="feed.id">
          <v-card class="st-card feed-card" @click="toFeedDetail(feed.id)">
            <v-img
              v-if="feed.cover"
              :src="feed.cover"
              class="feed-image"
              height="200"
              cover
            ></v-img>
            <v-card-title>{{ feed.title }}</v-card-title>
            <v-card-subtitle>
              <v-row>
                <v-col cols="auto">
                  <v-btn
                    icon="dots-vertical"
                    size="40"
                    class="justify-center align-center default-avatar"
                    @click.stop="navigateToProfile(feed.authorId)"
                  >
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
            <v-card-text v-if="feed.description">
              {{ feed.description }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script>
import { useGlobalLoading } from '../GlobalLoader.vue'
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
        // 后续可以添加更多动态数据
      ],
    }
  },
  methods: {
    ...mapActions(['goToProfile']),

    toFeedDetail(feedId) {
      this.$router.push({
        name: 'feedDetail',
        params: { feedId: feedId },
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

.feed-list {
  padding: 20px;
}

.feed-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s;
  background-color: #f4eee1;
}

.feed-card:hover {
  transform: translateY(-4px);
}

.feed-image {
  border-radius: 4px 4px 0 0;
}

.v-card-title {
  font-size: 1.2rem;
  color: #1c2b42;
  line-height: 1.4;
}

.v-card-text {
  color: #304e75;
}
</style>`