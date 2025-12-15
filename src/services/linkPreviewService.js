// src/services/linkPreviewService.js
import { apiClient } from '@/api'

export async function fetchLinkPreview(url) {
  // Fast-fail for empty/invalid URLs to avoid 400s and keep UI usable
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { url: '', title: '', image: '', description: '' }
  }
  try {
    const response = await apiClient.get('/LinkPreview', { params: { url } })
    const d = response?.data || {}
    const title = d.title || d.Title || url
    const image = d.image || d.Image || ''
    const description = d.description || d.Description || ''
    return { url, title, image, description }
  } catch (error) {
    console.error('Error fetching link preview:', error)
    return {
      url: url,
      title: url,
      image: '', // Provide a default or error image path if necessary
      description: '',
    }
  }
}
