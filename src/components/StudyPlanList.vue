<template>
  <v-card class="study-plan-card">
    <v-row>
      <v-col cols="12">
        <v-card-title class="study-plan-title">
          {{ isCurrentUser ? $t('usercenter.my') : $t('usercenter.their')
          }}{{ $t('wordbreaker') }}{{ $t('usercenter.studyplan') }}
        </v-card-title>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="studyPlan in studyPlanDataList"
        :key="studyPlan.studyPlan.id"
        cols="12"
      >
        <v-card class="study-plan-summary" @click="goToPlanDetail(studyPlan.studyPlan.id)">
          <v-row align="center">
            <v-col cols="9" class="d-flex align-center">
              <v-card-title class="pr-2">{{ studyPlan.studyPlan.title }}</v-card-title>
              <v-chip v-if="(studyPlan.effectiveRole || studyPlan.studyPlan?.effectiveRole)" size="x-small" label>
                {{ studyPlan.effectiveRole || studyPlan.studyPlan?.effectiveRole }}
              </v-chip>
            </v-col>
            <v-col cols="3" class="d-flex justify-end">
              <v-btn variant="plain" icon @click.stop="goToPlanDetail(studyPlan.studyPlan.id)">
                <div class="go-to-icon"></div>
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
    <div v-if="studyPlanDataList.length === 0">
      <v-container>
        <v-card class="d-flex align-center justify-center">
          <v-card-title>
            {{ isCurrentUser ? $t('studyplan.noprogress_my') : $t('studyplan.noprogress_their') }}
          </v-card-title>
        </v-card>
      </v-container>
    </div>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      // simplified list view; progress/completion not shown in lightweight mode
    }
  },
  props: {
    isCurrentUser: Boolean,
    studyPlanDataList: Array,
  },
  computed: {},
  methods: {
    goToPlanDetail(planId) {
      this.$router.push({
        name: 'StudyPlanWorkspace',
        query: { planId },
      })
    },
  },
}
</script>

<style scoped>
.study-plan-card {
  margin-top: 10px;
  padding-left: 40px;
  padding-right: 40px;
  padding-top: 20px;
  box-shadow: 0px 2px 10px 3px rgba(0, 0, 0, 0.1) !important;
  background-color: #f4eee1;
  height: 100%;
}

.study-plan-summary {
  padding: 10px 10px 0 10px;
  border: 2px solid #ccc;
}

.go-to-icon {
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 20px solid rgba(236, 0, 23, 0.8);
  transform: rotate(90deg);
}

.study-plan-title {
  font-size: 24px;
  /* font-weight: bold; */
}

.study-plan-tab {
  color: #304e75;
  font-size: 18px;
}
</style>
