---
layout: post
title: 给 Git 设置代理
tags: git proxy
excerpt_separator: <!-- more -->
---

git 是目前使用最广泛的版本控制工具。github 是使用 git 作为代码版本控制的开源项目社区。

由于俺们访问 github 提供的 git 服务特别慢。我们需要为 git 设置代理。

<!-- more -->

git 在与远程仓库通信的时候支持两种协议: http/ssh，可以在从 `.git/config` 配置文件的 [remote url] 上区分:

http 协议: 
    
    https://github.com/owner/git.git

ssh 协议:
    
    git@github.com:owner/git.git

## 为 http 协议设置代理

```
git config --global http.proxy "http://127.0.0.1:8080"
git config --global https.proxy "http://127.0.0.1:8080"

[or] 

git config --global http.proxy "socks5://127.0.0.1:1080"
git config --global https.proxy "socks5://127.0.0.1:1080"
```

取消设置:

```
git config --global --unset http.proxy
git config --global --unset https.proxy
```

## 为 ssh 协议设置代理

修改 `~/.ssh/config` 文件（不存在则新建）：

```
Host github.com
    HostName github.com
    User git
    # 走 http 代理
    # ProxyCommand socat - PROXY:127.0.0.1:%h:%p,proxyport=8080
    # 走 socks5 代理（如 Shadowsocks）
    # ProxyCommand nc -v -x 127.0.0.1:1080 %h %p
```

## 补充

我们用 git 服务大多数使用需求是: github 需要通过代理啊，而其它代码托管服务 (比如公司的 gitlab) 则不用。

可以看到 ssh 可以通过 Host/HostName 方便地限定了需要走代理的 domain。http 协议同样可以。

## 小结

综上所述，我们需要设置 github 的 git 服务挂上代理，可以通过如下配置:

1. 在 `~/.gitconfig` 文件中配置:

```
[http "https://github.com/"]
    proxy = socks5://127.0.0.1:1086
```

2. 在 `~/.ssh/config` 文件中配置:
    
```
Host github.com
    HostName github.com
    User git
    ProxyCommand nc -v -x 127.0.0.1:1086 %h %p
```

## 参考

- [Only use a proxy for certain git urls/domains? - Stack Overflow](https://stackoverflow.com/questions/16067534/only-use-a-proxy-for-certain-git-urls-domains/18712501#18712501)

`<<<EOF`
