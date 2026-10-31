import { readFileSync } from 'node:fs'
import path from 'node:path'

// Form label association (odd/tasks/form-labels.md). A <label> must name a
// control: either htmlFor pointing at an id in the same file, or a control
// nested inside it. Returns the offending labels as "line: text" strings.
export function unassociatedLabels(file) {
  const source = readFileSync(path.resolve(process.cwd(), 'src', file), 'utf8')
  const ids = new Set([...source.matchAll(/\bid=["{`']+([\w-]+)/g)].map((m) => m[1]))
  const lineOf = (index) => source.slice(0, index).split('\n').length
  const offenders = []
  for (const match of source.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)) {
    const [, attrs, body] = match
    const target = attrs.match(/htmlFor=["{`']+([\w-]+)/)
    const wraps = /<(input|select|textarea|Input|Select)\b/.test(body)
    if (wraps || (target && ids.has(target[1]))) continue
    offenders.push(`${lineOf(match.index)}: ${body.replace(/<[^>]+>|\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim()}`)
  }
  return offenders
}
