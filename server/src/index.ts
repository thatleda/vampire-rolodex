import path from 'node:path'
import process from 'node:process'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { appRouter } from './router.ts'

dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') })

const app = express()
app.use(cors())
app.use('/trpc', createExpressMiddleware({ router: appRouter }))

const port = process.env.SERVER_PORT ?? 4000
app.listen(port, () => {
  console.warn(`vampire-rolodex server listening on :${port}`)
})
