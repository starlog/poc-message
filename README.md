Washswat message based workflow route simulator<br>

How to use?<br>

First of all, 
- run Kafka and zoo keeper docker<br>
- run Neo4j docker.<br>

Run following simulators first. On each terminal.<br>

~~~
node simulator.js run laundry
node simulator.js run lgs
node simulator.js run billing
node simulator.js run storage
node simulator.js run secondhand
node simulator.js run snt
node order.js start
~~~

Run message starter for testing message flow<br>

~~~
node send.js send P_001
~~~

P_001: 세탁주문<br>
P_002: 세탁 후 보관 주문 입고<bR>
P_003: 보관 주문 출고<br>
P_004: 세탁 없이 보관 주문 입고<br>
P_005: 중고 판매 입고<br>
P_006: 중고 판매 세탁 없이 출고<br>
P_007: 중고 판매 세탁후 출고<br>

For installing message flow, use install.js as follows;
~~~
node install.js run [data1 | data2] 
~~~


docker-compose.yml
~~~
version: "3"

networks:
  kafka-net:
    driver: bridge

services:
  zookeeper:
    image: bitnami/zookeeper:3.7
    networks:
      - kafka-net
    ports:
      - '2181:2181'
    environment:
      - ALLOW_ANONYMOUS_LOGIN=yes
  kafka:
    image: bitnami/kafka:3
    networks:
      - kafka-net
    ports:
      - '9093:9093'
    environment:
      - KAFKA_CFG_ZOOKEEPER_CONNECT=zookeeper:2181
      - ALLOW_PLAINTEXT_LISTENER=yes
      - KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=CLIENT:PLAINTEXT,EXTERNAL:PLAINTEXT
      - KAFKA_CFG_LISTENERS=CLIENT://:9092,EXTERNAL://:9093
      - KAFKA_CFG_ADVERTISED_LISTENERS=CLIENT://kafka:9092,EXTERNAL://localhost:9093
      - KAFKA_CFG_INTER_BROKER_LISTENER_NAME=CLIENT
    depends_on:
      - zookeeper

~~~
run as: 
~~~
docker-compose up -d
~~~


neo4j Docker CLI
~~~
docker run --publish=7474:7474 --publish=7687:7687 --volume=$HOME/neo4j/data:/data -d -e NEO4J_AUTH=neo4j/madmax2 neo4j
~~~
