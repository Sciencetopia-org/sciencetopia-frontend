function hostnameOf(url) {
  try {
    const u = new URL(url)
    return u.hostname.toLowerCase()
  } catch (e) {
    try {
      const u = new URL('https://' + url)
      return u.hostname.toLowerCase()
    } catch (_) {
      return ''
    }
  }
}

const BLOCKED_SUFFIXES = [
  '.youtube.com', 'youtube.com', 'youtu.be',
  '.google.com', 'google.com', '.gstatic.com', '.googleapis.com', 'blogger.com',
  'twitter.com', '.twitter.com', 'x.com', 't.co',
  'facebook.com', '.facebook.com', 'instagram.com', '.instagram.com',
  'reddit.com', '.reddit.com',
  'medium.com',
  'twitch.tv', '.twitch.tv', 'vimeo.com',
  'pinterest.com',
  'telegram.org', '.telegram.org', 't.me',
  'discord.com', '.discord.com',
  'dropbox.com', '.dropbox.com',
  'drive.google.com', 'docs.google.com', 'sites.google.com',
]

export function isAccessibleInChina(url) {
  if (!url) return true
  const host = hostnameOf(url)
  if (!host) return true
  return !BLOCKED_SUFFIXES.some(s => host === s || host.endsWith(s))
}

export function filterResourcesForChina(resources, isCN) {
  if (!isCN) return Array.isArray(resources) ? resources : []
  if (!Array.isArray(resources)) return []
  return resources.filter(r => isAccessibleInChina(r?.link || r?.url))
}

