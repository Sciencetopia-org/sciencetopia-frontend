// store.js or src/store/index.js

import { createStore } from 'vuex'
import { apiClient } from '@/api' // Adjust the path to your api.js file
import { startConnection, stopConnection } from '@/services/signalr-service'

export default createStore({
  state: {
    isAuthenticated: false,
    avatarUrl: '头像URL',
    currentUserID: null,
    userInfo: {
      userName: '',
      email: '',
      phoneNumber: '',
      gender: '',
      formattedBirthDate: '',
      selfIntroduction: '',
      originalUsername: '',
    },
    selectedNodes: [],
    isEditing: false,
    displayNodeCreationForm: false,
    displayLinkCreationForm: false,
    messageCount: 0,
    conversationMessageCount: {},
    notificationCount: 0,
  },
  mutations: {
    SET_AUTHENTICATED(state, value) {
      state.isAuthenticated = value
    },
    SET_CURRENT_USER_ID(state, userId) {
      state.currentUserID = userId
    },
    RESET_CURRENT_USER_ID(state) {
      state.currentUserID = null
    },
    SET_AVATAR_URL(state, value) {
      state.avatarUrl = value
    },
    setUserInfo(state, userInfo) {
      state.userInfo = userInfo
    },
    updateUserInfo(state, updatedInfo) {
      Object.assign(state.userInfo, updatedInfo)
    },
    setSelectedNodes(state, node) {
      state.selectedNodes = [node]
    },
    addSelectedNode(state, node) {
      // Only add or modify the second node if the first node already exists
      if (
        state.selectedNodes.length > 0 &&
        state.selectedNodes[0].id !== node.id
      ) {
        if (state.selectedNodes.length === 1) {
          state.selectedNodes.push(node) // Add as the second node
        } else {
          // If there is already a second node, replace it
          state.selectedNodes[1] = node
        }
      }
    },
    removeSelectedNode(state, node) {
      state.selectedNodes = state.selectedNodes.filter((n) => n.id !== node.id)
    },
    resetSelectedNodes(state) {
      state.selectedNodes = []
    },
    // Mutation to toggle the isEditing state
    TOGGLE_EDIT_MODE(state) {
      state.isEditing = !state.isEditing
    },
    RESET_EDIT_MODE(state) {
      state.isEditing = false
      state.displayNodeCreationForm = false
    },
    SET_DISPLAY_NODE_CREATION_FORM(state, newValue) {
      state.displayNodeCreationForm = newValue
    },
    SET_DISPLAY_LINK_CREATION_FORM(state, newValue) {
      state.displayLinkCreationForm = newValue
    },
    setMessageCount(state, count) {
      state.messageCount = count
    },
    incrementMessageCount(state) {
      state.messageCount++
    },
    resetMessageCount(state) {
      state.messageCount = 0
    },
    setNotificationCount(state, count) {
      state.notificationCount = count
    },
    incrementNotificationCount(state) {
      state.notificationCount++
    },
    resetNotificationCount(state) {
      state.notificationCount = 0
    },
    setConversationMessageCount(
      state,
      { conversationId, conversationMessageCount }
    ) {
      state.conversationMessageCount[conversationId] = conversationMessageCount
    },
    incrementConversationMessageCount(state, conversationId) {
      if (state.conversationMessageCount[conversationId] !== undefined) {
        state.conversationMessageCount[conversationId]++
      } else {
        state.conversationMessageCount[conversationId] = 1
      }
    },
    resetConversationMessageCount(state, conversationId) {
      state.conversationMessageCount[conversationId] = 0
    },
  },
  actions: {
    connectSignalR() {
      startConnection()
    },
    disconnectSignalR({ commit }) {
      stopConnection()
      commit('resetMessageCount')
      commit('resetNotificationCount')
    },

    async goToProfile(_, { userId, router }) {
      // Perform route navigation using the router instance
      router.push({ name: 'personalcenter', params: { userId } })
    },

    async checkAuthenticationStatus({ commit }) {
      try {
        const response = await apiClient.get('/users/Account/AuthStatus')
        const isAuthenticated = response.data.isAuthenticated
        const userId = response.data.userId
        commit('SET_AUTHENTICATED', isAuthenticated)
        commit('SET_CURRENT_USER_ID', userId)
        if (isAuthenticated) {
          await this.dispatch('fetchUserAvatar')
          this.dispatch('connectSignalR') // Connect SignalR when authenticated
        } else {
          this.dispatch('disconnectSignalR') // Disconnect SignalR when not authenticated
        }
      } catch (error) {
        console.error('Error checking authentication status:', error)
      }
    },
    setCurrentUserID({ commit }, userId) {
      commit('SET_CURRENT_USER_ID', userId)
    },
    resetCurrentUserID({ commit }) {
      commit('RESET_CURRENT_USER_ID')
    },
    async fetchUserAvatar({ commit }) {
      try {
        const response = await apiClient.get('/users/Account/GetAvatarUrl')
        if (response && response.data) {
          commit('SET_AVATAR_URL', response.data.avatarUrl)
          // console.log('User avatar url:', response.data.avatarUrl);
        }
      } catch (error) {
        console.error('Error fetching user avatar:', error)
      }
    },
    async fetchUserInfo({ commit }) {
      try {
        const response = await apiClient.get(
          '/users/UserInformation/GetUserInfo'
        )
        commit('setUserInfo', response.data)
      } catch (error) {
        console.error('Error fetching user info:', error)
        // Handle the error appropriately
      }
    },
    async updateUserInfo({ commit, state }, { formRef }) {
      if (formRef.validate()) {
        try {
          const responseInfo = await apiClient.put(
            '/users/UserInformation/Update',
            {
              selfIntroduction: state.userInfo.selfIntroduction,
              gender: state.userInfo.gender,
              birthDate: state.userInfo.formattedBirthDate,
            }
          )

          let responseUserName
          if (state.userInfo.userName !== state.userInfo.originalUsername) {
            responseUserName = await apiClient.post(
              '/users/UserInformation/ChangeUsername',
              { newUsername: state.userInfo.userName }
            )
          }

          if (
            responseInfo.status === 200 &&
            (!responseUserName || responseUserName.status === 200)
          ) {
            alert('User information updated successfully')
            commit('updateUserInfo', state.userInfo)
            console.log('updated user info:', state.userInfo)
          }
        } catch (error) {
          console.error('Error updating user info:', error)
          // Handle the error appropriately
        }
      }
    },
    async fetchAvatarUrl(_, userId) {
      try {
        const response = await apiClient.get(
          `/AllUsers/GetUserAvatarById/${userId}`
        )
        return response.data.avatarUrl
      } catch (error) {
        console.error('Error fetching avatar URL:', error)
        return (await import('@/assets/images/default_avatar.png')).default // Fallback avatar
      }
    },
    async fetchUserInfoById(_, userId) {
      try {
        const response = await apiClient.get(
          `/AllUsers/GetUserInfoById/${userId}`
        )
        return response.data
      } catch (error) {
        console.error('Error fetching user info:', error)
        return null
      }
    },
    // Action to commit the toggle mutation
    toggleEditMode({ commit }) {
      commit('TOGGLE_EDIT_MODE')
    },
    toggleNodeCreationForm({ commit }, newValue) {
      commit('SET_DISPLAY_NODE_CREATION_FORM', newValue)
    },
    toggleLinkCreationForm({ commit }, newValue) {
      commit('SET_DISPLAY_LINK_CREATION_FORM', newValue)
      console.log('Link creation form:', newValue)
    },
    updateMessageCount({ commit }, messageCount) {
      commit('setMessageCount', messageCount)
    },
    updateConversationMessageCount(
      { commit },
      { conversationId, conversationMessageCount }
    ) {
      commit('setConversationMessageCount', {
        conversationId,
        conversationMessageCount,
      })
    },
    incrementMessageCount({ commit }) {
      commit('incrementMessageCount')
    },
    incrementConversationMessageCount({ commit }, conversationId) {
      commit('incrementConversationMessageCount', conversationId)
    },
    resetMessageCount({ commit }) {
      commit('resetMessageCount')
    },
    markMessagesAsRead({ commit }, conversationId) {
      commit('resetConversationMessageCount', conversationId)
    },
    updateNotificationCount({ commit }, notificationCount) {
      commit('setNotificationCount', notificationCount)
    },
    incrementNotificationCount({ commit }) {
      commit('incrementNotificationCount')
    },
    resetNotificationCount({ commit }) {
      commit('resetNotificationCount')
    },
    markNotificationsAsRead({ commit }) {
      commit('resetNotificationCount')
    },
  },

  getters: {
    // Getter to access the isEditing state
    isEditing: (state) => state.isEditing,
  },
})
