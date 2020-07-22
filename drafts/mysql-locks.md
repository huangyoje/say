# mysql lock type
## Insert Intention Locks(purpose ?)
> An insert intention lock is a type of gap lock set by INSERT operations prior to row insertion. This lock signals the intent to insert in such a way that multiple transactions inserting into the same index gap need not wait for each other if they are not inserting at the same position within the gap.

如果已有数据4, 10.
事物T0插入一条数据为7, 则(4,7)之间加 Insert Intention Locks, 对7这个位置加 X锁(no gap). Insert Intention Locks 互相不冲突

case 1: 如果其他事物插入一条数据5, 则在(4,5)直接加Insert Intention Locks, 然后对5这个位置加X锁(no gap).

case 2: 如果其他事物插入的数据也是7, 发现T0已经获得位置7的X锁, 则出现duplicate error, 此时 当前事物会申请对位置7加S锁. 如果同时有两个事物满足case2的情况, 则等T0结束后, 这两个事物会同时获得位置7的S锁, 然后都申请X锁，最后出现deadlock.


# lock set by sql
## insert ...
1. 首先获取 Insert Intention Locks
2. 然后获取插入位置的 x锁(no gap). 如果出现dumplicate key error, 则获取S锁.

## insert into ... on duplicate key update ...
> differs from a simple INSERT in that an exclusive lock rather than a shared lock is placed on the row to be updated when a duplicate-key error occurs.
An exclusive index-record lock is taken for a duplicate primary key value.
An exclusive next-key lock is taken for a duplicate unique key value.

1. 首先获取 Insert Intention Locks
2. 然后获取插入位置的 x锁(no gap). 如果出现dumplicate key error, 则获取 X锁.


## 如果更新(update, delete)的条件中无索引字段, 则锁全部记录,每两条记录之间的gap也加锁
