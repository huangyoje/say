GC(Garbage Collector)就是一个内存管理工具.
jvm 启动的时候，会向操作系统申请java heap 和native heap内存空间，java heap的管理工作由 GC 负责.              
## G1 GC             
G1 GC（Garbage First Garbage Collector) 是一个<font color="green">低停顿, 面向服务端</font>的运行于HotSpot VM的垃圾回收器。   
G1 GC通过下面的3个方面实现了内存的<font color=orange>自动化管理</font>:
1. 对象分配在young generation，当对象的存活周期超过一定值后，晋升到old generation.
2. 通过并发,并行标记old generation的存活对象.    
<font color="red">Q2: 标记操作的触发调节是什么？</font>        
The Java HotSpot VM triggers the marking phase when the total Java heap occupancy exceeds the default threshold.
3. 通过并行copy，将存活对象移动到一起，来释放空闲内存（标记-整理)

>  个人理解:G1 GC最重要的特点低停顿时间.        
gc中会存在stw时间，而stw的时间长度和每次gc时处理的堆内存大小相关。G1为了降低停顿时间(其实是达到预测停顿时间), 将全部堆内存分为很多region, 每次的gc只是基于部分region(这些region的数量可以配置吗???)进行,这样不论堆内存的总大小是多少，由于可以控制每次gc处理的堆内存(即region的数量)大小，因此进而达到控制总停顿时间的大小。

<font color="red">Q: 每个region的大小对垃圾回收的影响？region的总数量对垃圾回收的影响？</font>

## generation & region
##### G1 GC 将内存划分为不同的generation，用于存放不同的对象。     
- yong generation  
 yong generation 由eden 和 survivor组成.         
 eden(新创建的对象都位于eden),  survivor()       
- old generation     
在yong generation 中存活周期超过一定阈值的对象会进入old generation; 或者大内存对象直接分配在old generation.        
> `XX:MaxTenuringThreshold`       
对象进入old generation的存活周期阈值，默认15

> 存活周期: 经历一次ygc , 存活周期加1

##### region
当jvm 启动的时候，G1 GC 会将所有的堆内存划分大小想等的很多region, 划分依赖于下面两个原则:
- 总的region的数量不超过2048
- 每个region的大小为1MB 至 32MB之间的某个2的指数。
> `-XX:G1HeapRegionSize`
指定region的大小, 默认是基于上面两个原则自动计算的，也可以通过这个jvm参数指定, 不知道是不是必须是2的指数

每个region的大小与总数量对gc的影响
> 引用:When setting the region size, it’s important to understand the number of regions your heap-to-size ratio will create because the fewer the regions, the less flexibility G1 has and the longer it takes to scan, mark and collect each of them.      
所以是说每个region小一些，总数量多一些效果会好???

##### generation 和 region 的关系
空闲的region会组成free list, 似乎是每个线程会有一个free list,即TLAB(thread-local allocation buffer),用于减小多线程直接的竞争.
> 新创建一个对象时, 从free list中获取一个region， 将这个regio标记为eden,进行对象创建; yong collection时，从free list中取出一个region, 作为to survivor, 将存活对象移动过去; mixed collection时，从free list 中获取一个region, 作为old,将存活周期达到阈值的对象移动过去.

so, 一个region在同一时刻要么是eden, survivor, old 或位于free list. 所有的eden并不是连续的, 所有的survivor, old也都不是连续的.

<font color="red">Q:分代的目的是什么？</font>     
针对不同的对象采取不同的gc策略。

## G1 GC 如何工作
1. 创建对象时，从free list上面获取一个region, 将该region标记为eden, 然后在这个region上面创建对象, 后续新的对象都创建在这个region上面, 这个region用完之后，继续从free list上面申请一个新的region. 直到当前eden的总空间大小(即当前eden的region数量)到达eden空间大小(eden的空间大小是基于上次yong garbage collection时的pause time计算的, 目的是保证下一次ygc时pause time不超出预期值).
 > [Eden: 612.0M(612.0M)->0.0B(532.0M) Survivors: 0.0B->80.0M Heap: 612.0M(12.0G)->611.7M(12.0G)]    
  原来： eden空间总大小是612M(153个region)， 使用了612M ,ygc后，总大小调整为532M(133个region)， 当前使用0B.

2. 当eden空间的大小到达上一次ygc后计算得到的eden空间大小后，则开始yong garbage collection.
进行ygc时, 从free list中获取两个region分别作为survivor to 和 old. 然后将位于eden和survivor from 的年轻存活对象移动到survivor to, 将存活周期超过阈值的对象移动到old. 一次ygc结束后，将所有eden和survivor from 的region归还到free list中.
如果old或survivor to的region用完之后，则从free list上申请新的region.
 - 在分配region的过程中，会至少保留free list上面的空闲region为某个数值，这部分region用于survivor to. survivor to如果用完(即保留的survivor to空间不够用)时，会进行 <font color="orange">full gc</font>. 因此这个值是调优的一个关键点.     
  > `G1ReservePercent`     
  设置survivor to的默认大小, 默认10%

