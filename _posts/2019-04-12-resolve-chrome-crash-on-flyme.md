---
layout: post
title: 解决 chrome(android 版) 在 flyme 上崩溃
tags: chrome android
excerpt_separator: <!-- more -->
---

笔者的 chrome 书签里囤积了一大堆技术文章。最近准备利用上下班的地铁时间在手机上翻翻。

谁料，好不容易在手机 chrome 书签同步之后，阅读时 chrome 平均 3 分钟崩溃一次。

<!-- more -->

由于 Android 来自 Google，而 Google 在国内目前处于无法使用状态，所以想要体验 youtube、google play 等 app，还需要安装各手机厂商在应用市场发布的 Google 服务框架。

安装好了它，才能使用基于它的 app：youtube、play、google map 等应用。

目前，这看起来是个正常的基础软件包。

---

我的环境是魅族 16S，flyme 7.2。在经历：更新、加权限、允许后台运行、锁定内存等方法之后，终于在一篇帖子上看到：

![chrome-android-crash-resolution.png](/public/img/posts/chrome-android-crash-resolution.png)

卸载 Google 服务软件包，崩溃解决。

`<<<EOF`
