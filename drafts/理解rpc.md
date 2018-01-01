---
title: 'rpc & dubbo'    
date: 2017-02-27    
...

1. 传输协议，序列化协议之间的关系

## rpc背景
1. 为什么需要rpc   
2. 微服务与rpc
3. 哈哈   

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
          // 接受到某个客户端连接，开始处理
          // 首先解析客户端请求的是什么服务,以及参数 (协议)
          // 调用相关服务 (如何调用服务)
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
  // 调用其他服务
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

## rpc调用中存在的问题
服务: 就是我们代码中的某个方法    
从上面简单的调用示例中，可以发现一次rpc调用就是consumer端发起一次socket通信. consumer的调用其实就是向provider建立连接，发送数据，provider端其实就是侦听端口，并且处理consumer发起的连接。

现实中，我们当然不希望每次都写这么多socket连接的代码来进行rpc调用，我们希望有一种更加方便简洁的方式。


在使用dubbo时，我们通过 `interface.method(parameters)`这种方式直接调用，看起来像是调用自己本地的一个方法，对调用者达到了rpc透明调用的效果。

所以rpc框架需要考虑的一个问题就是让客户端以何种方式调用远端服务.这个问题是直接面向服务消费者的.
rpci框架提供一个比较简洁的方式给



这个问题关联的一个问题就是远端服务在本地的存在方式,比如dubbo就是通过动态代理生成的一个类.
还有是服务在服务端的的存在形式，

解决了服务的表现形式及调用方式后，还需要解决的一个问题是，当发起调用时，consumer需要和provider建立socket连接，所以需要provider的ip地址和端口号.也就是consumer需要记录提供该服务的provider的地址，这个问题当然可以在启动应用之前，获取所有服务端的地址信息保存起来，但是问题在于对于某个服务，服务端地址可能发生变化，这时我们不希望重启consumer，因此rpc框架需要解决第二个问题，即提供一个服务地址自动发现机制.

通常对于某个服务，为了防止单点问题，通常会有多个服务端提供相同的服务，因此在客户端每个服务保存中多个服务端地址信息，在进行socket连接之前，需要从多个地址里找出一个来，这就需要rpc框架解决的第三个问题, 提供负责均衡机制.

解决了如何调用，确定服务端地址后，剩下的就是和服务端通信，这里就涉及到通信协议，而通信协议在5层通信模型中，每一层都有自己的协议，我们关心的通常是传输层和应用层协议，传输层使用tcp还是udp，应用层使用啥？
> 传输层协议的目的

> 应用层协议的目的  发送什么数据

确定了应用层协议后，还有最后一个问题就是socket传输是面向字节流的，因此我们还需要一个序列化协议.


总结下rpc调用时需要解决的问题:
- 服务的存在形式，调用方式      
- 路由, 找到提供对应服务的provider地址      
- 负载均衡, 从多个provider中按照策略找出一个         
- 通信, 按照约定的通信协议和provider通信     

rpc框架实现时，应该对用户使用起来保持简介，而又不失灵活性     


rpc首先要确定如何调用，存在形式.
dubbo，目标， 透明调用    
## rpc & dubbo
##### 1. 服务的存在形式及调用方式      
consumer如何简单(代码量少)灵活(使用不同负载均衡策略，不同通信协议，同步异步等)调用服务.      
在dubbo中，会对每个远端服务接口在本地生成一个代理对象。我们在代码中通过调用在这个代理对象上的方法来完成远端服务调用,对调用者来说看起来像是调用本地服务，非常透明，这就是dubbo的简洁性. 这个代理对象实现了上面我们所说的rpc需要解决的问题，而我们通过xml配置参数控制这个代理对象的内部针对每个问题的具体实现方式，这是dubbo的灵活性.
dubbo针对上面的问题，提供了相应的接口，我们也可以自定义接口的实现，微内核框架.


##### dubbo 如何实现这个代理对象   
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

- dubbo-remoting:
这一层就是socket通信的过程，也就是传统的c/s架构，服务端侦听，客户端连接
定义 `Client`, `Server`接口分别表示client和server, 定义`Transporter`接口封装传输层语义(bind,listen,connect).
然后就是如何实现NIO，在传统的NIO通信中，就是基于SocketChannel, 将Channel及感兴趣的事件注册到Selector，然后发生相应的事件时进行处理.
dubbo在这一层定义了`Channel`和`ChannelHandler`接口，根据不同的NIO框架分别实现.如netty, mina等.
在这一层中， Client和Server就是和dubbo-rpc层交互的接口，而Channel和ChannelHandler是这层核心功能的实现.
consumer在dubbo-rpc中生成要发送的数据后，通过调用client.send(message)发送.

- dubbo-rpc:
这一层定义通信协议.通信协议规定了通信使用的数据结构.正如http协议中的Request.


由于每种不同的协议有不同的数据结构,为了屏蔽每种协议格式的差异，我们通过接口定义rpc调用中必须需要的属性(调用的服务(即方法名),调用的参数),即`Invocation`接口.使用这个接口进行层与层之间交互.

当我们在代码中在代理对象上通过 `interface.method(arguments)`调用时，就进入了dubbo-rpc层.  

定义接口`Invoker Result invoke(Invocation invocation) throws RpcException;`, 不同的协议实现这个接口时，在内部将invocation转化成自己的数据结构，然后通过remoting提供的方法获取一个Clien, 调用client.send(Invocation). 如DubboInvoker, RedisInvoker(是个啥).

由于每种协议的数据结构不同，所以client.send接口是Object.  

##### 交互
`Protocol`, `Exporter`, `Invoker`.



















对方的身份
1. isGeneric()是什么？
2. 每个接口的意义，定义的方法
