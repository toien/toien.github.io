---
layout: post
title: Java 中 lock 和 monitor 的区别
tags: java lock monitor
excerpt_separator: <!-- more -->
---

Java 提供多种机制供线程间交互。最基本的方式是同步(synchronzation)。
同步可以通过 monitor 来实现，每一个 java 对象包含一个 monitor ，线程可以在上面 lock 和 unlock。

java 1.5 之后，同步还可以通过 juc api 来实现。

<!-- more -->

从官方提供的文档 _[Locks and Synchronization](https://docs.oracle.com/javase/tutorial/essential/concurrency/locksync.html)_ 里：

>- Synchronization is built around an internal entity known as the __intrinsic lock__ or __monitor lock__.
 - Every object has an intrinsic lock associated with it. By convention, a thread has to acquire the object's __monitor lock__ before accessing them, and then release the __monitor lock__ when it's done with them. A thread is said to own the lock between the time it has acquired the lock and released the lock. 
 - As long as a thread owns a monitor lock, no other thread can acquire the same lock. The other thread will block when it attempts to acquire the lock.
   When a thread releases the lock, a happens-before relationship is established between that action and any subsequent acquisition of the same lock.

翻译一下就是：

>- synchronization（同步）是基于 java 的 __内置锁__ ，又叫 __monitor 锁__ 来实现的。
 - 每个对象都内置了一把锁 (monitor lock)。
   通常，一个线程在使用某个对象之前，需要先获得它的内置锁，使用之后再释放内置锁。
   这叫做锁的获取和释放。
 - 当线程获得了锁之后，其他线程无法再获取这一把锁，它们会在获取时阻塞。
   当线程释放锁之后，其余获取操作就和当前的释放操作构成 happens-before 关系。保证逻辑顺序性。

在 java 1.5 版本之前，没有提供 lock 相关 api ，写并发程序只能依靠 `synchronized` 关键字和 `Object` 上的 `wait`, `notify`, `notifyAll` 方法，背后依赖的也就是 monitor lock (intrinsic)。

monitor lock 位于 Java 对象的对象头中。

<p class="text-center">
    <img src="/public/img/posts/java-object-header.png">
</p>

对象头上有若干标志位，记录当前对象锁定状态以及被哪个线程拥有。

随着 1.5 版本发布，java 新增的 [juc](https://docs.oracle.com/javase/1.5.0/docs/guide/concurrency/overview.html) 工具包提供了大量接口，旨在完善 java 多线程编程。从以前的隐式调用 intrinsic lock 扩展到现式使用 lock api。

新的 juc 除了 lock 以外，还提供：原子变量、并发集合、同步器、Executor 框架等。

lock 相关的新特性实现从关键字使用到 api 调用：

1. 增加编程灵活、可控，赋予开发者更多权力
2. 锁的状态查询、以及获取锁的 owner 线程
3. 锁的申请增加 try 机制、中断机制、超时机制

lock 就是 api 锁，而 monitor，更强调一种机制，这里面还有 Object 上的 wait-notify 机制，共同组成 monitor 机制，来达到协调多线程运行的目的。
看一张经典图：

<p class="text-center">
    <img src="/public/img/posts/java-monitor-mechanism.gif">
</p>

### 独占性

一个 monitor ，就好像一幢楼里某一个特殊的房间，这个房间在同一时间内，只能有一个线程进入。
房间里面存放着某些敏感的数据，这些数据需要在并发访问的时候被保护起来，防止出错。
从线程进入房间到离开房间这段时间里，它独占这个房间里的数据。

- 进入这幢楼就等于进入这个 monitor。
- 进入这个房间就等于请求这个 monitor。
- 占有这个房间就等于持有这个 monitor。
- 离开这个房间就等于释放这个 monitor。
- 离开这幢楼就等于退出这个 monitor。

当某个线程开始访问被保护的数据时，它首先会被放在楼里的一个到达队列(entry-set)里。
如果没有其它线程等待、持有这个锁，那这个线程可以直接请求锁、持有锁、访问保护数据。
完成之后，线程释放锁并且离开大楼。

如果某个线程到达时，monitor 已经被其它线程持有，它必须在达到队列里等上一阵。
当前线程从房间里离开后，达到队列里的线程必须互相竞争，只有一个胜出的线程才能进入房间。

目前为止，monitor 帮助我们实现独占性，确保线程之间不产生错误的影响。
wait-set 还没有发挥作用。

### 合作性

合作性是指保证线程只在某些特定的条件下才占有房间(持有锁)、访问数据。

例如：生产者-消费者问题。

读线程首先进入 entry-set，发现没有其它线程占有 monitor 时进入房间；但此时恰好 buffer 中没有数据，读线程需要停下来等待。

它释放 monitor，并进入 wait-set 等待。当它下一次请求 monitor 时，读线程需要和来自 entry-set 和 wait-set 的线程竞争，胜出进入房间之后，依旧需要判断。

写线程需要判断 buffer 的大小，如果已经达到 MAX 状态也要停下来，进入 wait-set。

保障合作性同时需要 entry-set 和 wait-set。

#### 资料
- [Java 1.5 concurrency guide](https://docs.oracle.com/javase/1.5.0/docs/guide/concurrency/overview.html)
- [Difference between lock and monitor – Java Concurrency](https://howtodoinjava.com/java/multi-threading/multithreading-difference-between-lock-and-monitor/)
- [Java version history](https://en.wikipedia.org/wiki/Java_version_history)

`<<<EOF`
