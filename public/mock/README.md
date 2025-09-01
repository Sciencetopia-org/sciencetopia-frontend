Mock data for Study Plans and Study Groups

These JSON files model common responses used by the UI. You can fetch them directly from the dev server (e.g. http://localhost:8080/mock/...) or use them to seed a mock backend.

Key mappings (example):
- GET /StudyPlans → /mock/studyplans/list.json
- GET /StudyPlan/GetStudyPlanById?studyPlanId=p1 → /mock/studyplans/plan-p1.json
- GET /studyPlans/p1/cohorts → /mock/cohorts/by-plan-p1.json
- GET /cohorts/c1/stats/summary → /mock/cohorts/p1-c1-summary.json
- GET /cohorts/c1/stats/leaderboard → /mock/cohorts/p1-c1-leaderboard.json
- GET /plans/p1/joinable-cohorts → /mock/joinable/p1.json
- GET /plans/p1/enrollment/me → /mock/enrollment/p1-me.json
- GET /permissions/effective?planId=p1[&cohortId=c1] → /mock/permissions/p1.json
- GET /groups/g-fe/plans → /mock/groups/g-fe-plans.json
- GET /groups/g-ml/plans → /mock/groups/g-ml-plans.json
- GET /groups/{any}/plans → /mock/groups/default-plans.json (fallback)
- GET /StudyGroups → /mock/studygroups/list.json
- GET /StudyGroup/GetStudyGroupById/{groupId} → /mock/studygroups/detail.json
- GET /StudyGroup/GetUserRoleInGroup/{groupId} → /mock/studygroups/role.json
- GET /StudyGroup/GetPendingJoinRequestsCount/{groupId} → /mock/studygroups/pending-count.json
- GET /search?q=... → /mock/search/results.json (static sample)

Group plans list item shape (example):
[
  {
    "id": "p1",
    "title": "计划标题",
    "role": "Viewer|Commenter|Editor|Owner",
    "shareMode": "Editable|Readonly",
    "avgProgress": 42,
    "memberCount": 27,
    "cohortId": "c-xyz"
  }
]
