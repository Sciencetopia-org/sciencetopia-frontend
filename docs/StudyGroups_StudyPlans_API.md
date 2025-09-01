# Study Groups & Study Plans API

面向前端的接口说明。所有路径为 PascalCase；统一前缀 `api`。除特别说明外，请在请求头中附上认证令牌。

通用返回码
- 200 OK：请求成功（可能带响应体）
- 201 Created：资源创建成功（少数创建接口）
- 204 No Content：删除成功或无返回体
- 400 Bad Request：参数错误
- 401 Unauthorized：未登录或令牌无效
- 403 Forbidden：无访问权限
- 404 Not Found：资源不存在
- 409 Conflict：业务冲突（例如已在该计划中）

权限模型摘要
- 学习计划 Plan 角色：Viewer / Commenter / Editor / Owner
- Cohort 强耦合到学习小组：
  - 组域 Cohort：该组 Manager 具备 Cohort 管理/邀请权限；组成员才可加入/切换
  - 非组域 Cohort：不作为管理目标（当前模型）

—

Study Plans（学习计划）
- GET `api/StudyPlans`
  - 功能：分页查询当前用户可见的学习计划
  - 查询参数：`page`(默认1), `pageSize`(默认20), `q`(搜索标题), `sort`(createdDesc|createdAsc|默认updatedDesc)
  - 响应：`{ total, page, pageSize, items: [{ id, title, role }] }`，`role` 为用户在该计划上的 PlanRole 字符串

- GET `api/StudyPlans/{id}`
  - 功能：获取计划详情及当前版本信息
  - 权限：需对该计划可读
  - 响应：`{ id, title, description, currentVersionId, currentVersionNumber }`

- GET `api/StudyPlans/{id}/Enrollment/Me`
  - 功能：获取当前用户在该计划上的 Cohort 与入学信息
  - 权限：需对该计划可读
  - 响应：`{ activeCohortId, archivedCohortIds, role, joinedAt }`
    - `activeCohortId: Guid?` 当前所在 Cohort
    - `archivedCohortIds: Guid[]` 历史参与过的 Cohort（不含当前）
    - `role: "manager"|"member"|null` 仅当所在 Cohort 为组域时给出（基于组角色）
    - `joinedAt: null`（预留字段）

- GET `api/StudyPlans/{id}/JoinableCohorts`
  - 功能：列出用户可加入的 Cohort（组域须为组成员）
  - 权限：需对该计划可读
  - 响应：`{ groupScoped: [{ id, title, canJoin, reason? }], public: [{...}], soloAvailable }`
    - `reason` 例如：`alreadyInPlan`, `notGroupMember`

- GET `api/StudyPlans/{id}/Permissions/Effective`
  - 功能：获取当前用户在该计划上的有效 PlanRole
  - 响应：`{ role }`

- POST `api/StudyPlans/{id}/Share/User`
  - 功能：为指定用户设置该计划的角色
  - 权限：计划拥有者（Owner）
  - 请求体：`{ userId: string, role: Viewer|Commenter|Editor }`
  - 响应：`200 OK`

- DELETE `api/StudyPlans/{id}/Share/User/{userId}`
  - 功能：移除指定用户在该计划的显式角色
  - 权限：计划拥有者（Owner）
  - 响应：`200 OK`

—

Study Group ↔ Plan 分享
- POST `api/StudyGroups/{StudyGroupId}/Plans/{PlanId}/Share`
  - 功能：将计划分享给学习小组，可选择自动为组成员入学
  - 请求体：`{ permission: string, autoEnroll: bool, useDraftFlow: bool }`
    - `permission` 建议值：`view|comment|edit|admin`（用于后续策略映射）
  - 响应：返回数据库记录对象（含分享配置）

- DELETE `api/StudyGroups/{StudyGroupId}/Plans/{PlanId}`
  - 功能：取消学习小组与计划的分享关系
  - 响应：`200 OK` 或 `404 Not Found`

—

Group‑Scoped Cohorts（组域 Cohort 管理）
- POST `api/Groups/{groupId}/Plans/{planId}/Cohorts`
  - 功能：在小组下为某计划创建 Cohort
  - 权限：调用者必须为该组 Manager；且具备计划编辑策略（Plan.Edit）
  - 请求体：`{ title?: string, visibility?: "group"|"public"|"private", enrollMode?: "OptIn"|"Auto" }`
  - 响应：`{ cohortId }`

- PATCH `api/Groups/{groupId}/Cohorts/{cohortId}`
  - 功能：更新 Cohort 的入学模式或固定版本（pin）
  - 权限：组 Manager 且 Cohort.Manage
  - 请求体：`{ enrollMode?: "OptIn"|"Auto", pinnedVersionId?: long, pinnedVersionNumber?: int }`
  - 响应：`200 OK`

- POST `api/Groups/{groupId}/Cohorts/{cohortId}/UpgradeVersion`
  - 功能：将 Cohort 固定到计划当前版本，并为现有成员建立对应 ENROLLED_IN
  - 权限：组 Manager 且 Cohort.Manage
  - 响应：`{ pinnedVersionId, pinnedVersionNumber }`

—

Cohorts（通用）
- GET `api/StudyPlans/{planId}/Cohorts`
  - 功能：按计划列出 Cohort 列表
  - 权限：需对该计划可读
  - 响应：`CohortViewDto[]`，元素：`{ id, studyPlanId, title, visibility, startAt, endAt, createdBy, createdAt }`

