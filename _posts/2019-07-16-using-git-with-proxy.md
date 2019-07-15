---
layout: post
title: 给 Git 设置代理
tags: git proxy
excerpt_separator: <!-- more -->
---

git 是目前使用最广泛的版本控制工具。github 是使用 git 作为代码版本控制的开源项目社区。

由于俺们访问 github 提供的 git 服务特别慢。我们需要为 git 设置代理。

<!-- more -->

git 在与远程仓库通信的时候支持两种协议: http/ssh，可以在从 remote url 上区分:

http 协议: 
    
    git clone https://github.com/owner/git.git

ssh 协议:
    
    git clone git@github.com:owner/git.git

### 为 http 协议设置 http 代理

    git config --global http.proxy "http://127.0.0.1:8080"
    git config --global https.proxy "http://127.0.0.1:8080"
    [or] 
    git config --global http.proxy "socks5://127.0.0.1:1080"
    git config --global https.proxy "socks5://127.0.0.1:1080"

取消设置

    git config --global --unset http.proxy
    git config --global --unset https.proxy

### 为 ssh 协议设置代理

修改 `~/.ssh/config` 文件（不存在则新建）：

    Host github.com
       HostName github.com
       User git
       # 走 HTTP 代理
       # ProxyCommand socat - PROXY:127.0.0.1:%h:%p,proxyport=8080
       # 走 socks5 代理（如 Shadowsocks）
       # ProxyCommand nc -v -x 127.0.0.1:1080 %h %p

`<<<EOF`
