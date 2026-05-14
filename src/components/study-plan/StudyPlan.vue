<template>
  <div class="study-plan">
    <div class="edit-button-container">
      <!-- Edit Button -->
      <!-- Edit Button: only show if the user is the owner -->
      <v-btn
        v-if="isOwner"
        small
        variant="text"
        color="blue"
        @click="toggleEditMode"
      >
        {{ isEditMode ? $t('canceledit') : $t('edit') }}
      </v-btn>
    </div>

    <!-- Render the new form component in edit mode -->
    <EditStudyPlanForm
      v-if="isEditMode"
      :studyPlan="studyPlan"
      @save-study-plan="saveStudyPlan"
    />
    <div v-else>
      <v-tooltip
        :text="`学习进度：${studyPlan.progressPercentage} %`"
        location="up"
      >
        <template v-slot:activator="{ props }">
          <v-progress-linear
            v-bind="props"
            :model-value="studyPlan.progressPercentage"
            color="text"
            height="15"
            striped
          ></v-progress-linear>
        </template>
      </v-tooltip>
      <!-- <v-spacer style="height: 5px;"></v-spacer> -->
      <v-tooltip
        :text="`额外学习了${studyPlan.advancedTopicProgressPercentage} %的进阶内容`"
        location="up"
      >
        <template v-slot:activator="{ props }">
          <v-progress-linear
            v-if="studyPlan.advancedTopicProgressPercentage > 0"
            v-bind="props"
            :model-value="studyPlan.advancedTopicProgressPercentage"
            color="accent"
            height="15"
            striped
          ></v-progress-linear></template
      ></v-tooltip>
      <v-spacer style="height: 20px"></v-spacer>
      <div class="d-flex align-center mb-1">
        <h2 class="mr-2">{{ studyPlan.title }}</h2>
        <TagChips v-if="Array.isArray(studyPlan.tags) && studyPlan.tags.length" :items="studyPlan.tags" />
      </div>
      <p>{{ studyPlan.introduction.description }}</p>

      <h2>{{ $t('studyplan.prerequisites') }}</h2>
      <ul class="prerequisite-list">
        <div
          v-for="(lesson, key) in studyPlan.prerequisite"
          :key="key"
          class="item-box"
          @click="toggleDetails(key, 'prerequisite')"
        >
          <v-progress-linear
            :model-value="lesson.progressPercentage"
            v-if="lesson.resources[0] != null"
            color="text"
            height="10"
            striped
          ></v-progress-linear>
          <div class="title d-flex align-center">
            <span>{{ lesson.name }}</span>
          </div>
          <TagChips v-if="Array.isArray(lesson.tags) && lesson.tags.length" :items="lesson.tags" class="mb-2" />
          <div v-if="detailsVisible.prerequisite[key]" class="description">
            {{ lesson.description }}
            <!-- Resource Link Previews for Prerequisite Lessons -->
            <div
              v-if="lesson.resources[0] != null"
              class="link-previews-container"
            >
              <v-card
                max-width="300px"
                v-for="resource in lesson.resources"
                :key="resource"
                class="link-preview-container"
              >
                <v-card-item>
                  <LinkPreview :url="resource.link" />
                  <!-- Checkbox to mark the resource as learned -->
                  <!-- Checkbox: disable if the user is not the owner -->
                  <div class="resource-checkbox-wrap">
                    <v-checkbox
                      :model-value="resource.learned === true"
                      :disabled="!isOwner || isResourceBusy(resource)"
                      class="resource-status-checkbox"
                      :class="{ 'resource-status-checkbox--busy': isResourceBusy(resource) }"
                      @click.stop
                      @update:model-value="(value) => markResourceAsLearned(resource, lesson, value)"
                      :label="resource.learned ? '已完成' : '未完成'"
                    >
                    </v-checkbox>
                    <span v-if="isResourceBusy(resource)" class="resource-status-checkbox__spinner">
                      <v-progress-circular indeterminate :size="12" :width="2" color="primary" />
                    </span>
                  </div>
                </v-card-item>
              </v-card>
            </div>
          </div>
        </div>
      </ul>
      <div class="py-3"></div>
      <h2>{{ $t('studyplan.maincurriculum') }}</h2>
      <div class="main-curriculum">
        <div
          v-for="(lesson, key) in studyPlan.mainCurriculum"
          :key="key"
          class="module-wrapper"
        >
          <div
            v-if="!isFirstKey(key)"
            class="arrow"
            :style="{ backgroundImage: 'url(' + rightArrowUrl + ')' }"
          ></div>
          <div
            class="module item-box"
            @click="toggleDetails(key, 'mainCurriculum')"
          >
            <v-progress-linear
              :model-value="lesson.progressPercentage"
              v-if="lesson.resources[0] != null"
              color="text"
              height="10"
              striped
            ></v-progress-linear>
            <div class="title d-flex align-center">
              <span>{{ lesson.name }}</span>
            </div>
            <TagChips v-if="Array.isArray(lesson.tags) && lesson.tags.length" :items="lesson.tags" class="mb-2" />
            <div v-if="detailsVisible.mainCurriculum[key]" class="description">
              {{ lesson.description }}
              <!-- Flex container for link previews -->
              <div class="link-previews-container">
                <!-- Resource Link Previews for Main Curriculum Lessons -->
                <div
                  v-if="lesson.resources[0] != null"
                  class="link-previews-container"
                >
                  <v-card
                    max-width="300px"
                    v-for="resource in lesson.resources"
                    :key="resource"
                    class="link-preview-container"
                  >
                    <v-card-item>
                      <LinkPreview :url="resource.link" />
                      <!-- Checkbox to mark the resource as learned -->
                      <!-- Checkbox: disable if the user is not the owner -->
                      <div class="resource-checkbox-wrap">
                        <v-checkbox
                          :model-value="resource.learned === true"
                          :disabled="!isOwner || isResourceBusy(resource)"
                          class="resource-status-checkbox"
                          :class="{ 'resource-status-checkbox--busy': isResourceBusy(resource) }"
                          @click.stop
                          @update:model-value="(value) => markResourceAsLearned(resource, lesson, value)"
                          :label="resource.learned ? '已完成' : '未完成'"
                        >
                        </v-checkbox>
                        <span v-if="isResourceBusy(resource)" class="resource-status-checkbox__spinner">
                          <v-progress-circular indeterminate :size="12" :width="2" color="primary" />
                        </span>
                      </div>
                    </v-card-item>
                  </v-card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="py-3"></div>
      <h2
        v-if="studyPlan.advancedTopics && studyPlan.advancedTopics.length > 0"
      >
        {{ $t('studyplan.advancedtopics') }}
      </h2>
      <div class="advanced-topics">
        <div
          v-for="(lesson, key) in studyPlan.advancedTopics"
          :key="key"
          class="item-box"
          @click="toggleDetails(key, 'advancedTopics')"
        >
          <v-progress-linear
            :model-value="lesson.progressPercentage"
            v-if="lesson.resources[0] != null"
            color="accent"
            height="10"
            striped
          ></v-progress-linear>
          <div class="title d-flex align-center">
            <span>{{ lesson.name }}</span>
          </div>
          <TagChips v-if="Array.isArray(lesson.tags) && lesson.tags.length" :items="lesson.tags" class="mb-2" />
          <div v-if="detailsVisible.advancedTopics[key]" class="description">
            {{ lesson.description }}
            <!-- Flex container for link previews -->
            <div class="link-previews-container">
              <!-- Resource Link Previews for Main Curriculum Lessons -->
              <div
                v-if="lesson.resources[0] != null"
                class="link-previews-container"
              >
                <v-card
                  max-width="300px"
                  v-for="resource in lesson.resources"
                  :key="resource"
                  class="link-preview-container"
                >
                  <v-card-item>
                    <LinkPreview :url="resource.link" />
                    <!-- Checkbox to mark the resource as learned -->
                    <!-- Checkbox: disable if the user is not the owner -->
                    <div class="resource-checkbox-wrap">
                      <v-checkbox
                        :model-value="resource.learned === true"
                        :disabled="!isOwner || isResourceBusy(resource)"
                        class="resource-status-checkbox"
                        :class="{ 'resource-status-checkbox--busy': isResourceBusy(resource) }"
                        @click.stop
                        @update:model-value="(value) => markResourceAsLearned(resource, lesson, value)"
                        :label="resource.learned ? '已完成' : '未完成'"
                      >
                      </v-checkbox>
                      <span v-if="isResourceBusy(resource)" class="resource-status-checkbox__spinner">
                        <v-progress-circular indeterminate :size="12" :width="2" color="primary" />
                      </span>
                    </div>
                  </v-card-item>
                </v-card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import confetti from 'canvas-confetti'