- PUT `api/Cohorts/{cohortId}`
  - 功能：更新 Cohort 元信息
  - 权限：Cohort.Manage
  - 请求体：`{ title?: string, visibility?: string, startAt?: string, endAt?: string }`
  - 响应：`CohortViewDto`

- DELETE `api/Cohorts/{cohortId}`
  - 功能：删除 Cohort（数据库与图中节点）
  - 权限：Cohort.Manage
  - 响应：`204 No Content`

- DELETE `api/Cohorts/{cohortId}/Leave`
  - 功能：当前用户退出 Cohort
  - 响应：`200 OK`

- POST `api/Cohorts/{cohortId}/Join`
  - 功能：加入组域 Cohort，并建立到其固定版本的 ENROLLED_IN
  - 规则：Cohort 必须为组域；调用者必须是该组成员
  - 请求体：`{ shareMetrics?: bool }`（`migrationStrategy` 字段预留，忽略）
  - 响应：`{ planId: Guid, cohortId: Guid }`
  - 失败：`403 Forbidden`（非组成员），`409 Conflict`（`{ code: "alreadyInPlan" }`）

- POST `api/Plans/{planId}/SwitchCohort`
  - 功能：在同一计划内切换到目标组域 Cohort，并建立相应 ENROLLED_IN
  - 规则：目标 Cohort 必须为组域；调用者必须是该组成员
  - 请求体：`{ toCohortId: Guid, shareMetrics?: bool, migrationStrategy?: string }`
  - 响应：`{ planId: Guid, fromCohortId: Guid|null, toCohortId: Guid }`
  - 失败：`404 Not Found`，`403 Forbidden`，`400 Bad Request`（`{ code: "cohort_plan_mismatch" }`）

- POST `api/Cohorts/{cohortId}/AutoEnroll/{groupId}?run=true|false`
  - 功能：配置学习小组对 Cohort 的自动入学关系；`run=true` 立即批量导入当前组成员
  - 权限：该组 Manager
  - 响应：`200 OK` 或 `{ processed: number }`（当 `run=true`）

- DELETE `api/Cohorts/{cohortId}/AutoEnroll/{groupId}`
  - 功能：移除自动入学配置
  - 权限：该组 Manager
  - 响应：`200 OK`

—

Cohort 信息与统计
- GET `api/Cohorts/{cohortId}`
  - 功能：获取 Cohort 元信息
  - 响应：`{ id, studyPlanId, studyGroupId, enrollMode, pinnedVersionId, pinnedVersionNumber, membersCount, createdAt, createdBy, title, visibility }`

- GET `api/Cohorts/{cohortId}/Stats/Summary`
  - 功能：获取 Cohort 汇总统计
  - 响应：`{ avgProgress: number, memberCount: number }`

- GET `api/Cohorts/{cohortId}/Stats/Lessons`
  - 功能：获取 Cohort 的按课节统计
  - 响应：`[{ lessonId: Guid, lessonTitle: string, lessonAvgProgress: number, completedCount: number, totalResources: number }]`

- GET `api/Cohorts/{cohortId}/Stats/Leaderboard`
  - 功能：获取 Cohort 榜单
  - 查询参数：`top`（默认 20）
  - 响应：`[{ userId: string, displayName: string, progress: number }]`

- POST `api/Cohorts/{cohortId}/AutoEnroll/{groupId}/Run`
  - 功能：手动触发一次自动入学批处理（与上面的 `?run=true` 等价）
  - 响应：`{ processed: number }`

—

Progress（学习进度）
- GET `api/StudyPlans/{planId}/Progress/Me`
  - 功能：获取当前用户在计划下的进度
  - 权限：需对该计划可读
  - 响应：`{ planProgress: number, perLesson: [{ lessonId, lessonProgress, completedCount, totalResources }] }`

- GET `api/StudyPlans/{planId}/Lessons/{lessonId}/Progress/Me`
  - 功能：获取当前用户在某课节的进度
  - 权限：需对该计划可读
  - 响应：`{ lessonId, lessonProgress, completedCount, totalResources }`

- POST `api/Resources/CompletedStatus`
  - 功能：批量查询资源完成状态
  - 请求体：`{ resourceIds: Guid[] }`
  - 响应：`{ [resourceId: string]: boolean }`（完成状态映射）

- POST `api/Resources/{resourceId}/Complete`
  - 功能：标记资源完成
  - 请求体：`{ planId?: Guid, lessonId?: Guid, knowledgeNodeId?: Guid, source?: string, device?: string, spentSeconds?: number }`
  - 响应：操作结果（布尔或明细，取决于实现）

- DELETE `api/Resources/{resourceId}/Complete`
  - 功能：撤销完成
  - 查询参数：`planId?: Guid`
  - 响应：`200 OK`

—

Permissions（权限）
- GET `api/Permissions/Effective?planId={id}&cohortId={optional}&userId={optional}`
  - 功能：返回当前（或指定）用户在指定 Plan/Cohort 上的有效权限
  - 响应：`{ CanView, CanComment, CanEdit, CanPublish, CohortManage, CohortInvite }`

—

Admin（图回填）
- POST `api/Admin/Graph/Backfill`
  - 功能：为现有数据回填 Cohort ↔ PlanVersion 及用户 ENROLLED_IN 关系（幂等合并）
  - 权限：管理员策略
