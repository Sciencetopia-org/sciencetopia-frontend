<template>
  <div style="position: relative; width: 100%; height: 100%; overflow: hidden">
    <!-- <div class="image-background" style="position: fixed; top: 0;">
        </div> -->
    <!-- <div class="blur-connector"></div> -->
    <!-- <div
            style="position: absolute; width: 100vw; height: 100vh; position: absolute; top:6vh; background-color: rgba(232, 218, 189, 0.6); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);">
        </div> -->
    <v-container class="message-center">
      <v-row>
        <v-col cols="auto" class="sidebar">
          <div style="height: 100%">
            <!-- <v-list variant="plain"> -->
            <v-list-item
              variant="plain"
              class="sidebar-item"
              :to="{ name: 'directMessages', params: { userId: userId } }"
              exact
              :class="{ active: activeTab === 'directMessages' }"
            >
              <v-list-item-title class="sidebar-title">{{
                $t('message.privatemessage')
              }}</v-list-item-title>
              <div v-if="messageCount > 0" class="alert-badge">
                {{ messageCount > 99 ? '99+' : messageCount }}
              </div>
            </v-list-item>
            <div style="height: 1vh"></div>
            <v-list-item
              variant="plain"
              class="sidebar-item"
              :to="{ name: 'notifications', params: { userId: userId } }"
              exact
              :class="{ active: activeTab === 'notifications' }"
            >
              <v-list-item-title class="sidebar-title">{{
                $t('message.notification')
              }}</v-list-item-title>
              <div v-if="notificationCount > 0" class="alert-badge">
                {{ notificationCount > 99 ? '99+' : notificationCount }}
              </div>
            </v-list-item>
            <!-- </v-list> -->
          </div>
        </v-col>
        <v-col cols="auto" style="width: 94%">
          <v-card v-if="activeTab === 'directMessages'" class="message-card">
            <v-card-text>
              <v-row>
                <v-col cols="auto" style="width: 20%">
                  <v-list class="direct-message-list" dense>
                    <v-list-item
                      class="message-item"
                      v-for="conversation in conversations"
                      :key="conversation.conversationId"
                      @click="selectConversation(conversation)"
                      :class="{
                        'grey-background': isSelectedConversation(conversation),
                      }"
                    >
                      <v-row>
                        <v-col cols="auto">
                          <v-avatar size="62" style="border: 2px solid #000">
                            <img
                              :src="conversation.partnerAvatarUrl"
                              alt="Avatar"
                            />
                          </v-avatar>
                        </v-col>
                        <v-col cols="auto">
                          <v-list-item-title>{{
                            conversation.partnerName
                          }}</v-list-item-title>
                          <v-list-item-subtitle>{{
                            getLastMessage(conversation)
                          }}</v-list-item-subtitle>
                          <div
                            v-if="
                              conversationMessageCount[
                                conversation.conversationId
                              ] > 0
                            "
                            class="alert-badge"
                          >
                            {{
                              conversationMessageCount[
                                conversation.conversationId
                              ]
                            }}
                          </div>
                        </v-col>
                      </v-row>
                      <!-- Triangle added dynamically when selected -->
                      <div
                        v-if="isSelectedConversation(conversation)"
                        class="triangle-dog-ear"
                      ></div>
                    </v-list-item>
                  </v-list>
                </v-col>
                <!-- <v-divider vertical color="text" opacity="0.6"></v-divider> -->
                <v-col
                  cols="auto"
                  style="width: 74%; height: 86vh"
                  v-if="selectedConversation"
                >
                  <v-card
                    class="d-flex align-center justify-center partner-card"
                  >
                    <v-card-title>{{
                      selectedConversation.partnerName
                    }}</v-card-title>
                  </v-card>
                  <MessageList
                    ref="messageList"
                    :messages="selectedConversation.messages"
                    :userId="userId"
                    :userAvatarUrl="userAvatarUrl"
                  />

                  <v-textarea
                    class="textarea"
                    variant="solo-filled"
                    v-model="selectedConversation.newMessage"
                    :label="$t('message.editing')"
                    outlined
                    dense
                  ></v-textarea>
                  <v-card-actions class="justify-end">
                    <button
                      class="send"
                      @click="sendMessage(selectedConversation)"
                    >
                      <div class="send-text">{{ $t('message.send') }}</div>
                    </button>
                  </v-card-actions>
                </v-col>
                <v-col cols="auto" style="width: 6%">
                  <div class="picker-container">
                    <button class="image-picker-btn">
                      <img
                        width="36"
                        height="36"
                        src="https://img.icons8.com/glyph-neue/64/FFFFFF/image.png"
                        alt="image"
                      />
                    </button>
                    <button class="emoji-picker-btn" @click="toggleEmojiPicker">
                      😊
                    </button>

                    <div v-if="showEmojiPicker">
                      <emoji-picker
                        class="light emoji-picker"
                        @emoji-click="onEmojiClick"
                      ></emoji-picker>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
          <SystemNotifications v-else />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { apiClient } from '@/api'
