---
layout: post
title: 在 Windows 上提供 ssh 服务
excerpt_separator: <!-- more -->
---

每次有在设备之间文件传输，文本发送的需求的时候，第一反应总归是 qq、wechat 这类异常强大的 im 工具。

工具虽然简单好用，可是传输的时候避免不了文件（传输内容）到外网上走一圈的问题。

作为一个开发人员，电脑上一定安装了 git bash，so 我们也可以依赖 git bash 提供的 sshd 命令行工具实现在 windows 是上提供 sshd 服务，通过 scp、wall 等方式实现内容传输。

<!-- more -->

考虑到 git 安装时版本的问题，先尝试切换到 git 的安装目录，确保已经安装了 sshd 等工具

    cmdr> cd "D:\Program Files\Git\usr\bin\
    cmdr> ls ss*
    ssh-add.exe*  ssh-agent.exe*  ssh-copy-id*  ssh-keygen.exe*  ssh-keyscan.exe*  ssh.exe*  sshd.exe*  ssp.exe*

启动 sshd 

    cmdr> .\sshd.exe
    sshd re-exec requires execution with an absolute path

遇到问题了哦，根据提示，我们启动时带上全路径

    cmdr> "D:\Program Files\Git\usr\bin\sshd.exe"
    Privilege separation user sshd does not exist

又遇到问题了，根据提示查找资料一番，是 sshd 配置问题，问题是 git bash 自带的 sshd 加载的配置在哪里呢？

    cmdr> cat "D:\Program Files\Git\etc\ssh\sshd_config"
    # $OpenBSD: sshd_config,v 1.97 2015/08/06 14:53:21 deraadt Exp $

    # This is the sshd server system-wide configuration file.  See
    # sshd_config(5) for more information.

    # This sshd was compiled with PATH=/bin:/usr/sbin:/sbin:/usr/bin

    # The strategy used for options in the default sshd_config shipped with
    # OpenSSH is to specify options with their default value where
    # possible, but leave them commented.  Uncommented options override the
    # default value.
    ...
    ...
    UsePrivilegeSeparation no  # not secure, but as personal use its ok
    ...

这一项配置是用来分离启动 ssh 进程的权限和当前系统会话的权限，但是我们只是想用用 ssh 协议传输内容，安全相关的可以不用太关注啦，所以更新配置为 "no"

启动成功后可以在任务管理器里看到

<p class="text-center">
  <img src="/public/img/posts/sshd-started.png">
</p>

#### 让你的 sshd 更快一点

修改 sshd_config 里配置如下
    
    GSSAPIAuthentication yes
    GSSAPIDelegateCredentials no
    UseDNS no

`<<<EOF`