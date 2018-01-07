# 细化锁粒度
# 每个workqueue里的task如何保证对其他线程的可见性
  - workqueue是通过数组实现
# 大量任务对gc的影响


Most of the time, one thread doesn’t care what the other is doing.
But when it does, that’s what synchronization is for.
