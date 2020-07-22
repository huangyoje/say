1. FileChannel 如何实现中断

2. redis 客户端如何实现异步? 连接如何管理?  
   select call back 后需要上下文进行处理, 这个上下文信息需不需要发送到服务端.

3. 连接复用
   一个connection 发送多个request.


_> hello


tcp connection:    request1               request2
                            response1               response2


    request1     request2   
                            response1  response2
