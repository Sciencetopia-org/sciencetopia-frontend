<template>
  <v-form @submit.prevent="saveStudyPlan">
    <!-- Top-right Save Button (optional) -->
    <div class="form-actions-top" v-if="showTopSave">
      <v-btn size="small" variant="text" color="blue" @click="saveStudyPlan">
        {{ $t('studyplan.save') }}
      </v-btn>
    </div>
    <!-- Title Input -->
    <v-text-field
      v-model="localStudyPlan.title"
      :label="$t('studyplan.title')"
      variant="outlined"
      density="compact"
      :rules="[rules.required]"
      @update:model-value="$emit('dirty')"
    ></v-text-field>

    <!-- Introduction Input -->
    <v-textarea
      v-model="localStudyPlan.introduction.description"
      :label="$t('studyplan.introduction')"
      :rules="[rules.required]"
      :auto-grow="true"
      rows="1"
      max-rows="5"
      variant="outlined"
      density="compact"
      @update:model-value="$emit('dirty')"
    ></v-textarea>

    <!-- Prerequisites Section -->
    <v-divider></v-divider>
    <div class="section-header">
      <h4>{{ $t('studyplan.prerequisites') }}</h4>
      <v-btn
        size="small"
        icon
        variant="text"
        @click="addLesson('prerequisite')"
        :disabled="localStudyPlan.prerequisite.length >= maxPrerequisiteLength"
        >➕️</v-btn
      >
    </div>

    <!-- Scrollable container for prerequisites -->
    <div class="scrollable-section" v-if="localStudyPlan.prerequisite.length">
      <div
        v-for="(lesson, index) in localStudyPlan.prerequisite"
        :key="index"
        class="lesson-section"
      >
        <div class="lesson-header">
          <v-ico>📚️</v-ico>
          <v-text-field
            v-model="lesson.name"
            :label="$t('studyplan.lessonname')"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
            @update:model-value="$emit('dirty')"
          ></v-text-field>
          <v-btn
            size="small"
            icon
            variant="text"
            @click="removeLesson('prerequisite', index)"
            >➖️</v-btn
          >
        </div>
        <v-textarea
          class="lesson-description"
          v-model="lesson.description"
          :label="$t('studyplan.lessondescription')"
          :auto-grow="true"
          rows="1"
          max-rows="5"
          variant="outlined"
          density="compact"
          @update:model-value="$emit('dirty')"
        ></v-textarea>

        <!-- Resources Management -->
        <div class="resource-section">
          <div class="section-header">
            <h5>{{ $t('studyplan.resouces') }}</h5>
            <h5 v-if="lesson.resources[0] == null">（暂无）</h5>
            <v-btn
              size="small"
              icon
              variant="text"
              @click="addResource('prerequisite', index)"
              >➕️</v-btn
            >
          </div>
          <div
            v-for="(resource, rIndex) in lesson.resources"
            :key="rIndex"
            class="resource-content"
          >
            <div class="resource-header">
              <v-ico>📙</v-ico>
              <v-text-field
                v-model="resource.name"
                :label="$t('studyplan.resourcename')"
                variant="outlined"
                density="compact"
                @update:model-value="$emit('dirty')"
              ></v-text-field>
              <v-btn
                size="small"
                icon
                variant="text"
                @click="removeResource('prerequisite', index, rIndex)"
                >➖️</v-btn
              >
            </div>
            <v-text-field
              class="lesson-description"
              v-model="resource.link"
              :label="$t('studyplan.resourcelink')"
              variant="outlined"
              density="compact"
              @update:model-value="$emit('dirty')"
            ></v-text-field>
          </div>
        </div>
      </div>
    </div>
    <v-helper-text
      v-if="localStudyPlan.prerequisite.length >= maxPrerequisiteLength"
    >
      {{ $t('studyplan.prerequisitelimitmsg') }}
    </v-helper-text>

    <!-- Main Curriculum Section -->
    <v-divider></v-divider>
    <div class="section-header">
      <h4>{{ $t('studyplan.maincurriculum') }}</h4>
      <v-btn
        size="small"
        icon
        variant="text"
        @click="addLesson('mainCurriculum')"
        :disabled="
          localStudyPlan.mainCurriculum.length >= maxMainCurriculumLength
        "
        >➕️</v-btn
      >
    </div>

    <!-- Scrollable container for main curriculum -->
    <div class="scrollable-section" v-if="localStudyPlan.mainCurriculum.length">
      <div
        v-for="(lesson, index) in localStudyPlan.mainCurriculum"
        :key="index"
        class="lesson-section"
      >
        <div class="lesson-header">
          <v-ico>📚️</v-ico>
          <v-text-field
            v-model="lesson.name"
            :label="$t('studyplan.lessonname')"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
            @update:model-value="$emit('dirty')"
          ></v-text-field>
          <v-btn
            size="small"
            icon
            variant="text"
            @click="removeLesson('mainCurriculum', index)"
            >➖️</v-btn
          >
        </div>
        <v-textarea
          class="lesson-description"
          v-model="lesson.description"
          :label="$t('studyplan.lessondescription')"
          :auto-grow="true"
          rows="1"
          max-rows="5"
          variant="outlined"
          density="compact"
          @update:model-value="$emit('dirty')"
        ></v-textarea>

        <!-- Resources Management -->
        <div class="resource-section">
          <div class="section-header">
            <h5>{{ $t('studyplan.resouces') }}</h5>
            <h5 v-if="lesson.resources[0] == null">（暂无）</h5>
            <v-btn
              size="small"
              icon
              variant="text"
              @click="addResource('mainCurriculum', index)"
              >➕️</v-btn
            >
          </div>
          <div
            v-for="(resource, rIndex) in lesson.resources"
            :key="rIndex"
            class="resource-content"
          >
            <div class="resource-header">
              <v-ico>📙</v-ico>
              <v-text-field
                v-model="resource.name"
                :label="$t('studyplan.resourcename')"
                variant="outlined"
                density="compact"
                @update:model-value="$emit('dirty')"
              ></v-text-field>
              <v-btn
                size="small"
                icon
                variant="text"
                @click="removeResource('mainCurriculum', index, rIndex)"
                >➖️</v-btn
              >
            </div>
            <v-text-field
              class="lesson-description"
              v-model="resource.link"
              :label="$t('studyplan.resourcelink')"
              variant="outlined"
              density="compact"
              @update:model-value="$emit('dirty')"
            ></v-text-field>
          </div>
        </div>
      </div>
    </div>
    <v-helper-text
      v-if="localStudyPlan.mainCurriculum.length >= maxMainCurriculumLength"
    >
      {{ $t('studyplan.maincurriculumlimitmsg') }}
    </v-helper-text>

    <!-- Advanced Topics Section -->
    <v-divider></v-divider>
    <div class="section-header">
      <h4>{{ $t('studyplan.advancedtopics') }}</h4>
      <v-btn
        size="small"
        icon
        variant="text"
        @click="addLesson('advancedTopics')"
        :disabled="
          localStudyPlan.advancedTopics.length >= maxAdvancedTopicsLength
        "
        >➕️</v-btn
      >
    </div>

    <!-- Scrollable container for advanced topics -->
    <div class="scrollable-section" v-if="localStudyPlan.advancedTopics.length">
      <div
        v-for="(lesson, index) in localStudyPlan.advancedTopics"
        :key="index"
        class="lesson-section"
      >
        <div class="lesson-header">
          <v-ico>📚️</v-ico>
          <v-text-field
            v-model="lesson.name"
            :label="$t('studyplan.lessonname')"
            variant="outlined"
            density="compact"
            :rules="[rules.required]"
            @update:model-value="$emit('dirty')"
          ></v-text-field>
          <v-btn
            size="small"
            icon
            variant="text"
            @click="removeLesson('advancedTopics', index)"
            >➖️</v-btn
          >
        </div>
        <v-textarea
          class="lesson-description"
          v-model="lesson.description"
          :label="$t('studyplan.lessondescription')"
          :auto-grow="true"
          rows="1"
          max-rows="5"
          variant="outlined"
          density="compact"
          @update:model-value="$emit('dirty')"
        ></v-textarea>

        <!-- Resources Management -->
        <div class="resource-section">
          <div class="section-header">
            <h5>{{ $t('studyplan.resouces') }}</h5>
            <h5 v-if="lesson.resources[0] == null">
              {{ $t('studyplan.empty') }}
            </h5>
            <v-btn
              size="small"
              icon
              variant="text"
              @click="addResource('advancedTopics', index)"
              >➕️</v-btn
            >
          </div>
          <div
            v-for="(resource, rIndex) in lesson.resources"
            :key="rIndex"
            class="resource-content"
          >
            <div class="resource-header">
              <v-ico>📙</v-ico>
              <v-text-field
                v-model="resource.name"
                :label="$t('studyplan.resourcename')"
                variant="outlined"
                density="compact"
                @update:model-value="$emit('dirty')"
              ></v-text-field>
              <v-btn
                size="small"
                icon
                variant="text"
                @click="removeResource('advancedTopics', index, rIndex)"
                >➖️</v-btn
              >
            </div>
            <v-text-field
              class="lesson-description"
              v-model="resource.link"
              :label="$t('studyplan.resourcelink')"
              variant="outlined"
              density="compact"
              @update:model-value="$emit('dirty')"
            ></v-text-field>
          </div>
        </div>
      </div>
    </div>
    <v-helper-text
      v-if="localStudyPlan.advancedTopics.length >= maxAdvancedTopicsLength"
    >
      {{ $t('studyplan.advancedtopicslimitmsg') }}
    </v-helper-text>

    <!-- Bottom save button removed; moved to top-right -->
  </v-form>
