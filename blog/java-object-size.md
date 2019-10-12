---
title: 'java object size'
date: 2018-01-01
...

## difference between byte and word

[https://stackoverflow.com/questions/7750140/whats-the-difference-between-a-word-and-byte](https://stackoverflow.com/questions/7750140/whats-the-difference-between-a-word-and-byte)

## 环境

基于HotSpot jdk 1.8.0_131. 64位. Darwin Kernel Version 16.7.0.
使用 [JOL](http://openjdk.java.net/projects/code-tools/jol/) 查看对象在内存中的大小及布局.

## 问题

需要用多大的Long数组可以填充32KB 内存? 使用原生类型long又需要多大的数组?

#### 64位机器

byte是寻址的基本单位.

64位表示机器的寻址位数, 寻址位数决定了可以寻址的最大空间, 也即限制了机器的最大物理内存. 物理内存是以字节(byte)为单位的. 因此64为机器可以支持的最大物理内存是 $2^{64}$ bytes.

在64位jvm中, 对象在内存中的地址需要使用64bit(8bytes)表示，因此对象的引用(指针)需要8bytes.
开启指针压缩(UseCompressedOops)后，可以使用32bit(4bytes)表示对象的地址, 由于64位jvm中对象的内存地址对齐单位为8bytes，也就是说地址的低3位永远是000. 因此32bit其实可以表示35bit的寻址空间(低3位000不需要存储), 因此可以支持的最大堆空间为$2^{35}$ bytes= 32GB.

## jvm中对象的内存布局

在java中,创建一个对象时, 会在堆上申请一块连续的空间, 这块空间上的内容依次是对象头(object header), 然后是对象内部的成员变量, 如果成员是原生类型, 则直接存放变量值, 大小由原生类型的大小决定; 如果成员是对象, 则存放对象的引用(指针), 大小8字节.

#### object header

object header由两部分组成.
- mark word
  大小为机器字长(64 位jvm上8字节). mark word用于标记对象的gc age, 偏向锁状态, 存储hash值等. [markOop.hpp](http://hg.openjdk.java.net/jdk8/jdk8/hotspot/file/87ee5ee27509/src/share/vm/oops/markOop.hpp).
- klass pointer
  对象的class信息的地址指针(在虚拟空间的地址). 64位jvm中,通常需要8bytes, 但是如果可以开启 `-XX:-UseCompressedClassPointers`，则4byte就足够.

#### object memory layout
