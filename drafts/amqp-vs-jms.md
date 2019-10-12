# 什么是jms


# AMQP(Advanced Message Queuing Protocol)
The Advanced Message Queuing Protocol (AMQP) is an open standard application layer protocol for message-oriented middleware.

The defining features of AMQP are message orientation, queuing, routing (including point-to-point and publish-and-subscribe), reliability and security.[1]


Previous standardizations of middleware have happened at the API level (e.g. JMS) and were focused on standardizing programmer interaction with different middleware implementations, rather than on providing interoperability between multiple implementations.

JMS 是API规范, 关注于和其他中间件的交互方式.

AMQP 和HTTP, FTP等协议类似, 提供了不同实现的互操作性.

Unlike JMS, which defines an API and a set of behaviors that a messaging implementation must provide, AMQP is a wire-level protocol. A wire-level protocol is a description of the format of the data that is sent across the network as a stream of bytes. Consequently, any tool that can create and interpret messages that conform to this data format can interoperate with any other compliant tool irrespective of implementation language


二进制应用层协议

It provides
flow controlled,
message-oriented communication with message-delivery guarantees such as
  at-most-once (where each message is delivered once or never),
  at-least-once (where each message is certain to be delivered, but may do so multiple times),
  exactly-once (where the message will always certainly arrive and do so only once)
authentication and/or encryption based on SASL and/or TLS.

It assumes an underlying reliable transport layer protocol such as Transmission Control Protocol (TCP).[6]

## Compare
AMQP 能保证server和client是解耦的, 可以是不同的语言, 不同的实现
JMS 则无法保证(JMS未定义数据格式, 传输方式).

https://spring.io/understanding/AMQP
https://spring.io/blog/2010/06/14/understanding-amqp-the-protocol-used-by-rabbitmq/
