import { createHash } from 'node:crypto'
import { prisma } from '#server/db/client'
import {REVIEWABLE_BLOCK_TYPES} from "#shared/constants/blocks.ts";

export interface BlockInfo {
  blockId: string
  hash: string
}

export function extractBlocks(content: any): BlockInfo[] {
  const blocks: BlockInfo[] = []

  for (const node of content?.content ?? []) {
    if (!REVIEWABLE_BLOCK_TYPES.includes(node.type)) continue
    if (node.type === 'paragraph' && !node.content?.length) continue

    const blockId = node.attrs?.blockId
    if (!blockId) continue

    blocks.push({
      blockId,
      hash: createHash('sha256').update(JSON.stringify(node)).digest('hex')
    })
  }

  return blocks
}

export async function getUnapprovedBlocks(articleId: string, content: any) {
  const blocks = extractBlocks(content)
  const reviews = await prisma.articleBlockReview.findMany({ where: { articleId } })
  const byId = new Map(reviews.map(r => [r.blockId, r]))

  return blocks.filter(({ blockId, hash }) => {
    const review = byId.get(blockId)
    if (!review) return true
    if (review.status !== 'APPROVED') return true
    return review.contentHash !== hash
  })
}

export function diffBlocks(from: any, to: any) {
  const fromBlocks = new Map(extractBlocks(from).map(b => [b.blockId, b.hash]))
  const toBlocks = new Map(extractBlocks(to).map(b => [b.blockId, b.hash]))

  const changed: string[] = []
  const added: string[] = []
  const removed: string[] = []

  for (const [id, hash] of toBlocks) {
    if (!fromBlocks.has(id)) added.push(id)
    else if (fromBlocks.get(id) !== hash) changed.push(id)
  }
  for (const id of fromBlocks.keys()) {
    if (!toBlocks.has(id)) removed.push(id)
  }

  return { changed, added, removed }
}
