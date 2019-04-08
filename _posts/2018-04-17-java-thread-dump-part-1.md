---
layout: post
title: Java 线程转储(thread dump) - Part 1
tags: java thread jdk-tool
excerpt_separator: <!-- more -->
---

[原文链接](https://sites.google.com/site/threaddumps/java-thread-dumps)
 
通过这篇文章我们将理解 Java 线程转储(dump)，以及它们如何成为理解、解决常见问题的利器。
文章将会分成两个部分。

第一部分集中介绍以下几个主题

1. 简要介绍 Java 线程
1. 理解什么是线程转储
1. 线程转储的格式
1. 如何转储

<!-- more -->

第二部分我们通过以下几个方面剖析、解读线程转储

1. 理解线程状态
1. 分析转储的最佳实践
1. 分析静态条件
1. 参考资料

虽然，这篇文章中涉及到的线程转储信息来源于真实场景，但是只有我们感兴趣的一部分被展现出来。
我们希望基础的概念通过例子能被轻松地理解，并且能够马上在你面临的情况上付诸实践。

-----

## Part I: Java 线程介绍

#### 进程和线程是构建并发程序的基础模块。

一个进程是一个包含自我的执行环境。通常，它拥有一个完整的，私有的，基础的运行时资源；比如，每个进程都有它自己的内存空间。

进程通常作为“程序”、“应用”的同义词出现，但是，通常用户看到的单个应用，大多数是由多个进程相互协作完成的。

为了使多个进程相互通讯，大多数操作系统支持 IPC(Inter Process Communication) 资源，例如管道、socket。IPC 不仅局限在同一操作系统上多个进程通讯，更支持跨系统通讯。

#### 线程通常被称为轻量级进程。

进程和线程都能提供执行环境，但是新起一个线程比进程需要更少的资源。

线程存在于进程内，每一个进程都至少包含一个线程。
不同的线程分享进程的资源，包括内存，打开的文件。这让线程间的通讯更高效，但是更容易造成潜在问题。

多线程执行是 Java 平台的核心特性之一。每个应用至少包含一个线程；也可说有多个，如果你算上负责内存管理，信号处理的系统线程。但是从应用开发者的角度上看，你只是起了一个线程：主线程。

主线程具有新建线程的能力，我们将会在下一节展示。大多数 JVM 的实现是基于单进程的。

文章接下来将会假设你对 Java 多线程编程有基本的理解。
如果你想重温一下这块知识点，我强烈推荐你阅读 [Sun Java 指南](http://java.sun.com/docs/books/tutorial/) 的 [并发](http://java.sun.com/docs/books/tutorial/essential/concurrency/index.html) 章节。

也可以参考下[这些在线资源](http://www.google.com/search?q=programming%20java%20threads)。

### 什么是线程转储(dump)

让我们边看边理解

    Full thread dump Java HotSpot(TM) Client VM (1.5.0_04-b05 mixed mode, sharing):

    "DestroyJavaVM" prio=5 tid=0x00036218 nid=0xd68 waiting on condition [0x00000000..0x0007fae8]

    "Thread-1" prio=5 tid=0x00ab8e68 nid=0xe14 waiting on condition [0x02d0f000..0x02d0fb68]
    at java.lang.Thread.sleep(Native Method)
    at org.tw.testyard.thread.Consumer.run(Consumer.java:18)
    at java.lang.Thread.run(Unknown Source)

    "Thread-0" prio=5 tid=0x00aa3ab8 nid=0x1530 waiting on condition [0x02ccf000..0x02ccfbe8]
    at java.lang.Thread.sleep(Native Method)
    at org.tw.testyard.thread.Producer.run(Producer.java:24)
    at java.lang.Thread.run(Unknown Source)

    "Low Memory Detector" daemon prio=5 tid=0x00a6e950 nid=0x1698 runnable [0x00000000..0x00000000]

    "CompilerThread0" daemon prio=10 tid=0x00a6d658 nid=0x5b8 waiting on condition [0x00000000..0x02c0fa4c]

    "Signal Dispatcher" daemon prio=10 tid=0x00a6c7c0 nid=0x15e0 waiting on condition [0x00000000..0x00000000]

    "Finalizer" daemon prio=9 tid=0x0003fb00 nid=0x598 in Object.wait() [0x02b8f000..0x02b8fa68]
    at java.lang.Object.wait(Native Method)
    - waiting on <0x22a80840> (a java.lang.ref.ReferenceQueue$Lock)
    at java.lang.ref.ReferenceQueue.remove(Unknown Source)
    - locked <0x22a80840> (a java.lang.ref.ReferenceQueue$Lock)
    at java.lang.ref.ReferenceQueue.remove(Unknown Source)
    at java.lang.ref.Finalizer$FinalizerThread.run(Unknown Source)

    "Reference Handler" daemon prio=10 tid=0x00a47aa0 nid=0x1538 in Object.wait() [0x02b4f000..0x02b4fae8]
    at java.lang.Object.wait(Native Method)
    - waiting on <0x22a80750> (a java.lang.ref.Reference$Lock)
    at java.lang.Object.wait(Unknown Source)
    at java.lang.ref.Reference$ReferenceHandler.run(Unknown Source)
    - locked <0x22a80750> (a java.lang.ref.Reference$Lock)

    "VM Thread" prio=10 tid=0x00a67ce8 nid=0xc78 runnable

    "VM Periodic Task Thread" prio=10 tid=0x00a6fc90 nid=0x830 waiting on condition

正如它名字一样，线程转储是 JVM 中所有的线程转储。它包含应用线程和 JVM  特殊线程的当前执行状态。以上的 dump 记录片段展现 2 个应用线程：`Thread-0` 和 `Thread-1`，JVM 特殊线程诸如：`Signal Dispatcher`, `Finalizer`

线程 dump 在以下几个场景非常有用：

- 在某个特定时刻，作为应用内部正在发生的所有事情的一个视图
- 暴露易见的问题诸如：
    - 代码中哪一部份总是被调用
    - 代码中哪一部份会挂起
    - 锁与线程同步问题
- 更多的是，作为在生产环境能轻易启动的重要的程序解剖工具，dump 非常有用

### 线程 dump 文件的格式

线程 dump 文件的格式随着 JSE 的版本发生了一些变化。
Sun 和其它厂商也会告知用户这些变化。
但不变的是包含在 dump 文件中的信息级别。
正如提到的，dump 文件是 JVM 状态的快照，它列出所有关于应用和系统级别的线程和锁的状态。

<pre class="highlight"><code><span style="color:blue;">Full thread dump</span> Java HotSpot(TM) Client VM (1.5.0_04-b05 mixed mode, sharing):

<span style="color:blue;">"Thread-1"</span> prio=5 tid=0x00a995d0 nid=0x1300 in <span style="color:blue;">Object.wait()</span> [0x02d0f000..0x02d0fb68]
at java.lang.Object.wait(Native Method)
- waiting on <0x22aaa8d0> (a org.tw.testyard.thread.Drop)
at java.lang.Object.wait(Unknown Source)
at org.tw.testyard.thread.Drop.take(Drop.java:14)
- locked <0x22aaa8d0> (a org.tw.testyard.thread.Drop)
at org.tw.testyard.thread.Consumer.run(Consumer.java:15)
at java.lang.Thread.run(Unknown Source)

<span style="color:blue;">"Thread-0"</span> prio=5 tid=0x00a88440 nid=0x6a4 <span style="color:blue;">waiting on condition</span> [0x02ccf000..0x02ccfbe8]
at java.lang.Thread.sleep(Native Method)
at org.tw.testyard.thread.Producer.run(Producer.java:24)
at java.lang.Thread.run(Unknown Source)
</code></pre>

通过上面的 dump 文件片段，你可以观察出：
1. 线程 dump 以 "Full thread dump" 开头，紧接着是当前正在执行的线程列表
1. 有两个应用线程："Thread-1" 和 "Thread-0"，这是 JVM 默认的线程命名规则
1. "Thread-1" 在调用 `Object.wait()` 后，正在等待来自 `Drop` 对象的通知
1. 相似的，"Thread-0" 在调用了 `Thread.sleep` 后，正在某个条件上休眠
1. 在当前时刻，由于没有线程在可运行状态，当前应用没有真正做任何事情

虽然，线程 dump 会列出系统线程的状态，但是我们并不打算深入探索系统线程。

### 如何 dump

线程 dump 可以被用户手动触发，也可以在非正常情况下由系统触发。
用户可以通过发送给 JVM 信号，或者通过代码调用 `java.lang.Exception.printStackTrace()`.
调用 `printStackTrace()`, 可以让系统仅仅打印当前线程的调用栈。

在 Windows 系统上，进程在前台运行时，可以通过控制台命令行来 dump 线程。同时按下 <kbd>Ctrl</kbd> + <kbd>\</kbd>。 

在 Unix／Linux 环境，可以通过 `kill -QUIT <jvm pid>` 命令或者 `kill -3 <jvm pid>` 命令。线程 dump 文件通常输出到 stderr (标准错误流)

笔者更推荐使用 JDK 工具来 dump：

    ~ jstack --help
    Usage:
        jstack [-l] <pid>
            (to connect to running process)
        jstack -F [-m] [-l] <pid>
            (to connect to a hung process)
        jstack [-m] [-l] <executable> <core>
            (to connect to a core file)
        jstack [-m] [-l] [server_id@]<remote server IP or hostname>
            (to connect to a remote debug server)

    Options:
        -F  to force a thread dump. Use when jstack <pid> does not respond (process is hung)
        -m  to print both java and native frames (mixed mode)
        -l  long listing. Prints additional information about locks
        -h or -help to print this help message

可以看到 jstack 除了可以连接到进程，还可以对应到模块 (core file)。

根据你的 JVM 启动命令不同，dump 文件可能会出现在其它日志文件中。
请咨询下你的系统管理员，无论使用那种 dump 方式，都不会导致应用停止，JVM 导出线程执行状态并且继续运行。

虽然概率很低，但是 JVM 也会因为偶然某个线程的 dump 而导致 JVM 崩溃。
在日志中记录的信息非常详细。通常，你可以在其中发现是哪个线程导致了这次崩溃。
 
## 小结

在这部分，我们快速地过了一遍线程、dump 文件格式以及我们如何 dump。有趣的事情才刚刚开始。
接下来，我们将理解线程的状态，如何解释 dump 文件。

[去下一节]({% post_url 2018-04-17-java-thread-dump-part-2 %})。

`<<<EOF`