import { connection } from '@/services/signalr-service'
import MessageList from '@/components/MessageList.vue'
import SystemNotifications from '@/components/SystemNotifications.vue' // Import the new component
import { mapState } from 'vuex'
import { DateTime } from 'luxon'
import 'emoji-picker-element'

export default {
  components: { MessageList, SystemNotifications }, // Include the new component
  data() {
    return {
      activeTab: 'directMessages',
      conversations: [],
      selectedConversation: null,
      userId: null,
      userAvatarUrl: null,
      showEmojiPicker: false, // Controls the visibility of the emoji picker
    }
  },
  computed: {
    ...mapState([
      'messageCount',
      'conversationMessageCount',
      'notificationCount',
    ]),
  },
  watch: {
    $route(to) {
      if (to.name === 'directMessages') {
        this.activeTab = 'directMessages'
        if (this.selectedConversation) {
          this.markMessagesAsRead(this.selectedConversation.conversationId)
        }
      } else if (to.name === 'notifications') {
        this.activeTab = 'notifications'
        // if (this.notificationCount > 0) {
        this.markNotificationsAsRead()
        // }
      }
    },
    '$route.query.conversationId': {
      immediate: true,
      handler(newConversationId) {
        if (newConversationId) {
          this.loadConversation(newConversationId)
        }
      },
    },
    selectedConversation(conversation) {
      if (conversation) {
        this.markMessagesAsRead(conversation.conversationId)
      }
    },
  },
  created() {
    this.fetchConversations()
    this.updateActiveTab()
    this.setupSignalREvents()
  },
  methods: {
    setupSignalREvents() {
      const connection = this.$root.$signalRConnection
      if (connection) {
        connection.on('ReceiveMessage', this.handleReceiveMessage)
      } else {
        console.error('SignalR connection is not defined')
      }
    },
    updateActiveTab() {
      if (this.$route.name === 'directMessages') {
        this.activeTab = 'directMessages'
        if (this.selectedConversation) {
          this.markMessagesAsRead(this.selectedConversation.conversationId)
        }
      } else if (this.$route.name === 'notifications') {
        this.activeTab = 'notifications'
      }
    },
    async fetchConversations() {
      const userId = this.$store.state.currentUserID
      const response = await apiClient.get(
        `Message/GetGroupedMessagesByUser/${userId}`
      )
      this.conversations = response.data
      this.selectedConversation = this.conversations[0]
      this.userId = userId
      this.userAvatarUrl = this.$store.state.avatarUrl
    },
    async loadConversation(conversationId, partnerId = null, partnerName = '') {
      try {
        // Fetch the full conversation details from the backend
        const response = await apiClient.get(
          `/Message/GetConversation/${conversationId}`
        )

        // If the backend returns data, use it; otherwise, initialize a new conversation
        this.selectedConversation = response.data || {
          conversationId: conversationId,
          messages: [],
          partnerId: partnerId, // Use the partnerId passed in
          partnerName: partnerName, // Use the partnerName passed in
        }
      } catch (error) {
        console.error(
          'Unable to retrieve conversation data. Initializing new conversation:',
          error
        )

        // Initialize an empty conversation structure as a fallback
        this.selectedConversation = {
          conversationId: conversationId,
          messages: [],
          partnerId: partnerId,
          partnerName: partnerName,
        }
      }
    },
    selectConversation(conversation) {
      this.selectedConversation = conversation
    },
    isSelectedConversation(conversation) {
      return (
        conversation.conversationId === this.selectedConversation.conversationId
      )
    },
    getLastMessage(conversation) {
      return conversation.messages.length > 0
        ? conversation.messages[conversation.messages.length - 1].content
        : null
    },
    async handleReceiveMessage(conversationId, message) {
      if (!conversationId) {
        console.error('conversationId is undefined or null')
        return
      }
      const conversation = this.conversations.find(
        (c) => c.conversationId === conversationId
      )
      if (conversation) {
        if (message.sender.id !== this.userId) {
          conversation.messages.push(message)
          this.sortConversations(conversationId)
        }
        if (this.isSelectedConversation(conversation)) {
          await this.markMessagesAsRead(conversationId)
        }
      } else {
        this.fetchConversations()
      }
    },
    async markMessagesAsRead(conversationId) {
      await apiClient.post('Message/MarkAsRead', {
        conversationId,
        userId: this.userId,
      })
      const conversation = this.conversations.find(
        (c) => c.conversationId === conversationId
      )
      if (conversation) {
        conversation.messages.forEach((message) => {
          message.isRead = true
        })
      }
      connection.invoke('MarkMessagesAsRead', conversationId, this.userId)
    },
    sendMessage(conversation) {
      if (conversation.newMessage.trim() === '') return

      const receiverId = conversation.partnerId
      connection
        .invoke(
          'SendMessage',
          conversation.conversationId,
          this.userId,
          receiverId,
          conversation.newMessage
        )
        .then(() => {
          const newMessage = {
            id: Date.now().toString(),
            senderName: 'You',
            content: conversation.newMessage,
            sentTime: DateTime.utc().toISO(),
            sender: {
              id: this.userId,
              avatarUrl: this.userAvatarUrl,
            },
          }
          conversation.messages.push(newMessage)
          conversation.newMessage = ''
          this.$refs.messageList.scrollToBottom()
          this.sortConversations(conversation.conversationId)
        })
        .catch((err) => console.error('Error sending message:', err))
    },
    sortConversations(conversationId) {
      const conversationIndex = this.conversations.findIndex(
        (c) => c.conversationId === conversationId
      )
      if (conversationIndex !== -1) {
        const conversation = this.conversations.splice(conversationIndex, 1)[0]
        this.conversations.unshift(conversation)
      }
    },
    async markNotificationsAsRead() {
      await apiClient.post(`Notification/MarkAsReadByUser/${this.userId}`)
      connection.invoke('MarkAllNotificationsAsRead', this.userId)
      // console.log('Marked all notifications as read');
    },
    toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker // Toggle emoji picker visibility
      if (this.showEmojiPicker) {
        document.addEventListener('click', this.closeEmojiPickerOnOutsideClick)
      } else {
        document.removeEventListener(
          'click',
          this.closeEmojiPickerOnOutsideClick
        )
      }
    },
    onEmojiClick(event) {
      const emoji = event.detail.unicode // Get the selected emoji
      if (
        this.selectedConversation &&
        typeof this.selectedConversation.newMessage === 'string'
      ) {
        // 确保 newMessage 是一个字符串
        this.selectedConversation.newMessage += emoji // 拼接表情
      } else if (this.selectedConversation) {
        // 如果 newMessage 未初始化，则赋值表情
        this.selectedConversation.newMessage = emoji
      }
    },
    closeEmojiPickerOnOutsideClick(event) {
      const emojiPicker = document.querySelector('.emoji-picker')
      if (
        emojiPicker &&
        !emojiPicker.contains(event.target) &&
        !event.target.closest('button')
      ) {
        this.showEmojiPicker = false
        document.removeEventListener(
          'click',
          this.closeEmojiPickerOnOutsideClick
        )
      }
    },
  },
}
</script>

