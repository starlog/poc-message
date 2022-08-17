const {Command} = require('commander')
const program = new Command()
const {Kafka, Partitioners} = require('kafkajs')
let neo4j = require('neo4j-driver')
let log4js = require('log4js')
let _ = require('lodash')
let moment = require('moment')

let logger = log4js.getLogger('main');
logger.level = 'debug';

const kafkaSetup = {
  title: 'order',
}

const kafka = new Kafka({
  clientId: 'order-process',
  brokers: ['localhost:9093']
})

async function processMessage(message, producer, session) {
  try {
    logger.debug(`RECEIVED=${message.value.toString()}`);
    let encodedMessage = JSON.parse(message.value.toString());

    // Query graph database.
    let query = `match (a)-[r {code:'${encodedMessage.process}', rank:${encodedMessage.step}}]->(b) return a,b,r order by r.rank`;
    logger.debug(`QUERY=${query}`);
    let data = await session.run(query);

    // Next Step exists.
    if (data.records.length > 0) {
      logger.debug(`DATA from Neo4j=${JSON.stringify(data.records[0]._fields[1])}`);
      logger.debug(`Routing message to ${data.records["0"]._fields["1"].properties.kafkaTopic}`);

      // Generate message.
      let sendMessage = {
        key: 'order',
        value: {
          process: encodedMessage.process,
          from: kafkaSetup.title,
          to: 'order',
          step: encodedMessage.step + 1,
          at: Date().toString(),
          payLoad: _.cloneDeep(encodedMessage.payLoad)
        }
      };
      sendMessage.value.payLoad.history.push({
        from: kafkaSetup.title,
        to: data.records["0"]._fields["1"].properties.kafkaTopic,
        time: moment().valueOf(),
        count: encodedMessage.step + 1,
      })
      sendMessage.value = JSON.stringify(sendMessage.value);

      // Sending message.
      await producer.send({
        topic: `${data.records["0"]._fields["1"].properties.kafkaTopic}-topic`,
        messages: [
          sendMessage
        ],
      })
    } else {
      logger.debug(`END of process. Final messag is ${JSON.stringify(encodedMessage, null, 2)}`);

    }
  } catch (ex) {
    logger.error(ex);
  }
}

program
  .name('order')
  .description('Message dispather')
  .version('0.0.1')

program.command('start')
  .description('Start message dispatching.')
  .action(async () => {

    let neo4jDriver = neo4j.driver(
      'neo4j://localhost',
      neo4j.auth.basic('neo4j', 'madmax2')
    )
    let session = neo4jDriver.session();

    const producer = kafka.producer({createPartitioner: Partitioners.LegacyPartitioner})
    await producer.connect()

    const consumer = kafka.consumer({groupId: 'process-group'})
    await consumer.connect()
    await consumer.subscribe({topic: 'order-topic', fromBeginning: false})

    await consumer.run({
      eachMessage: async ({topic, partition, message}) => {
        await processMessage(message, producer, session);
      },
    })

  });

program.parse();
