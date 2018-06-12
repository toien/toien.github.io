---
layout: post
title: Kafka usual commands
tags: kafka
---

My version: kafka_2.11-1.0.1

### Topics:

List all topics:

    # ./bin/kafka-topics.sh --list --zookeeper localhost:2181
    test_topic_1
    test_topic_2
    ...

##### To delete specific topic:

First, Add one line to server.properties file under config folder:

    delete.topic.enable=true

then, you can run this command:

    bin/kafka-topics.sh --zookeeper localhost:2181 --delete --topic test

Manually deletion will takes more time althogh shell has returned, its usually a few minutes base 
on the topic data size.After delete, list all topic to check out is a good habit.

Infomation from `kafka-topics.sh` is very limited, we will get more valuable info from 
`kafka-consumer-gropus.sh`.

### Consumers:

##### To list all consumer groups across all topics:

    bin/kafka-consumer-groups.sh --bootstrap-server broker1:9092 --list

##### To view offsets for the consumer group:

    ./bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group count_errors
    GROUP           TOPIC    PARTITION   CURRENT-OFFSET   LOG-END-OFFSET   LAG   OWNER
    count_errors    logs     2           2908278          2908278          0     consumer-1_/10.8.0.55
    count_errors    logs     3           2907501          2907501          0     consumer-1_/10.8.0.43
    count_errors    logs     4           2907541          2907541          0     consumer-1_/10.8.0.177
    count_errors    logs     1           2907499          2907499          0     consumer-1_/10.8.0.115
    count_errors    logs     0           2907469          2907469          0     consumer-1_/10.8.0.126

By now, we can only see one group detail at a time, maybe a `--all-groups` option is better.

##### To reset offsets:

    kafka-consumer-groups.bat --bootstrap-server kafka-host:9092 --group my-group --all-topics 
    --reset-offsets --to-earliest --execute

By default, `--reset-offsets` just prints the result of the operation. To actually perform the 
operation you need to add `--execute` to your command.

#### Clear all data

To delete manually:

1. Shutdown the cluster
2. Clean kafka log dir (specified by the `log.dir` attribute in kafka config file ) as well the 
   zookeeper data
3. Restart the cluster

`<EOF`