---
title: 'UseCondCardMark'
date: 2018-01-07
...

## CardTable

   分代垃圾回收器中, 除了full gc会回收整个堆内存, 其余的gc通常只会回收部分堆空间。card table则是为了实现部分垃圾回收时使用到的数据结构.

[https://stackoverflow.com/questions/19154607/how-actually-card-table-and-writer-barrier-works](https://stackoverflow.com/questions/19154607/how-actually-card-table-and-writer-barrier-works)
[https://blogs.msdn.microsoft.com/abhinaba/2009/03/02/back-to-basics-generational-garbage-collection/](https://blogs.msdn.microsoft.com/abhinaba/2009/03/02/back-to-basics-generational-garbage-collection/)

## CardTable overhead

通过使用cardtable, 在一次ygc中,可以快速的找到old generation引用的young generation的对象,从而加快ygc标记存活对象的速度.但是为了使用cardtable记录跨代的引用关系, 需要使用write barrier记录引用的修改状态. 这带来的问题有两个:
1. 使用write barrier带来的额外指令消耗
2. card table的修改带来的伪共享                   
在hotspot jvm的card table实现中, 使用1byte表示512bytes(card page size)的空间. 也就是如果这512bytes的内存中进行引用关系的修改时, 会对这个512bytes空间对应的card table中的那个字节进行标记.  而card table是使用字节<font color=green>数组</font>实现的, 也就意味着card table在占用一片连续的内存空间。
现代cpu和主内存之间,通常都有多级缓存，这些缓存的基本单位是cache line。 假设cache line的大小是64bytes(现在大多数的架构都是64bytes)，如果一个cache line缓存了card table, 则该cache line所存储的card table 对应的内存空间是 64 * 512 bytes = 32KB，如果多个核并发地修改这32KB的空间里的引用，每个核都会将这32KB内存对应的card table缓存到自己的cache line中，一个核修改之后，必定导致其它核cache line的数据失效，从而穿透cache, 访问主内存。 而在写并发度非常高的应用中，这会对性能造成很大的伤害。

## demo

通过一段代码说明一下上面的两点。
```java
public class CardTableTest {

    class Worker extends Thread {
        String[] array = new String[10];
        // 使用long数组进行填充, 32KB内存
        // long[] padding = new long[4096];
        int times;

        public Worker(int times) {
            this.times = times;
        }

        public void run() {
            String[] arr = array;
            int i = 0;
            int pos = 5;
            String v = new String("hello");
            while (i < times) {
                if (i % 2 == 0) {
                    arr[pos] = v;
                    pos += 1;
                } else {
                    pos -= 1;
                    v = arr[pos];
                }
                i++;
            }
        }
    }

    public static void main(String[] args) {

        if (args == null || args.length != 3) {
            throw new IllegalArgumentException("java CardTableTest size parallelLevel count");
        }
        int size = Integer.parseInt(args[0]);
        int parallelLevel = Integer.parseInt(args[1]);
        int count = Integer.parseInt(args[2]);

        ArrayList<Long> measurements = new ArrayList<>();
        CardTableTest cardTableTest = new CardTableTest();
        for (int i = 0; i < count; i++) {
            long start = System.currentTimeMillis();
            cardTableTest.run(size, parallelLevel);
            measurements.add(System.currentTimeMillis() - start);
        }
        System.out.println("running times: " + measurements);
    }

    public void run(int size, int parrelLevel) {
        int sz = size / parrelLevel;
        ArrayList<Thread> threads = new ArrayList<>();
        for (int i = 0; i < parrelLevel; i++) {
            threads.add(new Worker(sz));
            threads.get(i).start();
        }
        for (int i = 0; i < parrelLevel; i++) {
            try {
                threads.get(i).join();
            } catch (Exception e) {
            }
        }
    }
}
```
代码来自open jdk的某个邮件(找不到原始链接)。
做的事情是对数组的某个元素进行一定次数的读写操作，按照道理来讲，这段程序的执行时间随着并发度提高会线性减小。

## test

对上面代码编译后通过`java -XX:+UseParallelGC -Xms32m -Xmx32m -server -verbose:gc CardTableTest 2000000000 4 5` 执行, 打印gc是为了观察gc日志, 保证测试结果不受gc影响,如果测试期间出现了gc, 则通过调整堆大小避免。2000000000 是进行读写的总次数，4是并发度， 5是测试次数。

运行环境: linux 2.6.32-358.23.2.el6.x86_64, 24核, java version 1.8.0_91   
```
// 并发度=1
java -XX:+UseParallelGC -Xms32m -Xmx32m -server -verbose:gc  CardTableTest 2000000000 1 5
running times: [3813, 3826, 4541, 4399, 4341]
// 并发度=2
java -XX:+UseParallelGC -Xms32m -Xmx32m -server -verbose:gc  CardTableTest 2000000000 2 5
running times: [3414, 3490, 3430, 3421, 3417]
// 并发度=4
java -XX:+UseParallelGC -Xms32m -Xmx32m -server -verbose:gc  CardTableTest 2000000000 4 5
running times: [3749, 3694, 3640, 3673, 3660]
// 并发度=8
java -XX:+UseParallelGC -Xms32m -Xmx32m -server -verbose:gc  CardTableTest 2000000000 8 5
running times: [3726, 3594, 3637, 3726, 2733]
```
WTF. 😠 &nbsp; 难道24核是假的吗. 并发度的增加对性能的影响微乎其微.

分析一下代码, `threads.add(new Worker(sz))`, 这里根据设置的并发度创建相应数量的线程,并发执行任务。但这些并发线程都是在主线程里创建的，也就是所有的Worker对象都是分配在主线程的TLAB, 并且位于连续的内存空间. 根据前面对card table伪共享的分析，可以看出所有的Worker对象可能位于同一cache line, 并且每个Worker对象由各自的线程进行引用读写操作,所以card table 带来的伪共享可能会造成性能下降。

## -XX:+UseCondCardMark

通过使用`-XX:+UseCondCardMark`开启有条件地card mark, 可以解决上面担心的伪共享问题。
以A.a = b为例, jvm默认使用无条件card mark, 伪代码如下
```
找到a在card table中对应的byte位.
对找到的byte位进行标记.(这一次标记操作肯定会让cache line 失效)
执行A.a = b 操作.
```
有条件的card mark如下
```
找到a在card table中对应的byte位.
判断该byte位是否被标记
  如果没有被标记，则对找到的byte位进行标记.(这一次标记操作肯定会让cache line 失效)
执行A.a = b 操作.
```
通过在标记之前，增加一个条件判断, 虽然增加了额外的指令,但是避免了针对card table中相同byte的标记操作带来的伪共享问题.
测试数据如下
```
// 并发度=4
java -XX:+UseParallelGC -Xms32m -Xmx32m -server -verbose:gc  -XX:+UseCondCardMark CardTableTest 2000000000 4 5
running times: [1053, 1057, 1100, 1150, 1118]
// 并发度=8
java -XX:+UseParallelGC -Xms32m -Xmx32m -server -verbose:gc  -XX:+UseCondCardMark CardTableTest 2000000000 8 5
running times: [566, 563, 642, 621, 651]
```
Good Job!

## 观察伪共享造成的cache失效

使用 [perf](http://www.brendangregg.com/perf.html) 观察cpu和主内存之间cache的访问情况.

#### 1. -XX:-UseCondCardMark

`sudo perf stat -ecycles,instructions,cache-references,cache-misses java -XX:+UseParallelGC -Xms32m -Xmx32m -server -verbose:gc  -XX:-UseCondCardMark CardTableTest 2000000000 8 5`
```
running times: [3668, 3820, 3527, 3623, 2456]

 Performance counter stats for 'java -XX:+UseParallelGC -Xms32m -Xmx32m -server -verbose:gc -XX:-UseCondCardMark CardTableTest 2000000000 8 5':

   380,627,593,591 cycles                    #    0.000 GHz
   216,449,367,675 instructions              #    0.57  insns per cycle
       344,499,146 cache-references
       137,509,095 cache-misses              #   39.916 % of all cache refs

      17.163011340 seconds time elapsed
```
#### 2. -XX:+UseCondCardMark

`sudo perf stat -ecycles,instructions,cache-references,cache-misses java -XX:+UseParallelGC -Xms32m -Xmx32m -server -verbose:gc  -XX:+UseCondCardMark CardTableTest 2000000000 8 5`
```
running times: [590, 574, 564, 541, 549]

 Performance counter stats for 'java -XX:+UseParallelGC -Xms32m -Xmx32m -server -verbose:gc -XX:+UseCondCardMark CardTableTest 2000000000 8 5':

    63,187,057,676 cycles                    #    0.000 GHz
   219,369,504,739 instructions              #    3.47  insns per cycle
        10,018,646 cache-references
         3,616,081 cache-misses              #   36.094 % of all cache refs

       2.884229639 seconds time elapsed
```

instructions表示cpu执行的指令数量. 可以看到打开`UseCondCardMark`后，执行的指令数量增加了.    
cache-references表示cpu访问cache的次数, cache-misses表示访问cache失败的次数. cpu和主内存之间存在着多级缓存，这里统计的是最后一级缓存的访问情况。cache-references的值太高, 说明L1 cache的miss量比较高，cpu穿透了L1 cache. cache-misses数值太高, 表示数据失效或者没有加载到最后一级cache中。而伪共享造成的问题是导致多级缓存里的数据全都失效，因此cache-references和cache-misses的数量都会增加。上面的数据也说明了这一点。

## 结论

1. Always use `-XX:+UseCondCardMark` in parallel garbage collector.
2. g1 garbage collector的实现机制避免了这个问题，使用g1测试结果如下
 ```
java -XX:+UseG1GC -Xms32m -Xmx32m -server -verbose:gc  CardTableTest 2000000000 8 5
running times: [702, 735, 839, 856, 837]
 ```

PS:
测试代码中, 有一行注释的代码 `long[] padding = new long[4096];`，这里通过填充的方式, 使得每个Worker对象位于不同的card page 中，进而使得对应的card table中的byte不会位于同一个cache line. 但是这种填充方式有时候效果明显，有时候没有任何效果，可能是由于jvm的内部的优化(重排或者无用字段丢弃)导致填充失效.

## references

[https://blogs.oracle.com/dave/false-sharing-induced-by-card-table-marking](https://blogs.oracle.com/dave/false-sharing-induced-by-card-table-marking)
