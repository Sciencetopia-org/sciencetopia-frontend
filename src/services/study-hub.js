import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr'

let studyHub = null

export function getStudyHub() {
  return studyHub
}

export async function ensureStudyHubConnection() {
  if (studyHub && studyHub.state !== 'Disconnected') return studyHub
  studyHub = new HubConnectionBuilder()
    .withUrl('/hubs/study')
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build()
  await studyHub.start().catch((e) => console.error('Study hub connect failed', e))
  return studyHub
}

export async function joinCohortRoom(cohortId) {
  await ensureStudyHubConnection()
  try {
    await studyHub.invoke('JoinCohort', String(cohortId))
  } catch (e) {
    console.error('JoinCohort failed', e)
  }
}

export async function leaveCohortRoom(cohortId) {
  if (!studyHub) return
  try {
    await studyHub.invoke('LeaveCohort', String(cohortId))
  } catch (e) {
    console.error('LeaveCohort failed', e)
  }
}

export default {
  ensureStudyHubConnection,
  getStudyHub,
  joinCohortRoom,
  leaveCohortRoom,
}

