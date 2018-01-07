---
title: 'java object size'
date: 2018-01-01
...

## difference between byte and word
[https://stackoverflow.com/questions/7750140/whats-the-difference-between-a-word-and-byte](https://stackoverflow.com/questions/7750140/whats-the-difference-between-a-word-and-byte)
总觉得不太对.

http://openjdk.java.net/projects/code-tools/jol/

## 声明
以下废话基于jdk 1.8.0_131. 64位. Darwin Kernel Version 16.7.0.

## 我有一个问题
需要用多大的Long数组可以填充32KB 内存? 使用原生类型long又需要多大的数组?

## 解
#### 64位机器
64位表示机器的寻址位数, 寻址位数决定了可以寻址的最大空间, 也即限制了机器的最大物理内存. 物理内存是以字节(byte)为单位的. 因此64为机器可以支持的最大物理内存是 \\( x = {-b \pm \sqrt{b^2-4ac} \over 2a} \\)

在java中,创建一个对象时, 会在堆上申请一块连续的空间, 这块空间上的内容依次是对象头(object header), 然后是对象内部的成员变量, 如果成员是原生类型, 则直接存放变量值, 大小由原生类型的大小决定; 如果成员是对象, 则存放对象的引用(指针), 大小8字节. 
