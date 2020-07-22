# redis replication
## asynchronous replication
```
min-replicas-to-write 1
min-replicas-max-lag 10
```
wait command.

# mysql replication
## method
### based on the master's binary log
   requires the log files and positions in them to be synchronized between master and slave.
### based on global transaction identifiers (GTIDs)
   Replication using GTIDs guarantees consistency between master and slave as long as all transactions committed on the master have also been applied on the slave.

## type
### asynchronous replication

### semisynchronous replication
In MySQL 8.0, semisynchronous replication is supported in addition to the built-in asynchronous replication. With semisynchronous replication, a commit performed on the master blocks before returning to the session that performed the transaction until at least one slave acknowledges that it has received and logged the events for the transaction

### delayed replication
 MySQL 8.0 also supports delayed replication such that a slave server deliberately lags behind the master by at least a specified amount of time

### synchronous replication
 For scenarios where synchronous replication is required, use NDB Cluster (see Chapter 22, MySQL NDB Cluster 8.0).

## format
### Statement Based Replication (SBR)
    replicates entire SQL statements
### Row Based Replication (RBR)
    replicates only the changed rows

# kafka replication
The unit of replication is the topic partition
## replica config
```text
# If a follower hasn't sent any fetch requests or hasn't consumed up to the leaders log end offset for at least this time, the leader will remove the follower from isr
replica.lag.time.max.ms
```
