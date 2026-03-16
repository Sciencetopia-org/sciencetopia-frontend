import { apiClient } from '@/api'

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function getResourceId(resource) {
  const raw = resource?.id ?? resource?.resourceId ?? resource?.ID ?? resource?.properties?.id
  if (raw === null || raw === undefined) return null
  const value = String(raw).trim()
  return GUID_PATTERN.test(value) ? value : null
}

export async function hydrateCompletedStatuses(resources) {
  const list = Array.isArray(resources) ? resources : []
  const ids = Array.from(new Set(list.map(getResourceId).filter(Boolean)))

  if (ids.length === 0) {
    list.forEach(resource => {
      if (typeof resource?.learned !== 'boolean') resource.learned = false
    })
    return list
  }

  try {
    const response = await apiClient.post('/resources/completedStatus', { resourceIds: ids })
    const completedIds = new Set(
      (Array.isArray(response?.data) ? response.data : [])
        .filter(item => item?.completed === true)
        .map(item => String(item.resourceId))
    )

    list.forEach(resource => {
      const id = getResourceId(resource)
      resource.learned = id ? completedIds.has(id) : false
    })
  } catch (error) {
    if (error?.response?.status !== 401) {
      console.error('Failed to hydrate resource completion status', error)
    }
    list.forEach(resource => {
      if (typeof resource?.learned !== 'boolean') resource.learned = false
    })
  }

  return list
}
