const { Command } = require('commander')
const program = new Command()
const {Kafka, Partitioners} = require('kafkajs')

const kafka = new Kafka({
  clientId: 'start-process',
  brokers: ['localhost:9093']
})

program
  .name('send')
  .description('Initiate washswat message process')
  .version('0.0.1')

program.command('send')
  .description('Start message process (P_001..P_007')
  .argument('<string>','Message type')
  .action(async (str) => {
    const producer = kafka.producer({createPartitioner: Partitioners.LegacyPartitioner})
    await producer.connect()

    await producer.send({
      topic: 'order-topic',
      messages: [
        {
          key: 'order',
          value: JSON.stringify({
            process: str,
            from: 'order',
            to: 'handler',
            step: 0,
            at: Date().toString(),
            payLoad: {
              history: [
              ],
              sid: '1234567890',
              uid: 3456,
              address: 'Some address data'
            }
          })
        },
      ],
    })
    console.log('done');
    process.exit(0);
  });

program.parse();
