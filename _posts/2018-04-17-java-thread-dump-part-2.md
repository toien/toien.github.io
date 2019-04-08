---
layout: post
title: Java 线程转储(thread dump) - Part 2
tags: java thread jdk-tool
excerpt_separator: <!-- more -->
---

[原文链接](https://sites.google.com/site/threaddumps/java-thread-dumps-2)

第二部分我们通过以下几个方面剖析、解读线程转储

1. 理解线程状态
1. 分析转储的最佳实践
1. 分析静态条件
1. 参考资料

<!-- more -->

# Part II 理解线程状态

在开始剖析线程转储(dump)之前，我们必须好好地理解线程的基本状态。

[java.lang.thread.Thread.State](https://docs.oracle.com/javase/8/docs/api/java/lang/Thread.State.html) 文档清楚地阐述了，一个线程会经历以下几种状态：

- 新建: 当一个线程在被创建之后，还没有调用 `start()` 的时候，它就处于新建状态。
- 运行: 当线程处于可运行状态时，如果调用了 `start` 方法，并且 JVM 为执行而将它积极地调度之后，便处于运行状态.
- 阻塞 / 等待 monitor: 当线程无法获取必要的 monitor 来进入同步块时，就会进入这种状态。
  一个线程会等待其它线程释放这个 monitor。在这种状态下的线程不会做任何事情。
- 等待: 当线程调用 `Object.wait()` 放弃对 monitor 对象的控制时，就进入等待状态。直到其他线程调用 `Object.notify()` 或者 `Object.notifyAll()` 来再次激活它。在这种状态下，线程也不会做任何事情。
- 计时等待: 当线程通过调用 `Object.wait(long)` 放弃对 monitor 对象的控制。它将一直等待直到其它线程调用 `Object.notify()` / `Object.notifyAll()`或者时间到。在这种状态下，线程也不会做任何事情。
- 休眠／等待条件: 当线程调用 `Thread.sleep(long)`的时候，进入休眠状态。这种状态也不会做任何事。
- 终止
- 其它

附上一张线程状态转换图：

<p class="text-center">
  <img src="/public/img/posts/java-thread-states.png">
</p>

诚如所见，线程只在 `RUNNABLE` 状态才会干活。

在其他状态中，线程只是浪费 CPU 指令周期。
为了使程序吞吐量最大化，应该确保程序中的大部分线程在 `RUNNABLE` 状态，只有少数线程处于 `WAITING FOR MONITOR ENTRY`, `SLEEPING`, `WAITING`, `TIMED WAITING` 状态。

所以，我们需要理解线程为什么会处于 `WAITING FOR MONTIROR ENTRY`, `SLEEPING`, `WAITING`, `TIMED WAITING` 状态。

假设如下是 [resin](https://caucho.com/) 应用里某个正在等待来自 client 的连接的线程状态。
当我们剖析线程转储的数据时，最本质的事情就是判断每个线程是否在浪费 CPU 时钟。

    "tcpConnection-9011-7736" daemon prio=1 tid=0x351750b8 nid=0x7eab in Object.wait() [0x2fdf4000..0x2fdf50b0]
        at java.lang.Object.wait(Native Method)
        - waiting on <0x43eef7c8> (a java.lang.Object)
        at com.caucho.server.TcpServer.accept(TcpServer.java:648)
        - locked <0x43eef7c8> (a java.lang.Object)
        at com.caucho.server.TcpConnection.accept(TcpConnection.java:211)
        at com.caucho.server.TcpConnection.run(TcpConnection.java:132)
        at java.lang.Thread.run(Thread.java:595)

这就是理解线程 dump 的核心概念。
在接下来的章节，我们会拓展到如何剖析大量线程的 dump 数据，得出结论，并且消除不正常的线程。

## 分析线程转储

如果我们已经很好地理解线程的状态后，剖析线程会更容易。
对生产环境下的应用做线程转储可能会产生大量数据。
一个典型的 web 应用无论如何至少有 25-50 个工作线程，算上缓存，系统线程，这个数字还会更大。
在本节中，我们将讨论如何快速分离初需要引起关注的线程。

让我们开始吧。

1. **理解应用:**
   虽然有线程基本概念的人都可以理解线程转储，如果你理解整个应用，更会帮上大忙。
   比如应用使用的技术组件是怎样的，它们以怎样的方式实现等等。
   你将马上看到这些信息将在下面的步骤中派上用场。
   如果你是顾问，或是和开发团队没有太紧密的联系，你大可向他们咨询相关问题。

2. **排除 `RUNNABLE` 的线程:**
   `RUNNABLE` 线程已经被活跃调度，没有必要在一开始关注它们。
   我们将目光放在 `BLOCKED`，`WAITING` 的线程上。

3. **排除空闲的线程:**
   应用中有空闲的线程是一件正常不过的事情。
   他们要么是等待外部的请求连接，要么是休眠一段时间。
   应用程序的使用环境会影响对线程的判断。一般情况下，在分析过程中排除这些空闲线程是理想的。
   接下来让我们看看三个因为正常原因而空闲的线程：

   <pre class="highlight">
    <code><span style="color:blue;">"tcpConnection-9011-7736"</span> daemon prio=1 tid=0x351750b8 nid=0x7eab in <span style="color:blue;">Object.wait()</span> [0x2fdf4000..0x2fdf50b0]
        at java.lang.Object.wait(Native Method)
        * waiting on <0x43eef7c8> (a java.lang.Object)
        at com.caucho.server.TcpServer.accept(TcpServer.java:648)
        * locked <0x43eef7c8> (a java.lang.Object)
        at com.caucho.server.TcpConnection.accept(TcpConnection.java:211)
        at com.caucho.server.TcpConnection.run(TcpConnection.java:132)
        at java.lang.Thread.run(Thread.java:595)

    <span style="color:blue;">"Store org.hibernate.cache.StandardQueryCache Expiry Thread"</span> daemon prio=1 tid=0x3becd4e0 nid=0x1c6e <span style="color:blue;">waiting on condition</span> [0x35389000..0x353891b0]
        at java.lang.Thread.sleep(Native Method)
        at net.sf.ehcache.store.DiskStore.expiryThreadMain(DiskStore.java:725)
        at net.sf.ehcache.store.DiskStore.access$700(DiskStore.java:98)
        at net.sf.ehcache.store.DiskStore$ExpiryThread.run(DiskStore.java:882)

    <span style="color:blue;">"Store org.hibernate.cache.UpdateTimestampsCache Expiry Thread"</span> daemon prio=1 tid=0x397868a8 nid=0x1c6c <span style="color:blue;">waiting on condition</span> [0x3548a000..0x3548b0b0]
        at java.lang.Thread.sleep(Native Method)
        at net.sf.ehcache.store.DiskStore.expiryThreadMain(DiskStore.java:725)
        at net.sf.ehcache.store.DiskStore.access$700(DiskStore.java:98)
        at net.sf.ehcache.store.DiskStore$ExpiryThread.run(DiskStore.java:882)
    </code></pre>

4. **分析 `BLOCKED`, `WAITING` 线程:** 这是分析中最关键的一部分。
   如果线程本应是 `RUNNABLE` 状态，探究它们为什么会处于 `BLOCKED` `WAITING` 状态至关重要。
   这些线程有可能是在等待已经被其它线程持有 monitor (锁)。
   其它线程要么是 `RUNNABLE`，或者更糟，它们也因为在等待 monitor 而处于 `BLOCKED` 状态。
   
   通过线程 dump 可以容易观察哪些线程持有所需的 monitor，更好地理解情况。
   在上面的 dump 中可以看到 __tcpConnection-9011-7709__ 由于等待 monitor 而处于 `BLOCKED` 状态。
   如果浏览下 dump 文件，可以注意到， __tcpConnection-9011-7640__ 已经获得这个 monitor。
   后面的 __tcpConnection-9011-7640__ 正处于 `RUNNABLE` 状态。

   <pre class="highlight">
    <code><span style="color:blue;">"tcpConnection-9011-7709"</span> daemon prio=1 tid=0x35029e40 nid=0x7e61 <span style="color:blue;">waiting for monitor entry</span> [0x2fe74000..0x2fe75e30]
        at java.beans.Introspector.getPublicDeclaredMethods(Introspector.java:1249)
        - waiting to lock <span style="color:blue;"><0x3d9bb6b0></span> (a java.lang.Class)
        at java.beans.Introspector.getTargetEventInfo(Introspector.java:934)
        at java.beans.Introspector.getBeanInfo(Introspector.java:388)
        at java.beans.Introspector.getBeanInfo(Introspector.java:222)
        ..............
        ..............
        ..............
        ..............
        ..............
        at com.caucho.server.TcpConnection.run(TcpConnection.java:139)
        at java.lang.Thread.run(Thread.java:595)


    <span style="color:blue;">"tcpConnection-9011-7640"</span> daemon prio=1 tid=0x35177a40 nid=0x7dc7 <span style="color:blue;">runnable</span> [0x305fa000..0x305fcf30]
        at java.lang.Throwable.fillInStackTrace(Native Method)
        at java.lang.Throwable.&lt;init>(Throwable.java:218)
        at java.lang.Exception.&lt;init>(Exception.java:59)
        ..............
        ..............
        at java.beans.Introspector.instantiate(Introspector.java:1453)
        <span style="color:blue;">at java.beans.Introspector.findExplicitBeanInfo(Introspector.java:410)
        - locked <0x3d9bb6b0> (a java.lang.Class)</span>
        ..............
        ..............
        ..............
        at com.caucho.server.http.CacheInvocation.service(CacheInvocation.java:135)
        at com.caucho.server.http.RunnerRequest.handleRequest(RunnerRequest.java:346)
        at com.caucho.server.http.RunnerRequest.handleConnection(RunnerRequest.java:274)
        at com.caucho.server.TcpConnection.run(TcpConnection.java:139)
        at java.lang.Thread.run(Thread.java:595)
    </code></pre>

5. **在某段时间内分析线程 dump:** 理解线程 dump 仅仅是当前执行环境的快照很重要。
   线程始终被 JVM 频繁而活跃地调度着。仅仅是一次快照还不足以得出线程互相阻塞这样的结论。
   观察一段时间内的线程数据才有意义。
   我通常建议人们每 5 秒取抓取一次快照，并且这样持续几分钟。
   你可能需要基于你的应用场景，增加持续时间。
   
   接下来的片段中，我们将看到相同的线程在 2 次连续的快照中的样子。
   第一个快照中，**tcpConnection-9011-7696** 正在等待外部请求。
   在第二个快照中，线程处于 `RUNABLE` 状态。
   和之前的例子一样，仅仅因为一次快照得出 **tcpConnection-9011-7709** 因为 **tcpConnection-9011-7640** 而处于 `BLOCKED` 的结论可能不太合适。
   如果你观察连续、多次的线程 dump 中相同的部分，这样的结论才够科学。

    <pre class="highlight">
    <code><span style="color:blue;">"tcpConnection-9011-7696"</span> daemon prio=1 tid=0x3466c258 nid=0x7e4f in <span style="color:blue;">Object.wait()</span> [0x2727b000..0x2727bfb0]
        at java.lang.Object.wait(Native Method)
        - waiting on <0x43eef7c8> (a java.lang.Object)
        at com.caucho.server.TcpServer.accept(TcpServer.java:648)
        - locked <0x43eef7c8> (a java.lang.Object)
        at com.caucho.server.TcpConnection.accept(TcpConnection.java:211)
        at com.caucho.server.TcpConnection.run(TcpConnection.java:132)
        at java.lang.Thread.run(Thread.java:595)

    In the next snapshot taken 5 seconds after the first snapshot

    <span style="color:blue;">"tcpConnection-9011-7696"</span> daemon prio=1 tid=0x3466c258 nid=0x7e4f <span style="color:blue;">runnable</span> [0x2727b000..0x2727bfb0]
        at java.net.SocketInputStream.socketRead0(Native Method)
        at java.net.SocketInputStream.read(SocketInputStream.java:129)
        at com.caucho.vfs.SocketStream.read(SocketStream.java:159)
        at com.caucho.vfs.ReadStream.readBuffer(ReadStream.java:790)
        at com.caucho.vfs.ReadStream.read(ReadStream.java:343)
        at com.caucho.vfs.ReadStream.readAll(ReadStream.java:373)
        at com.caucho.server.http.RunnerRequest.scanHeaders(RunnerRequest.java:493)
        at com.caucho.server.http.RunnerRequest.handleRequest(RunnerRequest.java:317)
        at com.caucho.server.http.RunnerRequest.handleConnection(RunnerRequest.java:274)
        at com.caucho.server.TcpConnection.run(TcpConnection.java:139)
        at java.lang.Thread.run(Thread.java:595)
    </code></pre>

## 分析一些竞态条件

让我们用已有的知识来分析竞态条件

1. 经典死锁
2. 线程耗尽
3. 资源占用

### 经典死锁

当线程由于请求一些被其它 `BLOCKED` 线程占有的资源时，就会发生死锁。
两个以上的线程，如果出现多个互相依赖的资源就可能出现死锁。
让我们看一个简单的死锁 dump 。

<pre class="highlight"><code>Full thread dump Java HotSpot(TM) Client VM (1.5.0_04-b05 mixed mode, sharing):

<span style="color: blue;">"bar"</span> prio=5 tid=0x00aa3010 nid=0xd0c <span style="color: blue;">waiting for monitor entry</span> [0x02d0f000..0x02d0fb68]
        at org.tw.testyard.thread.DeadLock.run(DeadLock.java:19)
        - waiting to lock <0x22aa9928> (a java.lang.Object)
        - locked <0x22aa9940> (a java.lang.Object)
        at java.lang.Thread.run(Unknown Source)

<span style="color: blue;">"foo"</span> prio=5 tid=0x00aa2e00 nid=0x834 <span style="color: blue;">waiting for monitor entry</span> [0x02ccf000..0x02ccfbe8]
        at org.tw.testyard.thread.DeadLock.run(DeadLock.java:19)
        - waiting to lock <0x22aa9940> (a java.lang.Object)
        - locked <0x22aa9928> (a java.lang.Object)
        at java.lang.Thread.run(Unknown Source)

"main" prio=5 tid=0x000361b0 nid=0x1188 in Object.wait() [0x0007f000..0x0007fc3c]
        at java.lang.Object.wait(Native Method)
        - waiting on <0x22aa9a68> (a java.lang.Thread)
        at java.lang.Thread.join(Unknown Source)
        - locked <0x22aa9a68> (a java.lang.Thread)
        at java.lang.Thread.join(Unknown Source)
        at org.tw.testyard.thread.DeadLock.main(DeadLock.java:61)
</code></pre>

在这个例子里，有两个线程分别叫 "foo", "bar"，它们都在等待 monitor。
这两个线程分别等待 __0x22aa9940__ 和 __0x22aa9928__ 。
然而，它们等待的这两个 monitor 又分别被对方持有。也就是：__0x22aa9940__ 被 "bar" 持有，__0x22aa9928__ 被 "foo" 持有。因此这是一个死锁案例。

在线程 dump 分析中，JVM 已经能很容易地识别出死锁问题。实际的线程 dump 数据同时包含了如下信息：

<pre class="highlight"><code><span style="color: blue;">Found one Java-level </span>deadlock:
=============================
"bar":
  waiting to lock monitor 0x00a680cc (object 0x22aa9928, a java.lang.Object),
  which is held by "foo"
"foo":
  waiting to lock monitor 0x00a680ac (object 0x22aa9940, a java.lang.Object),
  which is held by "bar"

Java stack information for the threads listed above:
===================================================
"bar":
        at org.tw.testyard.thread.DeadLock.run(DeadLock.java:19)
        - waiting to lock <0x22aa9928> (a java.lang.Object)
        - locked <0x22aa9940> (a java.lang.Object)
        at java.lang.Thread.run(Unknown Source)
"foo":
        at org.tw.testyard.thread.DeadLock.run(DeadLock.java:19)
        - waiting to lock <0x22aa9940> (a java.lang.Object)
        - locked <0x22aa9928> (a java.lang.Object)
        at java.lang.Thread.run(Unknown Source)

Found 1 deadlock.</code></pre>

如你所见，JVM 已经分析出线程 dump 中存在死锁情况。

### 线程耗尽

考虑如下场景：

- 关键页面的响应时间快速上升(页面花了更多时间来渲染)
- 应用吞吐量保存不变
- 应用服务器和数据库服务器都在系统参数允许的条件下运行
- 希望你能分析一下情况

分析这种情况，可以从线程 dump 着手。这样既不会对应用造成很大的影响，也可以知道 JVM 内部到底发生些什么。
如果你选择在应用上附加一个复杂的剖析工具，应用可能不会表现得让人满意。
考虑如下 dump 结果：

<pre class="highlight"><code>"tcpConnection-9011-8004" daemon prio=1 tid=0x2fed7830 nid=0x49ef <span style="color: blue;">runnable</span> [0x11546000..0x11548130]
    at java.net.SocketInputStream.socketRead0(Native Method)
    at java.net.SocketInputStream.read(SocketInputStream.java:129)
    at com.sun.mail.util.TraceInputStream.read(TraceInputStream.java:79)
    ..........
    ..........
    at com.caucho.server.http.RunnerRequest.handleRequest(RunnerRequest.java:346)
    at com.caucho.server.http.RunnerRequest.handleConnection(RunnerRequest.java:274)
    at com.caucho.server.TcpConnection.run(TcpConnection.java:139)
    at java.lang.Thread.run(Thread.java:595)

"tcpConnection-9011-7994" daemon prio=1 tid=0x300cb8b8 nid=0x49e4 <span style="color: blue;">runnable</span> [0x1594e000..0x1594ffb0]
    at java.net.SocketInputStream.socketRead0(Native Method)
    at java.net.SocketInputStream.read(SocketInputStream.java:129)
    ..........
    ..........
    at java.io.BufferedInputStream.fill(BufferedInputStream.java:218)
    at java.io.BufferedInputStream.read(BufferedInputStream.java:235)
    at java.lang.Thread.run(Thread.java:595)

"tcpConnection-9011-7992" daemon prio=1 tid=0x2fefd450 nid=0x49e2 <span style="color: blue;">runnable</span> [0x17c94000..0x17c960b0]
    at java.lang.Class.isArray(Native Method)
    at org.apache.commons.lang.builder.ToStringStyle.appendInternal(ToStringStyle.java:419)
    at org.apache.commons.lang.builder.ToStringStyle.append(ToStringStyle.java:319)
    ..........
    ..........
    at com.caucho.server.http.FilterChainFilter.doFilter(FilterChainFilter.java:88)
    at com.caucho.server.http.RunnerRequest.handleConnection(RunnerRequest.java:274)
    at com.caucho.server.TcpConnection.run(TcpConnection.java:139)
    at java.lang.Thread.run(Thread.java:595)

"tcpConnection-9011-7967" daemon prio=1 tid=0x309a3620 nid=0x49c5 <span style="color: blue;">runnable</span> [0x1e07c000..0x1e07de30]
    at java.net.SocketInputStream.socketRead0(Native Method)
    at java.net.SocketInputStream.read(SocketInputStream.java:129)
    at java.io.BufferedInputStream.fill(BufferedInputStream.java:218)
    ..........
    ..........
    at com.caucho.server.http.RunnerRequest.handleConnection(RunnerRequest.java:274)
    at com.caucho.server.TcpConnection.run(TcpConnection.java:139)
    at java.lang.Thread.run(Thread.java:595)
</code></pre>

上述 dump 包含4个应用线程。假设这 4 个线程代表所有应用可用来处理请求的线程。
仔细看看，它们都是 `RUNNABLE` 状态。

非常明显，没有空间来支持额外的处理。
应用已经在处理请求的能力上达到最大值，新线程会在应用选择它们之前等待较长时间。
你可能会看到用户突然涌入应用程序。

基于目前的分析，唯一直接的方式就是增加线程池中线程的数量来迎合目前的需求。
然而，不考虑机器性能就盲目扩大线程是一件危险的事情。
你需要考虑带来的影响。
（你可以很好地（并且理所当然地）认为应用程序还没有被调优来处理这种负载。这是一个不同讨论的主题）

### 资源竞争

资源竞争发生的典型条件是多个线程都在争夺相同的资源。
如果应用中，大量线程都在为同一个资源相互竞争，这应该不是一种合理的设计。甚至是糟糕的。

试想一下：大量外部请求都在尝试从缓存中提取数据，渲染页面。
而缓存可能需要从磁盘上获取数据，于是，可能造成资源竞争。

资源竞争最常见的症状是：

- 应用的吞吐量／响应速度大幅下滑，应用整体速度偏慢
- CPU 利用率低
- 应用中的资源（比如数据库连接池）看起来还很空闲并且可用
- 在线程 dump 中，大多数线程因为 `MONITOR ENTRY` 呈现 `BLOCKED` / `WAITING` 状态

<pre class="highlight"><code><span style="color: blue;">"tcpConnection-9011-8009"</span> daemon prio=1 tid=0x31446a80 nid=0x49f5 <span style="color: blue;">waiting for monitor entry</span> [0x2edf5000..0x2edf6e30]
    at com.opensymphony.oscache.base.algorithm.AbstractConcurrentReadCache.put(AbstractConcurrentReadCache.java:1648)
    - <span style="color: blue;">waiting to lock <0x44008de0></span> (a com.opensymphony.oscache.base.algorithm.LRUCache)
    at com.opensymphony.oscache.base.algorithm.AbstractConcurrentReadCache.put(AbstractConcurrentReadCache.java:863)
    at com.opensymphony.oscache.base.Cache.putInCache(Cache.java:624)
    at com.opensymphony.oscache.web.tag.CacheTag.doAfterBody(CacheTag.java:380)
    ...........
    ...........
    ...........
    at com.caucho.server.http.Invocation.service(Invocation.java:315)
    at com.caucho.server.http.CacheInvocation.service(CacheInvocation.java:135)
    at com.caucho.server.http.RunnerRequest.handleRequest(RunnerRequest.java:346)
    at com.caucho.server.http.RunnerRequest.handleConnection(RunnerRequest.java:274)
    at com.caucho.server.TcpConnection.run(TcpConnection.java:139)
    at java.lang.Thread.run(Thread.java:595)

<span style="color: blue;">"tcpConnection-9011-8008"</span> daemon prio=1 tid=0x309fe908 nid=0x49f4 <span style="color: blue;">waiting for monitor entry</span> [0x16bf3000..0x16bf4fb0]
    at com.opensymphony.oscache.base.algorithm.AbstractConcurrentReadCache.put(AbstractConcurrentReadCache.java:1581)
    - <span style="color: blue;">waiting to lock <0x44008de0></span> (a com.opensymphony.oscache.base.algorithm.LRUCache)
    at com.opensymphony.oscache.base.algorithm.AbstractConcurrentReadCache.get(AbstractConcurrentReadCache.java:729)
    at com.opensymphony.oscache.base.Cache.getCacheEntry(Cache.java:666)
    at com.opensymphony.oscache.base.Cache.getFromCache(Cache.java:246)
    ...........
    ...........
    ...........
    at com.opensymphony.oscache.web.tag.CacheTag.doStartTag(CacheTag.java:514)
    at com.caucho.server.http.CacheInvocation.service(CacheInvocation.java:135)
    at com.caucho.server.http.RunnerRequest.handleRequest(RunnerRequest.java:346)
    at com.caucho.server.http.RunnerRequest.handleConnection(RunnerRequest.java:274)
    at com.caucho.server.TcpConnection.run(TcpConnection.java:139)
    at java.lang.Thread.run(Thread.java:595)

<span style="color: blue;">"tcpConnection-9011-8007"</span> daemon prio=1 tid=0x2f9f4e60 nid=0x49f2 <span style="color: blue;">waiting for monitor entry </span>[0x15240000..0x152420b0]
    at com.opensymphony.oscache.base.algorithm.AbstractConcurrentReadCache.put(AbstractConcurrentReadCache.java:1648)
    - <span style="color: blue;">waiting to lock <0x44008de0></span> (a com.opensymphony.oscache.base.algorithm.LRUCache)
    at com.opensymphony.oscache.base.algorithm.AbstractConcurrentReadCache.put(AbstractConcurrentReadCache.java:863)
    at com.opensymphony.oscache.base.Cache.putInCache(Cache.java:624)
    at com.opensymphony.oscache.web.tag.CacheTag.doAfterBody(CacheTag.java:380)
    ...........
    ...........
    ...........
    at com.caucho.server.http.Invocation.service(Invocation.java:315)
    at com.caucho.server.http.CacheInvocation.service(CacheInvocation.java:135)
    at com.caucho.server.http.RunnerRequest.handleRequest(RunnerRequest.java:346)
    at com.caucho.server.http.RunnerRequest.handleConnection(RunnerRequest.java:274)
    at com.caucho.server.TcpConnection.run(TcpConnection.java:139)
    at java.lang.Thread.run(Thread.java:595)

<span style="color: blue;">"tcpConnection-9011-7817"</span> daemon prio=1 tid=0x24fee130 nid=0x491c <span style="color: blue;">runnable</span> [0x1513e000..0x15140130]
    at java.lang.System.identityHashCode(Native Method)
    at java.io.ObjectOutputStream$HandleTable.hash(ObjectOutputStream.java:2165)
    at java.io.ObjectOutputStream$HandleTable.lookup(ObjectOutputStream.java:2098)
    ..........
    ..........
    at com.opensymphony.oscache.plugins.diskpersistence.AbstractDiskPersistenceListener.storeGroup(AbstractDiskPersistenceListener.java:247)
    at com.opensymphony.oscache.base.algorithm.AbstractConcurrentReadCache.persistStoreGroup(AbstractConcurrentReadCache.java:1135)
    at com.opensymphony.oscache.base.algorithm.AbstractConcurrentReadCache.addGroupMappings(AbstractConcurrentReadCache.java:1536)
    at com.opensymphony.oscache.base.algorithm.AbstractConcurrentReadCache.remove(AbstractConcurrentReadCache.java:1790)
    - <span style="color: blue;">locked< <0x44008de0></span> (a com.opensymphony.oscache.base.algorithm.LRUCache)
    - <span style="color: blue;">locked <0x44008de0></span> (a com.opensymphony.oscache.base.algorithm.LRUCache)
    at com.opensymphony.oscache.base.algorithm.AbstractConcurrentReadCache.put(AbstractConcurrentReadCache.java:1598)
    - <span style="color: blue;">locked <0x44008de0></span> (a com.opensymphony.oscache.base.algorithm.LRUCache)
    at com.opensymphony.oscache.base.algorithm.AbstractConcurrentReadCache.put(AbstractConcurrentReadCache.java:863)
    at com.opensymphony.oscache.base.Cache.putInCache(Cache.java:624)
    ..........
    ..........
    at com.caucho.server.http.Invocation.service(Invocation.java:315)
    at com.caucho.server.http.CacheInvocation.service(CacheInvocation.java:135)
    at com.caucho.server.http.RunnerRequest.handleRequest(RunnerRequest.java:346)
    at com.caucho.server.http.RunnerRequest.handleConnection(RunnerRequest.java:274)
    at com.caucho.server.TcpConnection.run(TcpConnection.java:139)
    at java.lang.Thread.run(Thread.java:595)
</code></pre>

在上述 dump 片段中，所有的线程都在等待 monitor __<0x44008de0>__。
该 monitor 已经被线程 __tcpConnection-9011-7817__ 获取。
除非线程 __tcpConnection-9011-7817__ 释放该锁，否则所有线程都继续处于 `BLOCKED` 状态。

毫无疑问，我们看到 __tcpConnection-9011-7817__ 在同一个对象上请求了这个锁 3 次。

所有 java 锁都是可重入的，于是已经获得锁的线程可以毫无问题地进入 synchronized 代码块。
以上是一个来自生产环境的真实的线程 dump 。

经过其它背景调查，显示出操作系统已经消耗光了文件描述符(file descriptor)，于是 __tcpConnection-9011-7817__ 无法真正地持久化缓存数据到磁盘，导致无法释放 monitor。
这一系列导致应用中所有线程进入了 `BLOCKED` 状态，并且应用突然挂起。

问题最终通过增加文件描述符的数量，重启应用得到解决。

资源竞争也会在其它场景出现。

在接下来的线程 dump 中，你可以看到工作线程从连接池中请求连接，并通过连接来提取数据。
然而，线程池被设置的大小不够充分（只有 2 个连接），无法满足 3 个工作线程。
两个线程 __Thread-0__ 和 __Thread-2__ 可以获得线程，开始读取数据，而 __Thread-1__ 只能等待连接。

如果你看到这种情况在应用中发生，就该重新审视连接池的配置了。
在任何情况下，连接池的数量应该至少和应用中的工作线程数量一致。
当处理类似于数据库连接池，网络连接，或者文件处理时，你也许会遇到其他类似的问题。

<pre class="highlight"><code>Full thread dump Java HotSpot(TM) Client VM (1.5.0_04-b05 mixed mode, sharing):

"Thread-2" prio=5 tid=0x00a87338 nid=0x1254 waiting on condition [0x02d4f000..0x02d4fae8]
    at java.net.SocketInputStream.socketRead(Native Method)
    at java.net.SocketInputStream.read(SocketInputStream.java:86)
    at java.io.BufferedInputStream.fill(BufferedInputStream.java:186)
    at java.io.BufferedInputStream.read(BufferedInputStream.java:204)
    at org.tw.testyard.thread.WorkerThread.run(WorkerThread.java:9)
    at java.lang.Thread.run(Unknown Source)

<span style="color: blue;">"Thread-1"</span> prio=5 tid=0x00a861b8 nid=0xbdc in <span style="color: blue;">Object.wait()</span> [0x02d0f000..0x02d0fb68]
    <span style="color: blue;">at java.lang.Object.wait(Native Method)
    - waiting on <0x22aadfc0> (a org.tw.testyard.thread.ConnectionPool)
    at java.lang.Object.wait(Unknown Source)
    at org.tw.testyard.thread.ConnectionPool.getConnection(ConnectionPool.java:39)</span>
    - locked <0x22aadfc0> (a org.tw.testyard.thread.ConnectionPool)
    at org.tw.testyard.thread.WorkerThread.run(WorkerThread.java:7)
    at java.lang.Thread.run(Unknown Source)

"Thread-0" prio=5 tid=0x00a86038 nid=0x988 waiting on condition [0x02ccf000..0x02ccfbe8]
    at java.net.SocketInputStream.socketRead(Native Method)
    at java.net.SocketInputStream.read(SocketInputStream.java:86)
    at java.io.BufferedInputStream.fill(BufferedInputStream.java:186)
    at java.io.BufferedInputStream.read(BufferedInputStream.java:204)
    at org.tw.testyard.thread.WorkerThread.run(WorkerThread.java:9)
    at java.lang.Thread.run(Unknown Source)
</code></pre>

## 小结

- 线程 dump 是对 JVM 状态的快照。它揭示了所有线程和锁的状态。
- 线程 dump 对应用状态可视化有很高的价值，并且帮助快速定位问题。
- 线程 dump 相对于难以集成的复杂的剖析工具和调试器，在生产环境中更是一种无价的工具。

它不像剖析和调试器给应用带来负面影响。在诸如资源竞争、线程耗尽、死锁等常见的问题面前，线程 dump 应该作为首选分析手段。

在这篇文章，我们了解了线程 dump 的重要性、如何捕捉线程 dump、线程的状态，并最终通过现实世界的 dump 片段知道如何解读线程 dump 数据。

## 资料

- [An Introduction to Java Stack Traces](http://developer.java.sun.com/developer/technicalArticles/Programming/Stacktrace/)
- [Thread Dump Analyser](https://tda.dev.java.net/) : The TDA (Thread Dump Analyzer) for Java is a small Swing GUI for analyzing Thread Dumps and Heap Information generated by the Sun Java VM 
- [Common WebLogic Server Deadlocks and How to Avoid Them](http://dev2dev.bea.com/articles/496.jsp)
- [View From The Trenches : Looking at Thread Dumps](http://dev2dev.bea.com/pub/a/2004/01/thread_dumps.html)

`<<<EOF`
