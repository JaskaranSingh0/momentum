export function parseQuickAdd(input) {
  let title = input.trim()
  const labels = []
  let priority = 'medium'
  let time = null

  // labels: #work #home
  title = title.replace(/(^|\s)#([a-z0-9-_]+)/gi, (_, s, tag) => { labels.push(tag.toLowerCase()); return s })

  // priority: !high !med !low or !h/!m/!l
  title = title.replace(/(^|\s)!(high|h|med|m|low|l)\b/gi, (_, s, p) => {
    if (/^h/i.test(p)) priority = 'high'
    else if (/^l/i.test(p)) priority = 'low'
    else priority = 'medium'
    return s
  })

  // time: 5pm, 17:30
  title = title.replace(/(^|\s)((1[0-2]|0?[1-9])(:[0-5]\d)?\s?(am|pm)|([01]?\d|2[0-3]):[0-5]\d)\b/gi, (_, s, t) => { time = t; return s })

  return { title: title.replace(/\s+/g, ' ').trim(), labels, priority, time }
}
