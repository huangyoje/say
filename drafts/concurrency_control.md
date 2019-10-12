
# what is concurrency_control
[https://en.wikipedia.org/wiki/Concurrency_control](https://en.wikipedia.org/wiki/Concurrency_control)

保证事物并发执行的正确性.

如果没有并发控制?
1. The lost update problem
2. The dirty read problem
3. The incorrect summary problem

## 策略
1. Optimistic: 延迟检查
2. Pessimistic:
3. Semi-optimistic

## 方法
1. Two_Phase Locking
2. Serialization graph checking
3. Timestamp ordering
4. Multiversion concurrency control
5. Index concurrency control
6. B-Tree concurrency control


# Two_Phase Locking
1. Expanding phase (aka Growing phase): locks are acquired and no locks are released (the number of locks can only increase).
2. Shrinking phase (aka Contracting phase): locks are released and no locks are acquired.

> The two phase locking rule can be summarized as: never acquire a lock after a lock has been released.

# 分布式环境 一致性
