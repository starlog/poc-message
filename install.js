'use strict';
const {Command} = require('commander')
const program = new Command()

let neo4j = require('neo4j-driver');
let data1 = require('./data/data');
let data2 = require('./data/data_with_snt');

function init() {
  let driver = neo4j.driver(
    'neo4j://localhost',
    neo4j.auth.basic('neo4j', 'madmax2')
  )
  return driver;
}

program
  .name('install')
  .description('Install message graph into neo4j')
  .version('0.0.1')

program.command('run')
  .argument('<string>', 'graph set. data1 | data2 ')
  .description('Install dataset (data1 | data2)')
  .action(async (dataSet) => {

    let myData = data1;
    if (dataSet === 'data1') {
      myData = data1;
    } else {
      myData = data2;
    }
    let driver = init();
    let session = driver.session();
    await session.run('MATCH (n) DETACH DELETE n')
    for (const element of myData.getNodes()) {
      const query = `create (n:process {title:'${element.kTitle}', code:'${element.title}', kafkaTopic:'${element.kafkaTopic}', include:${JSON.stringify(element.include)}, hourLimit:${element.hourLimit}})`;
      console.log(query);
      await session.run(query)
    }
    for (const process of myData.getRelations()) {
      let i = 0;
      for (const step of process.steps) {
        let query;
        if (step.condition) {
          query = `MATCH (a:process), (b:process) where a.code='${step.from}' AND b.code='${step.to}' CREATE (a)-[r:${process.description} {rank:${i++}, code:'${process.process}', condition:'${JSON.stringify(step.condition)}'}]->(b) RETURN type(r)`;
        } else {
          query = `MATCH (a:process), (b:process) where a.code='${step.from}' AND b.code='${step.to}' CREATE (a)-[r:${process.description} {rank:${i++}, code:'${process.process}'}]->(b) RETURN type(r)`;
        }
        console.log(query);
        await session.run(query);
      }
    }
    await driver.close()

    console.log('done');
    process.exit(0);
  });

program.parse();