</template>

<script>
export default {
  props: {
    studyPlan: {
      type: Object,
      required: true,
    },
    showTopSave: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      localStudyPlan: JSON.parse(JSON.stringify(this.studyPlan)),
      maxPrerequisiteLength: 10, // Max number of prerequisites
      maxMainCurriculumLength: 10, // Max number of main curriculum lessons
      maxAdvancedTopicsLength: 10, // Max number of advanced topics lessons
      rules: {
        required: (value) => !!value || 'Required.',
      },
    }
  },
  methods: {
    addLesson(type) {
      if (
        this.localStudyPlan[type].length >=
        this[`max${this.capitalize(type)}Length`]
      )
        return
      this.localStudyPlan[type].push({
        name: '',
        description: '',
        resources: [],
      })
    },
    removeLesson(type, index) {
      this.localStudyPlan[type].splice(index, 1)
    },
    addResource(type, lessonIndex) {
      this.localStudyPlan[type][lessonIndex].resources.push({
        name: '',
        link: '',
      })
    },
    removeResource(type, lessonIndex, resourceIndex) {
      this.localStudyPlan[type][lessonIndex].resources.splice(resourceIndex, 1)
    },
    capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1)
    },
    async saveStudyPlan() {
      try {
        await this.$emit('save', this.localStudyPlan)
      } catch (error) {
        console.error(error)
      }
    },
  },
}
</script>

<style scoped>
.form-actions-top {
  display: flex;
  justify-content: flex-end;
  position: sticky;
  top: 0;
  background: white;
  padding-top: 4px;
  padding-bottom: 8px;
  z-index: 1;
}
.scrollable-section {
  max-height: 400px;
  /* Adjust the max height as needed */
  overflow-y: auto;
  margin-bottom: 20px;
}

.lesson-section {
  margin-bottom: 20px;
}

.resource-section {
  margin-left: 80px;
}

.section-header {
  display: flex;
  align-items: center;
  /* justify-content: space-between; */
}

.lesson-header,
.resource-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.lesson-description {
  margin-left: 30px;
}

.resource-content {
  margin-left: 10px;
}
</style>
