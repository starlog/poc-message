const { Command } = require('commander');

const program = new Command();
const { Kafka, Partitioners } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'start-process',
  brokers: ['localhost:9093'],
});

program
  .name('send')
  .description('Start washswat message process')
  .version('0.0.1');

program.command('send')
  .description('Start message process (P_001..P_007)\n'
    + 'P_001: 세탁주문\n'
    + 'P_002: 세탁 후 보관 주문 입고\n'
    + 'P_003: 보관 주문 출고\n'
    + 'P_004: 세탁 없이 보관 주문 입고\n'
    + 'P_005: 중고 판매 입고\n'
    + 'P_006: 중고 판매 세탁 없이 출고\n'
    + 'P_007: 중고 판매 세탁후 출고\n')
  .argument('<string>', 'Message type')
  .action(async (str) => {
    const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
    await producer.connect();

    const result = await producer.send({
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
              history: [],
              sid: '1234567890',
              uid: 3456,
              address: '서울시 어쩌고 저쩌고',
            },
          }),
        },
      ],
    });
    console.log('done');
    process.exit(0);
  });

program.parse();
