const { Command } = require('commander');

const program = new Command();
const { Kafka, Partitioners } = require('kafkajs');
const neo4j = require('neo4j-driver');
const log4js = require('log4js');
const _ = require('lodash');
const moment = require('moment');

const logger = log4js.getLogger('main');
logger.level = 'debug';

const kafkaSetup = {
  title: 'order',
};

const kafka = new Kafka({
  clientId: 'order-process',
  brokers: ['localhost:9093'],
});

async function processMessage(message, producer, session) {
  try {
    logger.debug(`RECEIVED=${message.value.toString()}`);
    const encodedMessage = JSON.parse(message.value.toString());

    // Query graph database.
    const query = `match (a)-[r {code:'${encodedMessage.process}', rank:${encodedMessage.step}}]->(b) return a,b,r order by r.rank`;
    logger.debug(`QUERY=${query}`);
    const data = await session.run(query);

    // Next Step exists.
    if (data.records.length > 0) {
      logger.debug(`DATA from Neo4j=${JSON.stringify(data.records[0]._fields[1])}`);
      logger.debug(`Routing message to ${data.records['0']._fields['1'].properties.kafkaTopic}`);

      // Generate message.
      const sendMessage = {
        key: 'order',
        value: {
          process: encodedMessage.process,
          from: kafkaSetup.title,
          to: 'order',
          step: encodedMessage.step + 1,
          at: Date().toString(),
          payLoad: _.cloneDeep(encodedMessage.payLoad),
        },
      };
      sendMessage.value.payLoad.history.push({
        from: kafkaSetup.title,
        to: data.records['0']._fields['1'].properties.kafkaTopic,
        time: moment().valueOf(),
        count: encodedMessage.step + 1,
      });
      sendMessage.value = JSON.stringify(sendMessage.value);

      // Sending message.
      await producer.send({
        topic: `${data.records['0']._fields['1'].properties.kafkaTopic}-topic`,
        messages: [
          sendMessage,
        ],
      });
    } else {
      logger.debug(`END of process. Final message is ${JSON.stringify(encodedMessage, null, 2)}`);
    }
  } catch (ex) {
    logger.error(ex);
  }
}

program
  .name('order')
  .description('Message dispatcher')
  .version('0.0.1');

program.command('start')
  .description('Start message dispatching.')
  .action(async () => {
    const neo4jDriver = neo4j.driver(
      'neo4j://localhost',
      neo4j.auth.basic('neo4j', 'madmax2'),
    );
    const session = neo4jDriver.session();

    const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
    await producer.connect();

    const consumer = kafka.consumer({ groupId: 'process-group' });
    await consumer.connect();
    await consumer.subscribe({ topic: 'order-topic', fromBeginning: false });

    await consumer.run({
      // eslint-disable-next-line no-unused-vars
      eachMessage: async ({ topic, partition, message }) => {
        await processMessage(message, producer, session);
      },
    });
  });

program.parse();
