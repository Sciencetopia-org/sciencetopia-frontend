// store.js or src/store/index.js

import { createStore } from 'vuex'
import { apiClient } from '@/api' // Adjust the path to your api.js file
import { startConnection, stopConnection } from '@/services/signalr-service'
import { normalizeDateString, dateStrToIsoWithLocalOffset, dateStrToIsoZulu } from '@/utils/date'

const store = createStore({
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
    learningStatus: {},
    backgroundGenerating: false,

    // =========================
    // Global normalized entities
    // =========================
    /**
     * @typedef {Object} PlanLite
     * @property {string|number} id
     * @property {string} title
     * @property {string} [description]
     * @property {string|number} [currentVersionId]
     * @property {string} [visibility] // public | group | private
     */
    /** @type {Record<string|number, PlanLite>} */
    plansById: {},

    /**
     * @typedef {Object} Cohort
     * @property {string|number} id
     * @property {string|number} studyPlanId
     * @property {string} [title]
     * @property {string|number|null} [studyGroupId]
     * @property {string} [enrollMode] // public | group | solo
     * @property {string|number} [pinnedVersionId]
     * @property {number} [membersCount]
     * @property {string} [createdAt]
     * @property {string|number} [createdBy]
     */
    /** @type {Record<string|number, Cohort>} */
    cohortsById: {},

    /**
     * @typedef {Object} Enrollment
     * @property {string|number|null} activeCohortId
     * @property {string} [role]
     * @property {string} [joinedAt]
     * @property {Array<string|number>} [archivedCohortIds]
     */
    /** @type {Record<string|number, Enrollment>} */
    enrollmentByPlan: {},

    /**
     * @typedef {Object} Group
     * @property {string|number} id
     * @property {string} name
     * @property {string} [myRole]
     * @property {number} [membersCount]
     */
    /** @type {Record<string|number, Group>} */
    groupsById: {},

    /** @type {Record<string|number, any>} */
    cohortAggregatesById: {},
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
    SET_LEARNING_STATUS(state, { lessonName, resourceLink, learned }) {
      state.learningStatus[`${lessonName}-${resourceLink}`] = learned
    },
    SET_BACKGROUND_GENERATING(state, value) {
      state.backgroundGenerating = value
    },

    // =========== Entities mutations ===========
    UPSERT_PLAN(state, plan) {
      if (!plan || plan.id == null) return
      state.plansById[plan.id] = { ...state.plansById[plan.id], ...plan }
    },
    UPSERT_PLANS(state, plans) {
      if (!Array.isArray(plans)) return
      for (const p of plans) {
        if (!p || p.id == null) continue
        state.plansById[p.id] = { ...state.plansById[p.id], ...p }
      }
    },
    UPSERT_COHORT(state, cohort) {
      if (!cohort || cohort.id == null) return
      state.cohortsById[cohort.id] = { ...state.cohortsById[cohort.id], ...cohort }
    },
    UPSERT_COHORTS(state, cohorts) {
      if (!Array.isArray(cohorts)) return
      for (const c of cohorts) {
        if (!c || c.id == null) continue
        state.cohortsById[c.id] = { ...state.cohortsById[c.id], ...c }
      }
    },
    SET_ENROLLMENT_FOR_PLAN(state, { planId, enrollment }) {
      if (planId == null) return
      state.enrollmentByPlan[planId] = { ...state.enrollmentByPlan[planId], ...enrollment }
    },
    UPSERT_GROUP(state, group) {
      if (!group || group.id == null) return
      state.groupsById[group.id] = { ...state.groupsById[group.id], ...group }
    },
    SET_COHORT_AGGREGATE(state, { cohortId, aggregate }) {
      if (cohortId == null) return
      state.cohortAggregatesById[cohortId] = aggregate
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
      if (!formRef || !formRef.validate?.()) return

      try {
        // 1) 规范化前端状态里的生日（确保是 'YYYY-MM-DD'）
        const birthDateStr = normalizeDateString(state.userInfo.formattedBirthDate)

        // 2) 生成提交给后端的 ISO —— 二选一：
        //    (A) 推荐：带本地时区偏移（如 +09:00）
        const birthDateIso = dateStrToIsoWithLocalOffset(birthDateStr)

        //    (B) 如果后端必须 Z（UTC），改用：
        // const birthDateIso = dateStrToIsoZulu(birthDateStr)

        // 3) 组装 payload（注意把 birthDate 设置为 ISO）
        const payload = {
          selfIntroduction: state.userInfo.selfIntroduction,
          gender: state.userInfo.gender,
          birthDate: birthDateIso, // ← 后端要求 ISO（含时间）
        }

        const responseInfo = await apiClient.put('/users/UserInformation/Update', payload)

        let responseUserName
        if (state.userInfo.userName !== state.userInfo.originalUsername) {
          responseUserName = await apiClient.post(
            '/users/UserInformation/ChangeUsername',
            { newUsername: state.userInfo.userName }
          )
        }

        if (responseInfo.status === 200 && (!responseUserName || responseUserName.status === 200)) {
          alert('User information updated successfully')

          // 4) 提交成功后，保持前端 state 里仍为 'YYYY-MM-DD'，不存 ISO，避免显示跨天
          const newUserInfo = {
            ...state.userInfo,
            formattedBirthDate: birthDateStr,
          }
          commit('updateUserInfo', newUserInfo)
          console.log('updated user info:', newUserInfo)
        }
      } catch (error) {
        console.error('Error updating user info:', error)
        // TODO: 你的错误提示
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

    // =========================
    // Route: /plans/:planId loader chain (F0-2)
    // =========================
    async loadPlanRouteContext({ commit }, planId) {
      if (!planId) return
      try {
        // GET /plans/:planId
        const planRes = await apiClient.get(`/plans/${planId}`)
        const plan = planRes?.data || null
        if (plan) commit('UPSERT_PLAN', plan)

        // GET /plans/:planId/enrollment/me
        let enrollment = null
        try {
          const enrRes = await apiClient.get(`/plans/${planId}/enrollment/me`)
          enrollment = enrRes?.data || null
          if (enrollment) commit('SET_ENROLLMENT_FOR_PLAN', { planId, enrollment })
        } catch (e) {
          // No enrollment is acceptable; keep null
          // console.warn('enrollment not found for plan', planId)
        }

        // If there is an active cohort, load its details + aggregate
        const activeCohortId = enrollment?.activeCohortId
        if (activeCohortId != null) {
          try {
            const cohortRes = await apiClient.get(`/cohorts/${activeCohortId}`)
            const cohort = cohortRes?.data || null
            if (cohort) commit('UPSERT_COHORT', cohort)
          } catch (e) {
            // ignore cohort errors for initial paint
          }
          try {
            const aggRes = await apiClient.get(`/cohorts/${activeCohortId}/aggregate`)
            const aggregate = aggRes?.data || null
            if (aggregate) commit('SET_COHORT_AGGREGATE', { cohortId: activeCohortId, aggregate })
          } catch (e) {
            // ignore aggregate errors for initial paint
          }
        }
      } catch (e) {
        console.error('Failed to load plan route context', e)
      }
    },
  },

  getters: {
    // Getter to access the isEditing state
    isEditing: (state) => state.isEditing,
    planById: (state) => (id) => state.plansById[id] || null,
    enrollmentOfPlan: (state) => (planId) => state.enrollmentByPlan[planId] || null,
    cohortById: (state) => (id) => state.cohortsById[id] || null,
    cohortAggregateById: (state) => (id) => state.cohortAggregatesById[id] || null,
  },
})

// Initialize mock state for dev visibility in devtools (F0-1)
if (process.env.NODE_ENV !== 'production') {
  try {
    const mockPlan = {
      id: 'p-demo-1',
      title: 'Demo Plan: Web Basics',
      description: 'HTML/CSS/JS foundations',
      currentVersionId: 'v1',
      visibility: 'public',
    }
    const mockCohort = {
      id: 'c-demo-1',
      studyPlanId: mockPlan.id,
      title: 'Public Cohort A',
      studyGroupId: null,
      enrollMode: 'public',
      pinnedVersionId: 'v1',
      membersCount: 12,
      createdAt: new Date().toISOString(),
      createdBy: 'u-1',
    }
    const mockGroup = {
      id: 'g-demo-1',
      name: 'Frontend Ninjas',
      myRole: 'member',
      membersCount: 8,
    }
    store.commit('UPSERT_PLAN', mockPlan)
    store.commit('UPSERT_COHORT', mockCohort)
    store.commit('UPSERT_GROUP', mockGroup)
    store.commit('SET_ENROLLMENT_FOR_PLAN', {
      planId: mockPlan.id,
      enrollment: {
        activeCohortId: mockCohort.id,
        role: 'member',
        joinedAt: new Date().toISOString(),
        archivedCohortIds: [],
      },
    })
  } catch (e) {
    // ignore if store not ready
  }
}

export default store
