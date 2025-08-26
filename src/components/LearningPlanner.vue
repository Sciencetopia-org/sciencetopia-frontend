<!-- Planner.vue -->
<template>
  <div>
    <input
      type="text"
      v-model="learningObjective"
      :placeholder="$t('studyplan.placeholder')"
      @update:model-value="$emit('dirty')"
    />
    <button :disabled="!learningObjective" @click="generateStudyPlan">
      {{ $t('studyplan.startcustomizing') }}
    </button>

    <!-- Loader Spinner -->
    <div v-if="loading" class="loader">{{ $t('studyplan.AIplaceholder') }}</div>

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
      loading: false, // Add this to track loading state
    }
  },
  methods: {
    async generateStudyPlan() {
      if (this.learningObjective) {
        this.loading = true // Start loading

        console.log('Generating study plan for:', this.learningObjective)

        try {
          const response = await pyApiClient.post('/studyplan', {
            Name: this.learningObjective,
          })

          console.log('Study plan generated:', response)

          if (response.status === 200) {
            this.studyPlanData = response.data.StudyPlan // Set study plan data from the backend response
            this.showStudyPlan = true // Display the study plan component
            this.$emit('update:showStudyPlan', true) // Emit an event to the parent component
            console.log('Study plan generated:', this.studyPlanData)
          } else {
            console.error('Failed to fetch the study plan:', response)
          }
        } catch (error) {
          console.error('Error in fetching study plan:', error)
        } finally {
          this.loading = false // End loading
        }
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
