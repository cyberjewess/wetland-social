import type { SimpleStore } from '@atproto-labs/simple-store'
import fs from 'fs/promises'
import path from 'path'
import { createLogger } from '../logger'

const logger = createLogger({ service: 'file-store' })

/**
 * File-based store for development
 * Persists OAuth state and sessions to disk to survive Next.js hot reloads
 *
 * DO NOT USE IN PRODUCTION - use Redis or a database instead
 */
export function createFileStore<T extends NonNullable<unknown> | null>(
  storeName: string
): SimpleStore<string, T> {
  // Store in .next/cache to avoid git commits
  const storeDir = path.join(process.cwd(), '.next', 'cache', 'oauth-store')
  const storeFile = path.join(storeDir, `${storeName}.json`)

  // Ensure directory exists
  const ensureDir = async () => {
    try {
      await fs.mkdir(storeDir, { recursive: true })
    } catch (err) {
      logger.error({ error: err }, `Failed to create store directory: ${storeDir}`)
    }
  }

  // Load all data from file
  const loadData = async (): Promise<Map<string, T>> => {
    try {
      const data = await fs.readFile(storeFile, 'utf8')
      const parsed = JSON.parse(data)
      return new Map(Object.entries(parsed) as [string, T][])
    } catch (err) {
      // File doesn't exist yet or is invalid
      return new Map()
    }
  }

  // Save all data to file
  const saveData = async (data: Map<string, T>): Promise<void> => {
    await ensureDir()
    const obj = Object.fromEntries(data.entries())
    await fs.writeFile(storeFile, JSON.stringify(obj, null, 2), 'utf8')
  }

  return {
    get: async (key: string) => {
      const data = await loadData()
      const value = data.get(key)
      logger.debug({ key, found: value !== undefined }, `Store get: ${storeName}`)
      return value
    },

    set: async (key: string, value: T) => {
      const data = await loadData()
      data.set(key, value)
      await saveData(data)
      logger.debug({ key }, `Store set: ${storeName}`)
    },

    del: async (key: string) => {
      const data = await loadData()
      data.delete(key)
      await saveData(data)
      logger.debug({ key }, `Store del: ${storeName}`)
    },
  }
}
