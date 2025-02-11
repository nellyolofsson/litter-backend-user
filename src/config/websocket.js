import { WebSocketServer } from 'ws'

// WebSocket-server
const wss = new WebSocketServer({ port: 8080 })

let clients = []

wss.on('connection', (ws) => {
  console.log('A new client connected')
  clients.push(ws)

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message)

      // Set userId on connection
      if (data.event === 'SET_USER_ID' && data.userId) {
        ws.userId = data.userId // Store userId on the WebSocket connection
        console.log(`Client userId set to: ${data.userId}`)
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err)
    }
  })

  // Handle connection closing
  ws.on('close', () => {
    console.log('A client disconnected')
    clients = clients.filter(client => client !== ws)
  })
})

// Send follow notification to relevant clients
/**
 *
 * @param followData
 */
const sendFollowNotification = (followData) => {
  const { followerId, followerName, userId } = followData
  console.log('sendFollowNotification:', followData)

  // Find the WebSocket client of the user being followed
  const followedUserSocket = clients.find(client => client.userId === userId)

  // Send notification to the followed user
  if (followedUserSocket && followedUserSocket.readyState === WebSocketServer.OPEN) {
    followedUserSocket.send(JSON.stringify({
      event: 'NEW_FOLLOWER',
      followerId,
      followerName
    }))
  }

  // Send follow update to all users following this user
  clients.forEach(client => {
    if (client.userId === userId && client.readyState === WebSocketServer.OPEN) {
      client.send(JSON.stringify({
        event: 'FOLLOW_UPDATE',
        followerId,
        followerName
      }))
    }
  })
}

// Handle follow logic
/**
 *
 * @param followerId
 * @param userId
 * @param followerName
 */
export const handleFollow = async (followerId, userId, followerName) => {
  console.log('handleFollow:', followerId, userId, followerName)
  sendFollowNotification({ followerId, followerName, userId })
}