import rightArrow from '@/assets/images/right-arrow-next.svg'
import { apiClient } from '@/api'
import LinkPreview from '@/components/knowledge/LinkPreview.vue'
import TagChips from '@/components/common/TagChips.vue'
import EditStudyPlanForm from './EditStudyPlanForm.vue'

export default {
  props: {
    studyPlan: {
      type: Object,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  components: {
    LinkPreview,
    EditStudyPlanForm,
    TagChips,
  },
  computed: {
    isOwner() {
      return this.userId === this.$store.state.currentUserID // Assuming the study plan object contains an ownerId field
    },
  },

  data() { return { 
      isEditMode: false, // Track edit mode state
      localStudyPlan: JSON.parse(JSON.stringify(this.studyPlan)), // Local copy for editing
      detailsVisible: {
        prerequisite: {},
        mainCurriculum: {},
        advancedTopics: {},
      },
      rightArrowUrl: rightArrow,
      isCelebrating: false,
      busyResourceKeys: {},
    }
  },
  methods: {
    resourceKey(resource) {
      return String(resource?.id || resource?.resourceId || resource?.link || resource?.url || resource?.name || '')
    },
    isResourceBusy(resource) {
      return !!this.busyResourceKeys[this.resourceKey(resource)]
    },
    setResourceBusy(resource, busy) {
      const key = this.resourceKey(resource)
      if (!key) return
      this.busyResourceKeys = {
        ...this.busyResourceKeys,
        [key]: busy,
      }
    },
    toggleEditMode() {
      this.isEditMode = !this.isEditMode
    },

    async saveStudyPlan() {
      try {
        // API call to save the updated study plan
        await apiClient.post(`/StudyPlan/UpdateStudyPlan`, {
          studyPlan: this.localStudyPlan,
        })
        alert(this.$t('studyplan.savesuccessmsg'))
      } catch (error) {
        console.error('Failed to update study plan:', error)
        alert(this.$t('studyplan.savefailedmsg'))
      }
    },

    async toggleDetails(lessonIndex, lessonType) {
      // Toggle visibility
      this.detailsVisible[lessonType][lessonIndex] =
        !this.detailsVisible[lessonType][lessonIndex]

      if (!this.detailsVisible[lessonType][lessonIndex]) {
        return // Collapse the details without fetching previews again
      }
    },

    isFirstKey(currentKey) {
      const keys = Object.keys(this.studyPlan.mainCurriculum)
      return currentKey === keys[0]
    },

    async markResourceAsLearned(resource, lesson, nextValue) {
      if (this.isResourceBusy(resource)) return
      // Store the initial learned status
      const wasLearned = resource.learned === true
      const next = nextValue === true
      if (next === wasLearned) return

      if (!next) {
        // If trying to unlearn, confirm the action
        const confirmed = confirm(this.$t('studyplan.confirmMarkUnfinished') || 'Are you sure to mark it as not completed?')
        if (!confirmed) {
          // If the user cancels, revert the learned status and exit the method
          // resource.learned = !wasLearned;
          return
        }
      } else {
        // If learning for the first time, no confirmation needed
        // Show celebration if marking as learned for the first time
        this.launchConfetti() // Show confetti when marking as learned
      }

      resource.learned = next
      this.setResourceBusy(resource, true)

      try {
        // API call to update the backend with the new learned status
        await apiClient.post(
          '/StudyPlan/LearningLessons/ToggleFinishedLearning',
          {
            name: lesson.name,
            link: resource.link,
          }
        )
        // Handle any additional UI updates or state management here

        // Emit an event or call a method to refresh the UI as needed
        this.$emit('resourceUpdated')
      } catch (error) {
        console.error('Error updating resource learned status:', error)
        // Revert the change in case of an API error
        resource.learned = wasLearned
        // Optionally, inform the user that the update failed
      } finally {
        this.setResourceBusy(resource, false)
      }
    },

    launchConfetti() {
      const end = Date.now() + 10 * 1000 // 15 seconds duration
      const colors = ['#EC0017', '#E2B43C', '00FFF7'] // Custom colors

      ;(function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 }, // Left side
          colors: colors,
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 }, // Right side
          colors: colors,
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame) // Continue animation
        }
      })()
    },
  },
}
</script>

