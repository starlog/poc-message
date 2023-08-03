const { Command } = require('commander');

const program = new Command();

const neo4j = require('neo4j-driver');
const data1 = require('./data/data');
const data2 = require('./data/data_with_snt');

function init() {
  return neo4j.driver(
    'neo4j://localhost',
    neo4j.auth.basic('neo4j', 'LongPassword1234!'),
  );
}

program
  .name('install')
  .description('Install message graph into neo4j')
  .version('0.0.1');

program.command('run')
  .argument('<string>', 'graph set. data1 | data2 ')
  .description('Install dataset (data1 | data2)')
  .action(async (dataSet) => {
    let myData;
    if (dataSet === 'data1') {
      myData = data1;
    } else {
      myData = data2;
    }
    const driver = init();
    const session = driver.session();
    await session.run('MATCH (n) DETACH DELETE n');
    // eslint-disable-next-line no-restricted-syntax
    for (const element of myData.getNodes()) {
      const query = `create (n:process {title:'${element.kTitle}', code:'${element.title}', kafkaTopic:'${element.kafkaTopic}', include:${JSON.stringify(element.include)}, hourLimit:${element.hourLimit}})`;
      console.log(query);
      // eslint-disable-next-line no-await-in-loop
      await session.run(query);
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const process of myData.getRelations()) {
      let i = 0;
      // eslint-disable-next-line no-restricted-syntax
      for (const step of process.steps) {
        let query;
        if (step.condition) {
          // eslint-disable-next-line no-plusplus
          query = `MATCH (a:process), (b:process) where a.code='${step.from}' AND b.code='${step.to}' CREATE (a)-[r:${process.description} {rank:${i++}, code:'${process.process}', condition:'${JSON.stringify(step.condition)}'}]->(b) RETURN type(r)`;
        } else {
          // eslint-disable-next-line no-plusplus
          query = `MATCH (a:process), (b:process) where a.code='${step.from}' AND b.code='${step.to}' CREATE (a)-[r:${process.description} {rank:${i++}, code:'${process.process}'}]->(b) RETURN type(r)`;
        }
        console.log(query);
        // eslint-disable-next-line no-await-in-loop
        await session.run(query);
      }
    }
    await driver.close();

    console.log('done');
    process.exit(0);
  });

program.parse();