<style scoped>
@import '../assets/css/image-background.css';

.message-center {
  display: flex;
  width: 80vw;
  height: 87vh;
  padding: 0;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  /* background-image: url('../assets/images/design.png');
    background-size: cover; */
}

.sidebar {
  height: 87vh;
  width: 6%;
  overflow-y: auto;
  padding-right: 0;
  margin-top: 10px;
  /* background-color: #C59F59; */
  padding: 0;
  border-radius: 8vw 0 0 8vw;
}

.sidebar-item {
  height: 43vh !important;
  background-color: #c59f59 !important;
  opacity: 1;
  color: white !important;
  display: flex;
  flex-direction: column;
  /* 子元素垂直排列 */
  justify-content: space-between;
  /* 顶部、底部空间分布 */
  align-items: center;
  /* 水平居中 */
  transition: 0.3s ease;
}

.sidebar-title {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 2.2rem;
  padding-top: 50px;
}

.message-card {
  background-color: unset;
  height: 100%;
}

.direct-message-list {
  height: 84vh;
  /* border-left: 10px solid #EC0017; */
  /* border-top: 5px solid #EC0017; */
  background-color: #dfcba4;
  padding: 0;

  /* &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 20px;
        height: 100%;
        background-color: #EC0017;
        transform: translateX(0px);
    } */
}

