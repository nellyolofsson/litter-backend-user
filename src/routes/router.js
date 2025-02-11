/**
 * The routes.
 *
 * @author
 * @version 2.0.0
 */

// User-land modules.
import express from 'express'

// Application modules.
import { router as v1Router } from './api/v1/router.js'
import {
  HttpError
} from '../lib/errors/index.js'

export const router = express.Router()

router.use('/api/v1', v1Router)

// Catch 404 (ALWAYS keep this as the last route).
router.use('*', (req, res, next) => {
  next(new HttpError({
    message: 'The requested resource was not found.',
    status: 404,
    data: { url: req.originalUrl }
  }))
})
