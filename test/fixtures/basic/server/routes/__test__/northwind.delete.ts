import { defineEventHandler } from 'h3'
import { resetNorthwindCategory } from '../../utils/northwind-category'

export default defineEventHandler(() => {
  resetNorthwindCategory()
  return { reset: true }
})
