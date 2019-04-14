---
layout: post
title: 解决 chrome android 版本崩溃
tags: chrome android
excerpt_separator: <!-- more -->
---

由于长期用 chrome，书签里囤积了一大堆技术文章。最近决心好好消化一下，准备利用上下班时间在手机上翻翻。

谁料，好不容易在手机调通书签同步之后，阅读时 chrome 安卓版平均每 3 分钟崩溃一次。

<!-- more -->

由于 Android 来自 Google 爸爸，而 Google 在国内目前处于无法使用状态，所以想要体验 youtube、play 等 app，除了借助梯子，还需要安装各厂商封装的 Google 服务安装包。

安装好了它，才能使用基于它的 app：youtube、play、google map 等。

目前，这看起来是个正常的基础软件包。

---

当我魅族上的 chrome 疯狂崩溃时，我尝试了各种办法：更新、加权限、允许后台运行、锁定内存……

最后，终于在一篇帖子上看到：

![chrome-android-crash-resolution.png](/public/img/posts/chrome-android-crash-resolution.png)

卸载 Google 服务软件包，崩溃解决。

`<<<EOF`
