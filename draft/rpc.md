## rpc背景
1. 为什么需要rpc   
2. 微服务与rpc

## 一个简单的rpc调用
- 服务提供端
```java
  // 1. 准备好对外提供的服务
  // 2. 打开某个端口等待客户端连接
  Closer closer = Closer.create();
  try {
      ServerSocketChannel serverSocketChannel = closer.register(ServerSocketChannel.open());
      serverSocketChannel.bind(new InetSocketAddress(8888));
      while (!stop()) {
          // 在8888端口等待客户端连接
          SocketChannel socketChannel = closer.register(serverSocketChannel.accept());
          // 接受到某个客户端连接，
          // 首先解析客户端请求的是什么服务,以及参数 (协议)
          // 调用相关服务 (如何调用服务)
          /////////////////////////////////////////////////////////////////
          / 这里的问题是知道了客户端需要的服务的接口名和方法名，及参数,如何进行调用 //
          ////////////////////////////////////////////////////////////////
          // 通过socketChannel返回结果给客户端  socketChannel.write(result)
      }
  } catch (IOException e) {
      e.printStackTrace();
  } finally {
      closer.close();
  }
```
- 服务消费端
```java
  // 执行自己的业务逻辑
  // 开始调用其他服务
  Closer closer = Closer.create();
  try {
      SocketChannel socketChannel = closer.register(SocketChannel.open());
      socketChannel.connect(new InetSocketAddress("127.0.0.1",8888));
      // socketChannel.write(service name + parameters)  发送给服务端自己调用的服务名，参数
      // socketChannel.read()  获取服务端的结果
  } catch (IOException e) {
      e.printStackTrace();
  } finally {
      closer.close();
  }
  // 执行剩余的业务逻辑...
```

## rpc中存在的问题
上面调用示例中，可以发现一次rpc调用就是consumer端发起一次socket通信. consumer的调用其实就是向provider建立连接，发送数据，provider端侦听端口，并且处理consumer发起的连接。
consumer在每个需要调用远程服务的地方建立连接，发送远程服务接口名，方法名，参数; 而provider在一个端口上，进行侦听，当收到连接解析出接口名，方法名，参数后，如何调用相应的方法. 最笨的方法就是下面
```java
if(接口名=="xxx" && 方法名=="yyy"){
  xxx.yyy(arguments)
} else if(接口名=="xxx" && 方法名=="zzz"){
  xxx.zzz(arguments)
} else if
....
```
这是两个问题，一个是服务端路由，即找到客户端需要的服务；一个是服务端调用相应的服务。 由于一个端口上侦听着多个服务，接到客户端一个连接时，需要按照客户端传递的数据找到客户端需要的服务进行调用。如spring mvcw中服务端要根据url找到特定controller的方法执行。
java中可以使用反射，将每个方法以接口名，方法名，参数类型作为key，method对象作为key存在map中，则解析出客户端请求的服务后，计算出key拿到method，反射调用即可.


这里的第一个问题就是consumer如何调用服务，provider如何区分不同的服务.设计rpc框架时必须要考虑consumer如何调用(代码如何编写).这个问题本质就是服务的存在形式，在consumer端和provider端分别如何的存在.存在形式决定了如何进行调用.   
consumer端调用一次远端服务关联者provider端的一次调用,consumer调用是建立socket连接发送数据,接受响应; provider端的调用是先调用真正的服务，然后发送结果给consumer.

确定好服务的表现形式及调用方式后，还需要解决的一个问题是，当发起调用时，consumer要和provider建立socket连接，所以需要provider的ip地址和端口号.也就是consumer需要记录提供该服务的provider的地址，这个问题当然可以在启动应用之前，获取所有服务端的地址信息保存起来，但是问题在于对于某个服务，服务端地址可能发生变化，这时我们不希望重启consumer，因此rpc框架需要解决第二个问题，即提供一个服务地址自动发现机制.

对于某个服务，为了防止单点问题，通常会有多个服务端提供相同的服务，因此在客户端每个服务保存中多个服务端地址信息，在进行socket连接之前，需要从多个地址里找出一个来，这就需要rpc框架解决的第三个问题, 提供负责均衡机制.

解决了如何调用，确定服务端地址后，剩下的就是和服务端通信，这里就涉及到通信协议，而通信协议在5层通信模型中，每一层都有自己的协议，我们关心的通常是传输层和应用层协议，传输层使用tcp还是udp，应用层使用啥？
> 传输层协议的目的
> 应用层协议的目的  

