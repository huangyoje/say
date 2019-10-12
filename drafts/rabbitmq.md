# io
rabbit中做io操作的是framehandler, 每个connection都有自己的framehandler.  framhandler有block io和non block io两种实现.

block framehandler 在初始化时会执行起一个线程，循环阻塞读取io. 每个connection一个线程.

non block framehandler 会将自己注册到selector线程(NioLoop), NioLoop的线程数量=nbIoThreads. 每个connection按照序号取模选择一个NioLoop线程.

# consumer thread pool
通过connectionfactory设置共享的, 或创建connection的是参数传递. 每个connection上面的所有consumer共享一个thread pool

## consume
针对某个queue调用consume时, 会在rabbitmq server端生成一个随机数, 作为当前调用方的consumertag, server端维护每个queue上的所有consumer, 每次发送消息时, 通过负载均衡选择一个consumer进行发送.

处理消息流程
1. io线程读取Frame
2. 根据Frame上的channle number选择channel
3. 读取frame的内容到当前channel的_command对象
4. 根据consumer tag 选择consumer
5. 在consumer thread pool中异步执行consumer

所有的communication都是通过channel, 消息中包含channel number.

# workpool 作用
