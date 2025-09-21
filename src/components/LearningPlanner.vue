<!-- Planner.vue -->
<template>
  <div>
    <input
      type="text"
      v-model="learningObjective"
      :placeholder="$t('studyplan.placeholder')"
      @update:model-value="$emit('dirty')"
    />
    <button :disabled="!learningObjective || $store.state.backgroundGenerating" @click="generateStudyPlan">
      {{ $t('studyplan.startcustomizing') }}
    </button>

    <!-- Loader Spinner -->
    <div v-if="loading" class="loader">
      {{ $t('studyplan.AIplaceholder') }}
      <button class="ml-2" @click="runInBackground">后台运行</button>
    </div>

    <study-plan
      v-if="showStudyPlan"
      :studyPlan="studyPlanData"
      @save-plan="savePlan"
    ></study-plan>
  </div>
</template>

<script>
import StudyPlan from './StudyPlan.vue'
import { apiClient, pyApiClient } from '@/api'

export default {
  components: {
    StudyPlan,
  },
  data() {
    return {
      learningObjective: '',
      showStudyPlan: false,
      studyPlanData: null,
      loading: false, // track loading state
      currentRequest: null,
      background: false,
    }
  },
  methods: {
    async generateStudyPlan() {
      if (!this.learningObjective) return
      if (this.$store.state.backgroundGenerating) {
        alert(this.$t('studyplan.ai.generatingTryLater'))
        return
      }
      this.loading = true
      this.background = false

      console.log('Generating study plan for:', this.learningObjective)

      const request = pyApiClient.post('/studyplan', {
        Name: this.learningObjective,
      })
      this.currentRequest = request

      try {
        const response = await request
        console.log('Study plan generated:', response)

        if (this.background) return // handled by parent when in background

        if (response.status === 200) {
          this.studyPlanData = response.data.StudyPlan
          // Immediately request smart tag suggestions based on payload and apply to UI
          try {
            const suggest = await apiClient.post('/StudyPlanTags/SuggestFromPayload', { payload: { studyPlan: this.studyPlanData } })
            const data = suggest?.data || {}
            const planTags = Array.isArray(data.planTags) ? data.planTags : []
            if (!Array.isArray(this.studyPlanData.tags)) this.studyPlanData.tags = []
            // keep names for easy display
            this.studyPlanData.tags = planTags.map(t => ({ id: t.id || t.Id, name: t.name || t.Name }))
            // Map lesson suggestions back
            const lessons = Array.isArray(data.lessons) ? data.lessons : []
            const attach = (list, secName) => {
              if (!Array.isArray(list)) return
              list.forEach((lesson, idx) => {
                const key = lesson?.id || `${secName}:${idx}:${lesson?.name}`
                const found = lessons.find(x => (x.lessonId && x.lessonId === lesson?.id) || (x.key && x.key === key))
                if (found) {
                  const tags = Array.isArray(found.tags) ? found.tags : []
                  lesson.tags = tags.map(t => ({ id: t.id || t.Id, name: t.name || t.Name }))
                }
              })
            }
            attach(this.studyPlanData.prerequisite, 'prerequisite')
            attach(this.studyPlanData.mainCurriculum, 'mainCurriculum')
            attach(this.studyPlanData.advancedTopics, 'advancedTopics')
          } catch (_) { /* ignore suggest errors */ }

          this.showStudyPlan = true
          this.$emit('update:showStudyPlan', true)
          console.log('Study plan generated:', this.studyPlanData)
        } else {
          console.error('Failed to fetch the study plan:', response)
        }
      } catch (error) {
        console.error('Error in fetching study plan:', error)
      } finally {
        this.loading = false
        this.currentRequest = null
      }
    },
    runInBackground() {
      if (this.loading && this.currentRequest) {
        this.background = true
        this.$emit('background', this.currentRequest)
      }
    },
    async savePlan() {
      if (this.studyPlanData) {
        this.loading = true
        try {
          // Construct the studyPlanDTO object
          const studyPlanDTO = {
            studyPlan: {
              // This matches the 'StudyPlan' property in your StudyPlanDTO class
              title: this.studyPlanData.title, // Assuming this is where the title comes from
              introduction: this.studyPlanData.introduction, // Assuming this is where the introduction comes from
              prerequisite: this.studyPlanData.prerequisite, // Populate this with the prerequisite lessons
              mainCurriculum: this.studyPlanData.mainCurriculum, // Assuming this is your main curriculum data
              advancedTopics: this.studyPlanData.advancedTopics, // Assuming this is your advanced topics data
            },
          }
          console.log('Saving study plan:', studyPlanDTO)

          // API endpoint is '/StudyPlan/SaveStudyPlan'
          const response = await apiClient.post(
            '/StudyPlan/SaveStudyPlan',
            studyPlanDTO
          )

          if (response.status === 200) {
            // Handle successful save
            alert(this.$t('studyplan.savesuccessmsg'))
            // Check if the current route is the user's personal center
            if (this.$route.name === 'personalcenter') {
              // Refresh the page
              this.$router.go() // This reloads the current route
            }
            // If not on the personal center page, do nothing
          } else {
            // Handle failure
            alert(this.$t('studyplan.savefailedmsg'))
            console.error('Failed to save the study plan:', response)
          }
        } catch (error) {
          if (error.response && error.response.status === 400) {
            alert(error.response.data) // Alert the message from backend
          } else {
            alert(this.$t('studyplan.savefailedmsg'))
            console.error('Failed to save the study plan:', error)
          }
        } finally {
          this.loading = false
        }
      } else {
        console.error('No study plan to save')
      }
    },
  },
}
</script>
