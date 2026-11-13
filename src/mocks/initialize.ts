import { demoUsers } from './fixtures/users'
import { readAuthDatabase, saveAuthDatabase } from './database/auth'
import { withCartLock } from './database/cart'
export async function initializeMocks() {
  await withCartLock(() => {
    const database = readAuthDatabase()
    for (const user of demoUsers) if (!database.users.some(existing => existing.email === user.email)) database.users.push(user)
    saveAuthDatabase(database)
  })
}
