import createDOMPurify from 'dompurify'

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const RELATIVE_URL_PREFIXES = ['/', './', '../', '#']

let purifier

function getPurifier() {
  if (purifier) return purifier
  if (typeof window === 'undefined' || !window.document) return null

  purifier = createDOMPurify(window)
  purifier.addHook('afterSanitizeAttributes', (node) => {
    if (!node || !node.attributes) return

    ;['href', 'src'].forEach((attr) => {
      if (node.hasAttribute(attr) && !isSafeUrl(node.getAttribute(attr), { allowRelative: true })) {
        node.removeAttribute(attr)
      }
    })

    if (node.tagName === 'A') {
      const target = node.getAttribute('target')
      if (target && target.toLowerCase() === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer')
      }
    }
  })

  return purifier
}

function hasControlCharacter(value) {
  return Array.from(value).some((char) => {
    const code = char.charCodeAt(0)
    return code <= 0x1f || code === 0x7f
  })
}

export function isSafeUrl(value, options = {}) {
  const { allowRelative = false } = options
  if (value == null) return false

  const raw = String(value).trim()
  if (!raw) return false
  if (hasControlCharacter(raw)) return false

  const normalized = raw.replace(/\s+/g, '')
  if (/^(javascript|data|vbscript|file|blob):/i.test(normalized)) return false

  if (allowRelative && RELATIVE_URL_PREFIXES.some((prefix) => raw.startsWith(prefix))) {
    return true
  }

  try {
    const url = new URL(raw)
    return SAFE_URL_PROTOCOLS.has(url.protocol)
  } catch (_) {
    return false
  }
}

export function safeUrl(value, fallback = '#') {
  return isSafeUrl(value, { allowRelative: true }) ? String(value).trim() : fallback
}

export function stripHtml(html) {
  if (html == null) return ''
  const sanitized = sanitizeHtml(html, { allowedTags: [] })
  if (typeof document === 'undefined') return sanitized

  const div = document.createElement('div')
  div.innerHTML = sanitized
  return (div.textContent || div.innerText || '').trim()
}

export function sanitizeHtml(html, options = {}) {
  if (!html) return ''
  const domPurify = getPurifier()
  if (!domPurify) return ''

  return domPurify.sanitize(String(html), {
    ALLOWED_TAGS: options.allowedTags || [
      'a',
      'b',
      'blockquote',
      'br',
      'code',
      'div',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'i',
      'img',
      'li',
      'ol',
      'p',
      'pre',
      's',
      'span',
      'strong',
      'u',
      'ul',
    ],
    ALLOWED_ATTR: [
      'alt',
      'class',
      'height',
      'href',
      'rel',
      'src',
      'target',
      'title',
      'width',
    ],
    FORBID_ATTR: ['style'],
    FORBID_TAGS: [
      'button',
      'embed',
      'form',
      'iframe',
      'input',
      'link',
      'math',
      'meta',
      'object',
      'script',
      'style',
      'svg',
    ],
    ALLOW_DATA_ATTR: false,
  })
}

export function textWithLineBreaks(html) {
  const text = stripHtml(html)
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/ {2}/g, ' \u00a0'))
    .join('<br>')
}