总结下rpc调用时需要解决的问题:
- 服务的存在形式，调用方式 (核心)  
- 路由, 找到提供对应服务的provider地址  (可选)     
- 负载均衡, 从多个provider中按照策略找出一个  (可选)       
- 通信, 按照约定的通信协议和provider通信   (核心)  
rpc框架实现时，应该对用户使用起来保持简介(代码量少)，而又不失灵活性(使用不同负载均衡策略，不同通信协议，同步异步等).

## rpc & dubbo
#### 1. 服务的形式及调用   
dubbo在consumer端实现了透明调用. 通过引入服务端提供的api jar包，对每个接口生成一个代理对象，在需要调用远程服务的地方直接通过代理对象调用相应的方法。 由代理对象实现连接服务端，发送数据，接收结果。
而在服务端，对于提供服务的每个接口，都对应一个`Exporter`，针对每个接口的每种实现,计算得到一个servicekey，将key和Exporter存在map中，收到客户端的请求时，先计算key，然后找到Exporter调用相应的服务.
因此在dubbo中，服务在provider端的形式是Exporter, 在consumer端是对接口生成的一个代理对象.

回答了服务的存在形式及调用方式后，看看具体的功能如何实现.
provider端需要实现的功能是调用真正的服务，按照约定的协议发送结果给consumer.   
consumer端需要实现的功能包括路由，负载均衡，按照约定的协议建立连接，发送数据.
这其中每个功能的实现都需要很多的代码量，因此肯定不能将所有功能放在一个类里面. dubbo 通过定义`Invoker`接口，使用包装器设计模式实现上面提到的功能.
```java
public interface Invoker<T> extends Node{
  Result invoke(Invocation invocation) throws RpcException;
}
```
下面根据具体功能的实现分析这个接口.
#### 通信
一次rpc调用关联着consumer和provider端的两次调用. `Invoker`接口抽象出了这两次调用。
这两次调用的核心是consumer端建立连接，发送数据，provider端调用真正服务，返回结果. 这里面涉及到通信, 通信时需要相应的通信协议.而每种通信协议定义的消息格式是不同的，因此这个接口屏蔽了不同通信协议之间的消息格式差异.
consumer端根据每种协议实现该接口时，先讲Invocation转换成对应的消息格式，然后根据协议规定发送到provider端，将收到的结果转换为Result;
```java
// DubboInvoker
Result doInvoke(final Invocation invocation){
  // dubbo协议定义的消息格式本身就是Invocation和Result，因此直接发送
  ...
  currentClient.send(inv, isSent);
  ...
}
```
provider端实现该接口时，先讲消息转换为Invocation对象，然后调用真正的服务，最后将Result转换为协议自己的消息格式发送给consumer.
#### 路由
dubbo-cluster包
路由就是查找服务的地址，服务的地址可以静态直接配置，也可以配置一个注册中心，然后通过注册中心获取。通过register配置注册中心.

connections配置是否共享连接.
DubboProtocol#getClients(URL url)


#### 负载均衡

#### 如何将这些功能联系起来

#### consumer端如何实现代理对象   
1. consumer 的配置
```xml
<dubbo:reference id="demoService" interface="com.alibaba.dubbo.demo.DemoService" />
```
这里配置的参数都会以k-v结构存储在map中.后续每个过程需要什么参数时通过map获取.     
2. 代理如何生成
生成代理的时候可以选择jdk动态代理或第三方字节码生成技术，dubbo设计了`ProxyFactory`接口，这个接口分别实现了jdk动态代理，javassist字节码生成。讨论动态代理.
使用动态代理时，其实就是需要实现`InvocationHandler`接口，对原来接口方法的调用都会委托给这个接口的invok()方法.因此相应功能实现都在这个接口的实现中.
3. 所有的功能都在这个代理对象上，那么每种功能和代理对象是什么关系，is-a or has-a.

在每一层自己定义接口，这些接口有些是负责实现该层的功能，有些接口负责层与层之间的交互.
因为每一层的功能边界是确定的，但每一层功能的实现方式非常多，不同的实现方式的数据结构或其他东西可能有所不同,所以需要对核心功能定义接口，统一数据结构,屏蔽每种实现方式的差异.使得层与层之间的交互透明,解耦.

