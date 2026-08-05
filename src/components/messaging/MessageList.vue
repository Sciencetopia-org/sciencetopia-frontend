<template>
  <div class="message-list">
    <v-list class="message-window" dense ref="messageList">
      <template
        v-for="(group, groupIndex) in groupedMessages"
        :key="groupIndex"
      >
        <div class="grouped-message">
          <div v-if="group.firstMessageSentTime" class="sent-time">
            {{ formatSentTime(group.firstMessageSentTime) }}
          </div>

          <template
            v-for="(message, index) in group.messages"
            :key="message.id"
          >
            <v-list-item
              :class="{
                'my-message d-flex justify-end align-end': isMyMessage(message),
                'their-message': !isMyMessage(message),
              }"
            >
              <div class="d-flex align-start">
                <!-- 判断当前消息和前一条消息的发送者是否相同 -->
                <v-avatar
                  v-if="shouldShowAvatar(group.messages, index)"
                  size="36"
                >
                  <v-btn
                    v-if="!isMyMessage(message)"
                    icon="dots-vertical"
                    variant="text"
                    size="40"
                    @click="navigateToProfile(message.sender.id)"
                  >
                    <v-avatar>
                      <img :src="message.sender.avatarUrl" alt="Avatar" />
                    </v-avatar>
                  </v-btn>
                </v-avatar>
                <div v-else style="width: 36px"></div>

                <!-- 消息内容 -->
                <div
                  class="message-bubble"
                  :class="{
                    'ml-2': !isMyMessage(message),
                    'mr-2': isMyMessage(message),
                  }"
                >
                  <template v-if="isImageMessage(message.content)">
                    <img :src="imageSrc(message.content)" alt="image" class="msg-image" />
                  </template>
                  <template v-else>
                    <div v-html="sanitize(message.content)"></div>
                  </template>
                </div>
                <v-avatar
                  v-if="shouldShowAvatar(group.messages, index)"
                  size="36"
                  @click="navigateToProfile(message.sender.id)"
                >
                  <img
                    v-if="isMyMessage(message)"
                    :src="message.sender.avatarUrl"
                    alt="Avatar"
                  />
                </v-avatar>
                <div v-else style="width: 36px"></div>
              </div>
            </v-list-item>
          </template>
        </div>
      </template>
    </v-list>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { sanitizeHtml, safeUrl } from '@/utils/text'

export default {
  props: {
    messages: Array,
    userId: String,
    userAvatarUrl: String,
  },
  computed: {
    groupedMessages() {
      console.log(this.messages)
      const groups = []
      let currentGroup = { messages: [], firstMessageSentTime: null }

      this.messages.forEach((message, index) => {
        const messageTime = new Date(message.sentTime)
        const previousMessageTime =
          index > 0 ? new Date(this.messages[index - 1].sentTime) : null

        if (
          previousMessageTime &&
          messageTime - previousMessageTime <= 5 * 60 * 1000
        ) {
          currentGroup.messages.push(message)
        } else {
          if (currentGroup.messages.length) {
            groups.push(currentGroup)
          }
          currentGroup = {
            messages: [message],
            firstMessageSentTime: message.sentTime,
          }
        }
      })

      if (currentGroup.messages.length) {
        groups.push(currentGroup)
      }

      return groups
    },
  },
  methods: {
    ...mapActions(['goToProfile']), // Map the Vuex action

    isMyMessage(message) {
      return message.sender.id === this.userId
    },
    isImageMessage(content) {
      if (!content || typeof content !== 'string') return false
      if (/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(content)) return true
      return /^(https?:)\/\/.+\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(content)
    },
    imageSrc(content) {
      if (/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(String(content))) return String(content)
      return safeUrl(content)
    },
    sanitize(html) {
      return sanitizeHtml(html)
    },
    shouldShowAvatar(messages, index) {
      // 如果是第一条消息，始终显示头像
      if (index === 0) return true

      // 当前消息和上一条消息的发送者不同，则显示头像
      return messages[index].sender.id !== messages[index - 1].sender.id
    },
    markMessagesAsRead() {
      this.$emit('messages-read')
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const messageList = this.$refs.messageList.$el
        if (messageList) {
          messageList.scrollTop = messageList.scrollHeight
          console.log('scrolling to bottom')
          console.log('messageList element:', this.$refs.messageList.$el)
          console.log(
            'scrollHeight:',
            messageList.scrollHeight,
            'scrollTop:',
            messageList.scrollTop
          )
        }
      })
    },
    formatSentTime(sentTime) {
      const time = new Date(sentTime)
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)

      if (time.toDateString() === now.toDateString()) {
        return time.toLocaleTimeString()
      } else if (time.toDateString() === yesterday.toDateString()) {
        return '昨天 ' + time.toLocaleTimeString()
      } else {
        return time.toLocaleString()
      }
    },
    async navigateToProfile(userId) {
      this.goToProfile({ userId, router: this.$router }) // Dispatch the action
    },
  },
  watch: {
    messages: {
      handler() {
        this.scrollToBottom()
        this.markMessagesAsRead()
      },
      immediate: true,
      deep: true,
    },
  },
  mounted() {
    this.scrollToBottom()
    this.markMessagesAsRead()
  },
}
</script>

<style scoped>
.message-list {
  height: 76%;
  overflow-y: auto;
  /* border-radius: 16px 0 5px 0; */
  background-color: unset;
  /* border-left: 3px solid #000;
  border-bottom: 2px solid #000; */
}

.message-window {
  background-color: unset;
}

.grouped-message {
  background-color: #f4eee1;
  /* border: 1px solid #C59F59; */
  margin: 5px;
}

.their-message .d-flex .message-bubble {
  padding: 8px 12px;
  font-size: 16px;
  margin-left: 22px !important;
  /* border-radius: 4px; */
  /* border-radius: 0 16px 16px 16px; */
  background-color: #ffffff;
  color: #1c2b42;
  /* max-width: 80%; */
  word-break: break-word;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 58px;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-width: 8px;
    border-style: solid;
    border-color: transparent #ffffff transparent transparent;
  }
}

.my-message {
  justify-content: flex-end;
}

.my-message .d-flex .message-bubble {
  padding: 8px 12px;
  font-size: 16px;
  /* border-radius: 4px; */
  /* border-radius: 16px 0 16px 16px; */
  background-color: #dfcba4;
  color: #000;
  /* max-width: 80%; */
  word-break: break-word;
  margin-right: 20px !important;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 58px;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-width: 8px;
    border-style: solid;
    border-color: transparent transparent transparent #dfcba4;
  }
}

.sent-time {
  font-size: 0.8em;
  color: gray;
  text-align: center;
  margin-top: 5px;
}

.msg-image {
  max-width: 320px;
  max-height: 280px;
  border-radius: 8px;
  display: block;
}
</style>
