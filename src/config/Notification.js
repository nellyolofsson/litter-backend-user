import amqp from 'amqplib'
import nodemailer from 'nodemailer'

const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672'

/**
 *
 */
export async function startNotificationService () {
  let channel

  // Anslut till RabbitMQ och skapa en kanal
  const connection = await amqp.connect(rabbitMQUrl)
  channel = await connection.createChannel()

  // Skapa en kö (om den inte redan finns)
  const queue = 'notifications_queue'
  await channel.assertQueue(queue, { durable: true })

  console.log(`Waiting for messages in queue: ${queue}`)

  channel.consume(queue, async (message) => {
    if (message !== null) {
      const notification = JSON.parse(message.content.toString())
      console.log('Received notification:', notification)

      // Skicka e-post
      try {
        await sendEmail(notification)
        console.log('Email sent successfully')
      } catch (error) {
        console.error('Error sending email:', error)
      }

      // Bekräfta att meddelandet är bearbetat
      channel.ack(message)
    }
  })
}
