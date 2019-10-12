# Node
 - int id;
 - String idString;
 - String host;
 - int port;

# PartitionInfo
 - String topic;
 - int partition;
 - Node leader;
 - Node[] replicas;
 - Node[] inSyncReplicas;

# TopicPartition
 - int partition;
 - String topic;

# Cluster
 - List<Node> nodes
 - Map<TopicPartition, PartitionInfo> partitionsByTopicPartition:
 - Map<String, List<PartitionInfo>> partitionsByTopic;
 - Map<String, List<PartitionInfo>> availablePartitionsByTopic;
 - Map<Integer, List<PartitionInfo>> partitionsByNode;
 - Map<Integer, Node> nodesById;




1. Cluster.bootstrap(addresses)
2.


1. zk 挂掉, 不可用
2. canal server 挂掉
3. 已有的表如何同步数据

# 第一次启动, 如何加载已有的全量数据?
  如何初始化数据?

## mysql server binlog = on, format=row
   直接使用canal 增量读取

## mysql server binlog = off, format != row
  1. mysql server must restart
  2. 在某个时间点备份全量数据,并且开启binlog






订单查询服务?
- 可用性
- 性能
- 一致性

distributed cache:
redis, es, mysql

local cache:
caffine cache: refresh after write
read: read current version  non-blocking
refresh: async
performance


1. 按频率更新资产
2. 实时更新资产




# 程序启动如何加载数据
1. 来源
 - 数据量少时, 读数据库(分布式数据库, redis(aof), hbase, es)
 - 数据量多时, 读local db.  
2.
