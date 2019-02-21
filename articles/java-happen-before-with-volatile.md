---
title: 'volatile-with-happen-before'
author: yoje
date: 2019-02-21
---

# 什么是happen before order?
If one action happens-before another, then the first is visible to and ordered before the second.
如果操作A happen before 操作B, 则操作A对操作B是可见的. 记作 hb(操作A, 操作B).
这里的可见是说操作A对内存的修改, 对操作B是可见的, 即操作B可以读到最新的值.

# happen before 一致性
HB consistency: every read can see either the latest write in the happens-before order.
读操作和写操作满足happen before 顺序时, 读操作可以读到最新的值.

举栗1: 初始 A = 0;
```text
time:     ________t1___________t2______________
                 |     |      |          |
thread 1:        |A=1; |      |          |
                 |     |      |          |
thread 2:        |     |      |readA = A |
```

如果hb(写A, 读A)不成立, 则在t2时刻, thread 2 读数据时可能读到旧值, 即readA可能是0,可能是1.
如果hb(写A, 读A)成立, 则在t2时刻, thread 2 读数据时肯定读最新值, 即readA永远是1.

# volatile
java 内存模型赋予了volatile关键字两大功能:
 1. hb(写volatile, 读volatile): A write to a volatile field happens-before every subsequent read of that same field.
    回到栗子1, 如果我们用volatile修饰A, 则readA永远是1.

 2. 禁止重排序: 使用volatile修饰的变量, 禁止与其临近的代码重排序.
    举栗2: 如下代码
    A = 1;
    B = 2;
    C = 3;
    经编译器优化后, 上面三行代码可能会有6种执行顺序. 其中之一可能是C = 3;B = 2; A = 1; 但是, 如果使用volatile修饰C. 则C=3禁止与上面
    两行代码重排序, 所以只可能有2种执行顺序:
    1. A = 1; B = 2; C = 3;
    2. B = 2; A = 1; C = 3;

# 进阶
  1. java 内存模型规定happen before满足传递性:
     if hb(操作A, 操作B) and (操作B, 操作C) then hb(操作A,操作C);
  2. java 内存模型定义了一组happen before 关系.其中之一是:
     单个线程中代码的执行顺序满足happen before关系, 即如果线程按顺序执行 A=1;B=2, 则hb(A=1, B=2);


举栗3: 初始 A = 0, B = 0, volatile C = 0;
```text
time:     ________t1________________t2___________________________
                 |                 |
thread 1:        |A=1; B=2; C=3;   |
thread 2:        |                 |readC=C; readB=B; readA=A;
```

t1时刻, thread 1执行代码A=1; B=2; C=3;  t2时刻, thread 2执行代码readC=C; readB=B; readA=A;

根据volatile的功能1:
   由于hb(C=3, readC=C), 因此肯定可以读到C的最新值, 即readC=3;

根据进阶中的1和2:
   由于hb([A=1;B=2], C=3), 且hb(C=3, readC=C), 所以 hb([A=1;B=2], readC=C);
   又由于hb(readC=C, [readB=B; readA=A]), 所以 hb([A=1;B=2], [readB=B; readA=A]), 所以thread 2也读到了A,B的最新值.