.message-item {
  background-color: unset;
  /* border-left: 2px solid #000;
    border-top: 2px solid #000;
    border-bottom: 2px solid #000; */
  /* color: white; */
  box-shadow: 2px 2px 5px 0px rgba(0, 0, 0, 0.75);
  margin-bottom: 10px;
  height: 100px;
  transition: 0.3s ease;
}

.grey-background {
  position: relative;
  background: radial-gradient(
    circle,
    rgb(0, 255, 247, 0.8) 30%,
    #e8dabd 30%
  ) !important;
  border-right: none !important;
  background-size: 16vw 20vw !important;
  background-position: 10vw center !important;
  color: #000;
}

.active {
  background: radial-gradient(
    circle,
    rgb(0, 255, 247, 0.8) 30%,
    #dfcba4 30%
  ) !important;
  /* Button background */
  background-size: 25vw 25vw !important;
  background-position: center -12vh !important;
  /* Adjust the position of the circle */
  color: #03381c !important;
  opacity: 1 !important;
}

.alert-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #ff6666;
  color: white;
  border-radius: 50%;
  padding: 0.3em 0.8em;
  font-size: 0.7em;
}

.partner-card {
  height: 6%;
  background-color: #dfcba4;
  color: #03381c;
  border-bottom: 2px solid #977535;
  border-top-right-radius: 8vw !important;
}

.picker-container {
  position: relative;
  top: 61vh;
  left: -25px;
  justify-content: space-between;
  align-items: center;
  padding: 20px 10px 20px 10px;
  background-color: #c59f59;
  height: 23vh;
  min-width: 100px;
  margin: 0;
  border-bottom-right-radius: 8vw;
}

.emoji-picker {
  position: relative;
  bottom: 360px;
  right: 200px;
  z-index: 10;
  max-height: 300px;
}

.emoji-picker-btn {
  font-size: 1.5rem;
  /* Adjust size as needed */
  line-height: 1;
  /* Ensure proper alignment */
  padding-left: 5px;
}

.image-picker-btn {
  line-height: 1;
  /* Ensure proper alignment */
  padding-bottom: 10px;
  padding-left: 5px;
}

.textarea {
  height: 18%;
  /* border-radius: 0 0 16px 0; */
  border-top: 2px solid #977535;
  border-right: 2px solid #977535;
  border-bottom: 2px solid #977535;
  background-color: white;
}

.send {
  position: absolute;
  top: 84vh;
  right: 5vw;
  z-index: 10;

  &::after {
    content: '';
    position: absolute;
    right: -30px;
    top: -70px;
    transform: translateY(-50%);
    height: 80px;
    width: 138.4px;
    background-color: rgba(236, 0, 23, 0.8);
    clip-path: polygon(0% 0%, 100% 50%, 0% 100%);
    transform: rotate(-28deg);
  }

  &::before {
    content: '';
    position: absolute;
    right: -80px;
    top: -56px;
    transform: translateY(-50%);
    height: 120px;
    width: 120px;
    border-radius: 100%;
    background-color: #fff;
    pointer-events: none;
    /* Disable click events */
  }
}

.send-text {
  position: relative;
  right: 50px;
  top: -20px;
  font-size: 1.2rem;
  color: #fff;
  line-height: 1;
  padding-bottom: 10px;
  padding-left: 5px;
  transform: rotate(-28deg);
  z-index: 10;
}
</style>
