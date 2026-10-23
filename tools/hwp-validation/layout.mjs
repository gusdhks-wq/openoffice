// Compare resolved layout values, not serializer-local style indices.
export function layout(doc) {
  const pages = []
  for (let i = 0; i < doc.pageCount(); i++)
    pages.push({
      text: JSON.parse(doc.getPageTextLayout(i)),
      controls: JSON.parse(doc.getPageControlLayout(i)),
    })
  return pages
}
export function layoutEqual(a, b, key = '') {
  if (typeof a === 'number' && typeof b === 'number') {
    return ['x', 'y', 'w', 'h', 'width', 'height', 'fontSize', 'letterSpacing', 'charX'].includes(
      key,
    )
      ? Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 0.5
      : a === b
  }
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((v, i) => layoutEqual(v, b[i], key))
    )
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = (o) =>
      Object.keys(o)
        .filter((k) => !['charShapeId', 'paraShapeId'].includes(k))
        .sort()
    return (
      JSON.stringify(keys(a)) === JSON.stringify(keys(b)) &&
      keys(a).every((k) => layoutEqual(a[k], b[k], k))
    )
  }
  return a === b
}
