import { AMQPClient } from '@cloudamqp/amqp-client';

async function startPublisher() {
  try {
    const cloudAMQPURL = process.env.CLOUDAMQP_URL;
    const connection = new AMQPClient(cloudAMQPURL);
    await connection.connect();
    const channel = await connection.channel();

    console.log('[✅] Connection over channel established');

    await channel.exchangeDeclare('emails', 'direct');
    const qNotification = await channel.queue('email.notifications');
    const qResetPassword = await channel.queue('email.resetpassword');
    await channel.queueBind('email.notifications', 'emails', 'notification');
    await channel.queueBind('email.resetpassword', 'emails', 'resetpassword');

    async function sendToQueue(routingKey, email, name, body) {
      const message = { email, name, body };
      const jsonMessage = JSON.stringify(message);

      await channel.basicPublish('emails', routingKey, jsonMessage);
      console.log('[📥] Message sent to queue', message);
    }

    sendToQueue('notification', 'example@example.com', 'John Doe', 'Your order has been received');
    sendToQueue('notification', 'example@example.com', 'Jane Doe', 'The product is back in stock');
    sendToQueue('resetpassword', 'example@example.com', 'Willem Dafoe', 'Here is your new password');

    setTimeout(() => {
      connection.close();
      console.log('[❎] Connection closed');
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error(error);

    setTimeout(() => {
      startPublisher();
    }, 3000);
  }
}

startPublisher();
