/**
 * Gives every tag a stable colour, so the same tag reads the same on every
 * screen and a row can be scanned by colour instead of by text.
 */
export function tagHue(tag: string): number {
  let hash = 0
  for (const character of tag) {
    hash = (hash * 31 + character.charCodeAt(0)) % 360
  }

  return hash
}
