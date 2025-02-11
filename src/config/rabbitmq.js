import amqp from 'amqplib'

const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672'
let channel

// Anslut till RabbitMQ och skapa en kanal
/**
 *
 */
export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(rabbitMQUrl)
    channel = await connection.createChannel()

    // Skapa en kö (om den inte redan finns)
    const queue = 'notifications_queue'
    await channel.assertQueue(queue, { durable: true })

    console.log('Connected to RabbitMQ:', rabbitMQUrl)
    console.log('Hejhej', process.env.NODE_ENV)
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error)
    setTimeout(connectRabbitMQ, 5000) // Försök att återansluta efter 5 sekunder
  } // Beständig kö
}

// Skicka ett meddelande till RabbitMQ-kön
/**
 *
 * @param message
 */
export const sendToRabbitMQ = async (message) => {
  try {
    const queue = 'followersQueue'
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true })
    console.log('Message sent to RabbitMQ queue:', message)
  } catch (error) {
    console.error('Failed to send message to RabbitMQ queue:', error)
  }
}
