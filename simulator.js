const { Command } = require('commander');
const { Kafka, Partitioners } = require('kafkajs');
const log4js = require('log4js');
const _ = require('lodash');
const moment = require('moment');

const program = new Command();

async function processMessage(message, producer, kafkaSetup, logger) {
  try {
    logger.debug(`RECEIVED=${message.value.toString()}`);
    const encodedMessage = JSON.parse(message.value.toString());

    const sendMessage = {
      key: 'order',
      value: {
        process: encodedMessage.process,
        from: kafkaSetup.title,
        to: 'order',
        step: encodedMessage.step,
        at: Date().toString(),
        payLoad: _.cloneDeep(encodedMessage.payLoad),
      },
    };
    sendMessage.value.payLoad.history.push({
      from: kafkaSetup.title,
      to: 'order',
      time: moment().valueOf(),
      count: encodedMessage.step,
    });
    sendMessage.value = JSON.stringify(sendMessage.value);

    logger.debug(`'SENDING: ${JSON.stringify(sendMessage)}`);
    await producer.send({
      topic: 'order-topic', // Always back to order
      messages: [sendMessage],
    });
  } catch (ex) {
    logger.error(ex);
  }
}

program
  .name('simulator')
  .description('Washswat message based routing simulator')
  .version('0.1.0');

program.command('run')
  .description('Run a simulated message handler for domain.')
  .argument('<string>', 'domain name(lgs, laundry, billing, storage, secondhand)')
  .action(async (str) => {
    const kafkaSetup = {
      title: str,
    };

    const kafka = new Kafka({
      clientId: `${kafkaSetup.title}-client`,
      brokers: ['localhost:9093'],
    });

    const logger = log4js.getLogger(kafkaSetup.title);
    logger.level = 'debug';

    const producer = kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });
    await producer.connect();
    const consumer = kafka.consumer({ groupId: `${kafkaSetup.title}-group` });
    await consumer.connect();
    await consumer.subscribe({
      topic: `${kafkaSetup.title}-topic`,
      fromBeginning: false,
    });

    await consumer.run({
      // eslint-disable-next-line no-unused-vars
      eachMessage: async ({ topic, partition, message }) => {
        await processMessage(message, producer, kafkaSetup, logger);
      },
    });
  });
program.parse();
