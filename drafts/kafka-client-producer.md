1. 每种类型的消息对应一种KafkaProducer类型
2. KafkaProducer is thread safe


# process of create KafkaProducer
1. get clientId  (used to mark client in the server-side log)
2. create MetricConfig
 - clientId
 - metrics.num.samples = 2
 - metrics.sample.window.ms = 5 * 60 * 1000 ms
 - metric.reporters = ""  . always JMXReporter(kafka.producer).
3. create Metrics
4. create partitioner. DefaultPartitioner
5. retry.backoff.ms  60 * 1000
6. keySerializer, valueSerializer
7. interceptor.classes
> A list of classes to use as interceptors. Implementing the <code>ProducerInterceptor</code> interface allows you to intercept (and possibly mutate) the records received by the producer before they are published to the Kafka cluster. By default, there are no interceptors.

8. init ClusterResourceListeners
9. create Metadata
 - metadata.max.age.ms
10. some properties   
 - max.request.size
 - buffer.memory
 - compression.type
 - max.block.ms
 - request.timeout.ms
11. create RecordAccumulator
12. create bootstrap cluster by bootstrap.servers
13. a
14. init  ChannelBuilder
 - SecurityProtocol security.protocol
15. NetworkClient
 - max.in.flight.requests.per.connection : default = 5



end. start io thread

# process of send message
1. ProducerInterceptors.onSend()
2. waitOnMetadata
 - metadata.add(topic); // 每次发送都add?
 - cluster = metadata.fetch();
 - cluster.partitionCountForTopic(topic); // 如果找不到该topic对应的partition, 则开始更新
 - sender.wakeup(); // 为什么要唤醒 sender 线程
3. serialize key & value
4. compute partition
5. check size
6. InterceptorCallback
7. accumulator.append
8. try wakeup sender to send msg




# metadata 如何更新
1. 创建KafkaProducer的时候
 - this.metadata.update(Cluster.bootstrap(addresses), time.milliseconds());


2. 更新不及时怎么办?


# sender io thread(NetworkClient, accumulator, metadata, SenderMetrics, guaranteeMessageOrder)
1. cluster = metadata.fetch();
2. accumulator.ready(cluster, now);
3. accumulator.drain
4. createProduceRequests
5. NetworkClient.send(request, now);
 - inFlightRequests.add(request); (destination -> queue)
 - selector.send(request.request());
  - find kafkaChannel by request.destination
   - kafkachannel.setSend(sendrequest).
   - kafkachannel.transportLayer.addInterestOps(SelectionKey.OP_WRITE);
   - SelectionKey.interestOps
6. NetworkClient.poll(pollTimeout, now);
 - metadataUpdater.maybeUpdate(now);
 - selector.poll(Utils.min(timeout, metadataTimeout, requestTimeoutMs));

# NetworkClient(selector, inFlightRequests, metadataUpdater)


# Selector(Map<destination, KafkaChannel> channels)


# KafkaChannel(id=destination, TransportLayer, receive, send)

# TransportLayer(SelectionKey)