3. G1 一直重复上面的ygc, 直到发生下面的任意一件事情:
 1. old空间的大小(ygc期间计算)超过堆空间的45%(默认)，the number of objects in the old regions account for greater than 45% (default) of the total heap.
  > `InitiatingHeapOccupancyPercent (soft-margin)`   
   配置old占堆空间的比例
 2. survivor to空间不够用
 3. 需要分配一个大对象
 发生其中之一后，开始concurrent marking cycle(non-STW).
 concurrent marking基于SATB(Snapshot-At-The-Beginning), 也就是标记期间产生的新对象不处理(即认为是存活的).
 > This is important because the longer it takes for concurrent marking to complete, the higher the ratio will be of what is collectible versus what is considered to be implicitly live. If you allocate more objects during concurrent marking than you end up collecting, you will eventually exhaust your heap.

 4. concurrent marking cycle结束后，立即触发一个ygc,ygc后跟着一个mixed garbage collection.
 > difference between ygc and mixed gc
  First, a mixed collection is also going to collect, evacuate and compact a select set of old regions. Second, mixed collections are not based on the same evacuation triggers a young collection uses

  They operate with the goal of collecting as quickly and as frequently as possible. They do this to minimize the number of allocated Eden / Survivor regions in order to maximize the number of Old regions selected within the soft pause target.

当region上的对象存活率低于85%(JDK8u40+)或65%(JDK7)，该region 会被加入evacuation的候选列表,按照对象存活率排序.(g1)
> G1MixedGCLiveThresholdPercent      
  配置old region进入evacuation候选列表的对象存活率
当候选的old region列表上的region的可回收空间超过5%(JDK8u40+)，时进行mixed garbage collection.
> G1HeapWastePercent    
  配置触发mixed gc时，evacuation候选列表上的所有region的可回收空间

> 看不懂?????
Compared to a young collection, a mixed collection will look to collect all three generations within the same pause time target. It manages this through the incremental collection of the Old regions based on the value of G1MixedGCCountTarget (defaults to 8). Meaning, it will divide the number of candidate Old regions by the G1MixedGCCountTarget and try to collect at least that many regions during each cycle. After each cycle finishes, the liveness of the Old region is re-evaluated. If the reclaimable space is still greater than the G1HeapWastePercent, mixed collections will continue.
> 8822.704: [G1Ergonomics (Mixed GCs) continue mixed GCs, reason: candidate old regions available, candidate old regions: 444 regions, reclaimable: 4482864320 bytes (16.06 %), threshold: 10.00 %]

Mixed collections will continue until all eight are completed or until the reclaimable percentage no longer meets the G1HeapWastePercent. From there, you will see the mixed collection cycle finish and the following events will return to standard young collections.

## 大对象分配(humongous allocations)
1. 大对象是一个独立的对象，因此需要分配在连续的空间里，会导致内存碎片
2. 大对象直接分配在一个位于old代特殊的humongous region
   因为大对象的evacuate 和 copy 代价很昂贵.
   <font color="orange">大内存对象为什么直接分配在old generation</font>
3. 大对象分配会引发concurrent marking cycle
JDK8u40之前，大对象只能通过full gc回收.

## full gc
为什么full gc慢？因为在G1中, full gc依然是单线程.
引起full gc的3个原因:
1. Metaspace(可以避免)
 升级到JDK8u40+，卸载class时不再需要full gc.
2. survivor-to-space exhausted
 survivor-to空间不够时，会引发full gc.通过`G1ReservePercent（hard-margin）`调节to-space.
 > 日志特征
 6229.578: [GC pause (young) (to-space exhausted), 0.0406140 secs]
 6229.691: [Full GC 10G->5813M(12G), 15.7221680 secs]

3. concurrent marking期间，堆内存用完
The two causes are either a memory leak or you’re producing and promoting objects faster than they can be collected. If the Full GC collection is a significant portion of the heap, you can assume it’s related to production and promotion. If very little is being collected and you eventually hit an OutOfMemoryError, you’re more than likely looking at a memory leak.
> 日志
57929.136: [GC concurrent-mark-start]
57955.723: [Full GC 10G->5109M(12G), 15.1175910 secs]
57977.841: [GC concurrent-mark-abort]

## 如何保证停顿时间？
G1 GC 具有自我调节功能。
进行yong collection的时候，会调节yong generation(eden and survivor sizes); 进行mixed collection的时候，会调节old region的数量。   
During mixed collections, the G1 GC adjusts the number of old regions that are collected based on a target number of mixed garbage collections, the percentage of live objects in each region of the heap, and the overall acceptable heap waste percentage.
## 减少内存碎片
The G1 GC reduces heap fragmentation by incremental parallel copying of live objects from one or more sets of regions (called Collection Set (CSet)) into different new region(s) to achieve compaction.
The goal is to reclaim as much heap space as possible, starting with those regions that contain the most reclaimable space, while attempting to not exceed the pause time goal (garbage first).

# 大写总结
gc的目的是降低延迟，提高吞吐量. 但是在有些gc里这两者之间需要进行取舍，以达到最优.
对于G1 GC:
> A general rule with G1 is that the higher the pause time target, the achievable throughput, and overall latency become higher. The lower the pause time target, the achievable throughput and overall latency become lower.

G1 GC 正常的工作状态就是yong garbage collection 和 mixed garbage collection. 我们调优时最重要的是降低ygc和mexed gc时的停顿时间，以及避免full gc.
- 降低停顿时间可以通过设置预期停顿时间实现,G1 会根据每次的gc结果自动调节相关参数，来保证预期的停顿时间. 我们需要注意的就是考虑下自己的相关配置是否和预期停顿时间产生冲突.
- 避免full gc
 - JDK8u40+以下自己设置好Metaspace，避免Metaspace引起的full gc， 或升级到JDK8u40+
 - `G1ReservePercent` 调节survivor-to 空间，确保evacuation期间不会出现survivor-to空间不够用
 - 避免代码中的内存泄露...



## references:        
[https://www.redhat.com/en/about/blog/part-1-introduction-g1-garbage-collector
]         
[http://www.oracle.com/technetwork/articles/java/g1gc-1984535.html]           
[https://blogs.oracle.com/g1gc/entry/g1gc_faq]  
[https://blogs.oracle.com/g1gc/tags/g1gc]     
