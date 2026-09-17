const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'IMG'])

const ALLOWED_TAGS = new Set([
  'P', 'DIV', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI',
  'H1', 'H2', 'H3', 'SPAN',
])

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function plainTextToHtml(text = '') {
  const lines = String(text).split(/\n/)
  if (!lines.some(line => line.trim())) return '<p><br></p>'
  return lines.map(line => `<p>${escapeHtml(line) || '<br>'}</p>`).join('')
}

export function richHtmlToPlainText(html = '') {
  if (typeof document === 'undefined') {
    return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const holder = document.createElement('div')
  holder.innerHTML = html
  return (holder.innerText || holder.textContent || '').replace(/\u00a0/g, ' ').trim()
}

export function sanitizeRichHtml(html = '') {
  if (typeof DOMParser === 'undefined') return plainTextToHtml(richHtmlToPlainText(html))

  const parser = new DOMParser()
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild

  function clean(node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) continue
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove()
        continue
      }

      if (DROP_TAGS.has(child.tagName)) {
        child.remove()
        continue
      }

      if (!ALLOWED_TAGS.has(child.tagName)) {
        clean(child)
        const fragment = doc.createDocumentFragment()
        while (child.firstChild) fragment.appendChild(child.firstChild)
        child.replaceWith(fragment)
        continue
      }

      const textAlign = child.style?.textAlign
      for (const attribute of [...child.attributes]) child.removeAttribute(attribute.name)
      if (['left', 'center', 'right', 'justify'].includes(textAlign)) {
        child.setAttribute('style', `text-align:${textAlign}`)
      }
      clean(child)
    }
  }

  clean(root)
  return root.innerHTML || '<p><br></p>'
}
