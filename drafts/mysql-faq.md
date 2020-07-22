
* select last_insert_id()是否线程安全?

  多个线程并发插入数据(同表或不同表)时, 每个线程使用 `select last_insert_id()` 获取当前插入数据的自增主键是否安全？

  **安全**. [https://dev.mysql.com/doc/refman/5.5/en/information-functions.html#function_last-insert-id](https://dev.mysql.com/doc/refman/5.5/en/information-functions.html#function_last-insert-id)

  > The ID that was generated is maintained in the server   on a per-connection basis.

  last_insert_id返回值是connection_local的, 正常情况下connection不会同时在多个线程里使用.

* Nonlocking read vs Locking read

  Nonlocking read 也就是snapshot read. 读数据的时候不加锁. RR隔离级别下，在同一个事物中，所有的读操作读的都是第一次读时建立的快照。 由于没有加锁，此时其他线程可以并发的修改，删除，增加数据。

  Locking read 也就是current read. 读数据的时候需要加锁。在同一个事物中，所有的locking read都会先获取对应记录的锁，如果锁被其他事物占用，则等待。获取锁成功后，则读取相关记录已提交的最新数据，在当前事物提交之前，一直持有锁，阻止其他事物对数据进行修改。因此，事物的隔离级别自动变为RC。

  **两种locking read**

  - `select *** for share`

    等价于`select *** lock in share mode`。

    获取记录的S(共享)锁。 可以理解为读锁， 不会阻塞其他事物获取S锁，但会阻塞其他事物获取X锁。

  - `select *** for update`

    获取记录的X(排他)锁。 可以理解为写锁， 会阻塞其他事物获取S锁，X锁。

  **所有的写操作都会获取X锁**

* 意向锁的作用
  mysql 支持同时表级锁和记录锁。 如果一个事物需要获取表级锁时，需要判断当前没有其他事物拥有记录锁，如何判断？

  根据意向锁判断。任何事物获取记录锁之前，先要获取意向锁。因此需要获取表级锁的事物，只需要判断没有其他事物拥有意向锁即可(比判断其他事物没有拥有记录锁容易)。

* 如何理解锁，事物的四个属性

  原子性保证了数据不会处于不一致状态，是事物提交，回滚的基本单元。持久性保证了数据不丢失。

  要实现数据的一致性，就需要使用锁。

  不同的加锁策略决定了并发事物之间的数据可见性。 不同的加锁策略也影响事物的并发度。

  隔离性是数据一致性和并发度的trade off.

* 并发问题与锁
  - dirty read:
  - non-repeated read: record lock
  - phatom read: record lock && Gap lock

* 隔离级别与锁
  - RC: record lock
  - RR: record lock && Gap 锁
  - READ UNCOMMITTED:
  - SERIALIZABLE

* about phatom read?
  accourding to [https://en.wikipedia.org/wiki/Isolation_(database_systems)](https://en.wikipedia.org/wiki/Isolation_(database_systems)), The RR level has Phantoms problem, but for mysql, there are two kind of reads(snapshot read, current read). for current read, it's true, for snaphost read, it is false, becase snapshot always read the snapshot created at the start, so there is no Phatoms.

  * the advantage of mulitversion concurrenty control?
   [https://vladmihalcea.com/how-does-mvcc-multi-version-concurrency-control-work/](https://vladmihalcea.com/how-does-mvcc-multi-version-concurrency-control-work/)
   [https://dev.mysql.com/doc/refman/8.0/en/innodb-multi-versioning.html](https://dev.mysql.com/doc/refman/8.0/en/innodb-multi-versioning.html)

   为了实现consistent read, 减少不必要的 read/write contention.

* mysql 更新聚簇索引, 二级索引
  - Records in a clustered index are updated in-place, and their hidden system columns point undo log entries from which earlier versions of records can be reconstructed.
  - Unlike clustered index records, secondary index records do not contain hidden system columns nor are they updated in-place

  When a secondary index column is updated, old secondary index records are delete-marked, new records are inserted, and delete-marked records are eventually purged.

* 如何实现唯一约束
  gap locking:  There is a unique key constraint on a column and we are doing an insert. Mysql has to make sure that the lock it takes is sufficient to prevent another concurrent insert from adding a record with the same key.

* 自增锁与binlog

* mysql 半一致读

* 使用b+ 树做索引的好处

* 记录锁到底锁什么? 聚簇索引还是二级索引，没有二级索引怎么办?


 - 查询条件有索引
 - 查询条件无索引