每一层对核心功能实现提供扩展，向其他层提供透明调用,屏蔽差异.
从consumer和provider两个角度考虑.



#### dubbo-rpc
这一层定义通信协议.通信协议规定了通信的消息格式，消息编解码，封装了tcp连接.
> 通信协议包括指定消息格式，封装tcp连接       

由于每种协议的差异性: 发送的数据，收到的结果类型不一致。因此定义`Invocation`接口表示发送的数据，`Result`接口表示收到的结果.默认实现分别是`RpcInvocation`， `RpcResult`,  其他协议在发送消息前，将RpcInvocation转换为自己的消息格式,在收到结果后将结果转换为PpcResult.
###### 先从consumer端分析这一层
在consumer端,当我们在代理对象上调用对应的方法时，就进入了dubbo-rpc层.   
```java
// InvokerInvocationHandler# invoke()方法
// return invoker.invoke(new RpcInvocation(method, args)).recreate(); 将这一行代码拆下面3行
RpcInvocation rpcInvocation = new RpcInvocation(method, args); // 1
Result result = invoker.invoke(rpcInvocation);  // 2
return result.recreate();  // 3
```  
1. 进入这一层时，为了屏蔽每种协议的差异性,先根据调用的服务及参数生成RpcInvocation.上面代码中的1
2. 接下来就是按照特定的协议发起调用(按照特定协议建立连接, 发送数据),并且获取结果.
这里的问题是不同的协议发送的消息，收到的结果数据结构不同，dubbo通过定义如下接口屏蔽协议之间的差异:
```java
public interface Invoker<T> extends Node{
  Result invoke(Invocation invocation) throws RpcException;
}
```
入参统一为Invocation, 结果为Result. 每种协议实现各自的invoker, 在实现内部将invocation转换为自己的消息格式,将结果转换为Result, 自己实现消息的编解码, 按照协议规定建立连接.
```java
// thrift 协议  @See ThriftInvoker
protected Result doInvoke( Invocation invocation ) throws Throwable {
  // ...
  // 只规定了消息编解码
  inv.setAttachment( ThriftCodec.PARAMETER_CLASS_NAME_GENERATOR, getUrl().getParameter(
          ThriftCodec.PARAMETER_CLASS_NAME_GENERATOR, DubboClassNameGenerator.NAME ) );
  // ...
}
// http协议
// 使用spring提供的HttpInvokerProxyFactoryBean实现,spring实现了消息格式的转换, 以及编解码, http连接
```
> dubbo协议的实现     
> 消息格式就使用Invocation 和 Result        
> 自定义编解码器
> 基于NIO自己实现连接,见dubbo-remoting分析

如何得到invoker对象, 定义了另一个接口, 这是dubbo定义的接口中唯一一个注释比较详细的，贴出来.
```java
@SPI
public interface Protocol {
  /**
   * @param type 服务的类型, 即定义的接口
   * @param url 远程服务的URL地址, 这个很有必要，因为对于相同的接口可能不同的服务端实现的协议不同
   */
  @Adaptive
  <T> Invoker<T> refer(Class<T> type, URL url) throws RpcException;
}
```
不同的协议实现这个接口，而refer()方法目的就是给consumer返回每种协议的invoker,如DubboProtocol返回DubboInvoker.
当你要实现自己的协议时，实现这个接口，在接口内部返回自定义的invoker.


#### dubbo-remoting
dubbo协议的传输实现.传统的c/s架构，服务端侦听，客户端连接
定义 `Client`, `Server`接口分别表示client和server, 定义`Transporter`接口封装传输层语义(bind,listen,connect).
然后就是如何实现NIO，在传统的NIO通信中，就是基于SocketChannel, 将Channel及感兴趣的事件注册到Selector，然后发生相应的事件时进行处理.
dubbo在这一层定义了`Channel`和`ChannelHandler`接口，根据不同的NIO框架分别实现.如netty, mina等.
在这一层中， Client和Server就是和dubbo-rpc层交互的接口，而Channel和ChannelHandler是这层核心功能的实现.
consumer在dubbo-rpc中生成要发送的数据后，通过调用client.send(message)发送.













对方的身份
1. isGeneric()是什么？
2. 每个接口的意义，定义的方法
3. 每个方法的参数
4. 什么是http协议，什么是hession协议,什么是rmi协议    
应用层协议  
定义消息格式,编解码,封装tcp传输       
