import {RedisStore} from 'connect-redis'
import redis from 'redis'

// Create a Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379', // Specify the URL for Redis server
})

try {
  await redisClient.connect()
  console.log('Connected to Redis')

} catch (error) {
  console.error(`Could not establish a connection with redis. ${error}`)
}

export const sessionOptions = {
  store: new RedisStore({ client: redisClient, prefix: "auth:" }), // Use Redis as the session store
  name: process.env.SESSION_NAME || 'sid', // Default session cookie name if not specified
  secret: process.env.SESSION_SECRET, // Secret for session hashing
  resave: false, // Don’t save session if not modified
  saveUninitialized: false, // Don’t create session until something stored
  cookie: {
    domain: process.env.NODE_ENV === 'production' ? 'https://cscloud8-229.lnu.se' : 'http://localhost:3000',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: false, // Set to true in production
    httpOnly: true, // The cookie is not accessible
  }
}

// Enable secure cookies in production
/* if (process.env.NODE_ENV === 'production') {
  sessionOptions.cookie.secure = true // Ensure cookies are only sent over HTTPS in production
}*/
