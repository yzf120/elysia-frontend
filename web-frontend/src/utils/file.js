export function openBlobInNewTab(blob) {
  const objectUrl = URL.createObjectURL(blob)
  window.open(objectUrl, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60 * 1000)
}

export function downloadBlob(blob, filename = 'download') {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60 * 1000)
}