<style>
@import '../../assets/css/resource-status.css';
@import '../../assets/css/link-preview.css';

.prerequisite-list,
.main-curriculum,
.advanced-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  /* Adjust the space between boxes */
}

.item-box {
  position: relative;
  overflow: hidden;
  /* Ensure the pseudo-element doesn't extend outside the box */
  flex: 0 0 auto;
  /* Adjust this to control the size of the boxes */
  background-color: white;
  /* Example background color */
  border: 1px solid #304e75;
  /* Example border */
  border-radius: 0px;
  /* Rounded corners */
  padding: 10px;
  box-shadow: 0 2px 4px E8DABD;
  /* Example shadow */
  cursor: pointer;
  transition: transform 0.3s ease;
  margin-bottom: 20px;
  /* Ensure there's space for the progress bar */
}

.item-box:hover {
  transform: translateY(-5px);
  /* Slight raise effect on hover */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.title,
.description {
  margin: 5px 0;
  /* Adjust spacing inside each box */
}

.main-curriculum {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  /* Space for the first arrow, adjust as needed */
}

.module-wrapper {
  display: inline-flex;
  /* Use inline-flex to allow variable width */
  position: relative;
  padding-left: 20px;
  /* Space for the arrow */
}

.module-wrapper:first-child {
  padding-left: 0;
  /* No padding for the very first item */
}

.module-wrapper:first-child::before {
  content: none;
  /* No arrow before the first item */
}

.arrow {
  width: 24px;
  /* Adjust as per your SVG's aspect ratio */
  height: 24px;
  /* Adjust as per your SVG's aspect ratio */
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  margin-right: 20px;
  /* Space between arrow and box */
  margin-top: 10px;
}
</style>






