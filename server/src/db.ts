import path from 'node:path'
import process from 'node:process'
import { PrismaPg } from '@prisma/adapter-pg'
import dotenv from 'dotenv'
import { PrismaClient } from './generated/prisma/client.ts'

dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

export const prisma = new PrismaClient({ adapter })
