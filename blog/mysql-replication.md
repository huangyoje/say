---
title: 'mysql-replication'
author: yoje
date: 2019-06-02
---

# nbte
1. replication is asynchronous by default
2.

# method
## replicating events from the master's binary log
1. config master
```text
// 指定binary log的位置, 并且会自动开启binary log
--log-bin =  
// 指定
--server-id =
innodb_flush_log_at_trx_commit=1
sync_binlog=1
skip-networking = false
```
2. config slave
```text
[mysqld]
// each one must have a unique nonzero value that differs from that of the master and from any of the other slaves.
server-id=2
```
3. Creating a User for Replication
```text
CREATE USER 'repl'@'%.example.com' IDENTIFIED BY 'password';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'%.example.com';
```
4. Obtaining the Replication Master Binary Log Coordinates

获取slave 进行复制的binary log 位置(包括 binary log 文件名称, 文件内部的position)

- master已有数据
  ```text
  // 针对innodb 引擎, 使用mysqldump 工具复制已有的数据到slave上面
  mysqldump --all-databases --master-data=2 > dbdump.db
  // 针对非innodb 引擎, 推荐使用数据库可移植二进制文件
  https://dev.mysql.com/doc/refman/5.7/en/replication-snapshot-method.html
  ```
- master无历史数据
  ```text
  binary log file = ''
  position = 4
  ```
5. Setting Up Replication Slaves
