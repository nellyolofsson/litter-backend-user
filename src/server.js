// Must be first!
import httpContext from 'express-http-context'

// Built-in modules.
import { randomUUID } from 'node:crypto'
import http from 'node:http'

// User-land modules.
import '@lnu/json-js-cycle'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

// Application modules.
import { connectToDatabase } from './config/mongoose.js'
import { morganLogger } from './config/morgan.js'
import { limiter } from './config/rateLimiter.js'
import { logger } from './config/winston.js'
import { router } from './routes/router.js'
import { sessionOptions } from './config/sessionOptions.js'
import { connectRabbitMQ } from './config/rabbitmq.js'
import { startNotificationService } from './config/Notification.js'
import session from 'express-session'
import passport from 'passport'
import { configurePassport } from './config/passport.js'
import {RedisStore} from 'connect-redis'
import redis from 'redis'


try {
  // Connect to MongoDB.
  await connectToDatabase(process.env.DB_CONNECTION_STRING)

  // Create an Express application.
  const app = express()

  // Set various HTTP headers to make the application a little more secure (https://www.npmjs.com/package/helmet).
  app.use(helmet())

  // Send messages to RabbitMQ.
  connectRabbitMQ()

  startNotificationService()
  
  configurePassport()// Create a Redis client
  
  const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379', // Specify the URL for Redis server
  })

  try {
  await redisClient.connect()
  console.log('Connected to Redis')

  } catch (error) {
    console.error(`Could not establish a connection with redis. ${error}`)
  }

  // Parse requests of the content type application/json.
  app.use(express.json())

  // Add the request-scoped context. Must be placed before any middleware that needs access to the context.
  app.use(httpContext.middleware)

  // Use a morgan logger.
  app.use(morganLogger)

  // Apply the rate limiting middleware to all requests.
  app.use(limiter)

  if (app.get('env') === 'production') {
    app.set('trust proxy', true) // trust the first proxy
    sessionOptions.cookie.secure = true // serve secure cookies
  }

  // Middleware to be executed before the routes.
  app.use((req, res, next) => {
    req.requestUuid = randomUUID()
    httpContext.set('request', req)
    console.log('Session ID:', req.sessionID);
    console.log('Session Content:', req.session);

    next()
  })

  // Session middleware must come before Passport middleware.
  //app.use(session(sessionOptions))

  app.use(session({
    store: new RedisStore({ client: redisClient, prefix: "auth:" }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production
  }}))

  // Passport initialization middleware
   app.use(passport.initialize())

   // Passport session middleware (this manages deserialization of the user)
   app.use(passport.session())
  

  passport.authenticate('session')
  // Configure Passport after session middleware

  
  // CORS configuration
  const corsOptions = {
    origin: 'https://cscloud8-229.lnu.se', // or '*' for all origins
    credentials: true,
    accessControlAllowOrigin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }

  app.use(cors(corsOptions))
  app.options('*', cors(corsOptions))

  // Register routes.
  app.use('/', router)

  // Error handler middleware.
  app.use((err, req, res, next) => {
    logger.error(err.message, { error: err })
    /*if (process.env.NODE_ENV === 'production') {
      // Ensure a valid status code is set for the error.
      if (!err.status) {
        err.status = 500
        err.message = http.STATUS_CODES[err.status]
      }

      res.status(err.status).json({
        error: err.message
      })
      return
    }
*/
    // Development environment: send detailed error info.
    const copy = JSON.decycle(err, { includeNonEnumerableProperties: true })

    return res.status(err.status || 500).json(copy)
  })

  // Starts the HTTP server listening for connections.
  const server = app.listen(process.env.NODEJS_EXPRESS_PORT, () => {
    logger.info(`Server running at http://localhost:${server.address().port}`)
    logger.info('Press Ctrl-C to terminate...')
  })
} catch (err) {
  logger.error(err.message, { error: err })
  process.exitCode = 1
}
