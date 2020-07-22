# why deadlock occurs?
  different order for accuire lock.

# deallock case
## insert with same dumplicate key.
并发执行时可能出现dead lock. 就算并发插入的数据key 不会重复.a

## 并发 insert 惟一键重复
1. 重复时发生dumplicate error.
2. 申请插入位置的S锁
3. 多个并发事物同时获取到S锁后, 都开始申请X锁
4. 都等待其他事物放弃S锁, 出现死锁
