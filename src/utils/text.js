// Utilities for HTML sanitization and stripping
export function stripHtml(html) {
  try {
    if (html == null) return ''
    const div = document.createElement('div')
    div.innerHTML = String(html)
    return (div.textContent || div.innerText || '').trim()
  } catch (_) {
    // Fallback: remove tags via regex
    return String(html).replace(/<[^>]*>/g, '').trim()
  }
}

export function sanitizeHtml(html) {
  try {
    if (!html) return ''
    const div = document.createElement('div')
    div.innerHTML = String(html)
    // Remove potentially dangerous elements
    div.querySelectorAll('script,style,iframe,object,embed,link').forEach(n => n.remove())
    // Remove inline event handlers and javascript: URLs
    div.querySelectorAll('*').forEach(el => {
      ;[...el.attributes].forEach(attr => {
        const name = attr.name.toLowerCase()
        const value = String(attr.value || '')
        if (name.startsWith('on')) el.removeAttribute(attr.name)
        if (name === 'href' || name === 'src') {
          const v = value.replace(/\s/g, '').toLowerCase()
          if (v.startsWith('javascript:')) el.removeAttribute(attr.name)
        }
      })
    })
    return div.innerHTML
  } catch (_) {
    return ''
  }
}

