---
layout: post
title: tcpdump 命令简介
tags: tcpdump linux
excerpt_separator: <!-- more -->
last_modified: 2020-07-14
---

联调接口是每个 Web 开发者必备技能，前端以 Chrome Developer Tools 为主，浏览器发出的请求都可以通过 Network 捕获。

服务端开发远程调用 Http 接口时，可以通过 Http 代理软件观察请求的内容，比如 Fiddler，Charles。
然而，能这样做的前提条件是服务端的开发者处于 GUI 环境，如果你处于 Linux 命令行环境，就需要 tcpdump 之类的命令来捕捉 Http 流量。

<!-- more -->

## 基本选项

tcpdump 可以捕捉指定网卡的流量，在控制台输出，保存到文件；还可以不监听，直接解析文件内容并输出。

其中常用的选项:

```
tcpdump [ -c count ] 
        [ -C file_size ] [ -G rotate_seconds ] [ -F file ]
        [ -i interface ] [ -j tstamp_type ] [ -m module ] [ -M secret ]
        [ --number ] [ -Q in|out|inout ]
        [ -r file ] [ -V file ] [ -s snaplen ] [ -T type ] [ -w file ]
        [ -W filecount ]
        [ -E spi@ipaddr algo:secret,...  ]
        [ -y datalinktype ] [ -z postrotate-command ] [ -Z user ]
        [ --time-stamp-precision=tstamp_precision ]
        [ --immediate-mode ] [ --version ]
        [ expression ]
```

各中含义如下：

- `-i`: 指定网卡，比如 `-i eth0` 意味着抓取 eth0 网卡的流量；如果没有指定，tcpdump 会检查网卡列表，找到状态为 `UP` 并且 "数字" 最小的那个网卡进行监听，比如 `eth0`，并排除 lo 网卡。
- `-c`: 指定抓取封包数量，比如 `-c 100` 会在抓取到 100 个 packet 后停止
- `-n`: 不进程地址反查，即不会将 ip 地址解析为主机名
- `--number`: 打印网络封包的自增编号，这是 tcpdump 给每个 packet 生成的代表顺序的编号，而不是 tcp sequence 编号
- `-Q`: 指定 packet 方向，in: 入网，out: 出网，inout: 两者都捕获
- `-s`: 指定从每个 packet 中捕获的字节数，如果 `-s 0` 则捕获默认的 262144 字节
- `-A`: 以 ASCII 形式打印每个 packet 的数据，非常适用于 web 调试
- `-X`: 以 hex 和 ASCII 形式打印每个 packet，适用于调试新的协议

## 输出格式

来看看 tcpdump 如何工作，比如我们想通过它来抓取本地访问 www.baidu.com 的数据。

```
tcpdump 'port 80 and host www.baidu.com'
```

然后通过 curl www.baidu.com 就会看到 tcpdump 如下输出：

```
### 三次握手建立 TCP 链接
23:05:19.720766 IP [local-ip].55405 > 180.101.49.12.http: Flags [S], seq 2801727995, win 29200, options [mss 1460,nop,nop,sackOK,nop,wscale 7], length 0
23:05:19.731660 IP 180.101.49.12.http > [local-ip].55405: Flags [S.], seq 1189577036, ack 2801727996, win 8192, options [mss 1452,nop,nop,sackOK,nop,wscale 5], length 0
23:05:19.731678 IP [local-ip].55405 > 180.101.49.12.http: Flags [.], ack 1, win 229, length 0

### 本地向服务端发起 http 请求
23:05:19.731705 IP [local-ip].55405 > 180.101.49.12.http: Flags [P.], seq 1:78, ack 1, win 229, length 77: HTTP: GET / HTTP/1.1

### 服务端向本地 ack，并发送 response
23:05:19.742859 IP 180.101.49.12.http > [local-ip].55405: Flags [.], ack 78, win 908, length 0
23:05:19.744004 IP 180.101.49.12.http > [local-ip].55405: Flags [P.], seq 1:1441, ack 78, win 908, length 1440: HTTP: HTTP/1.1 200 OK

### 本地向服务端 ack
23:05:19.744016 IP [local-ip].55405 > 180.101.49.12.http: Flags [.], ack 1441, win 251, length 0

### 服务端继续向本地发送数据
23:05:19.744019 IP 180.101.49.12.http > [local-ip].55405: Flags [P.], seq 1441:2782, ack 78, win 908, length 1341: HTTP

### 本地向服务端 ack
23:05:19.744022 IP [local-ip].55405 > 180.101.49.12.http: Flags [.], ack 2782, win 274, length 0

### 数据接收完毕后，本地主动关闭链接，向服务端发起 FIN，并且 ack 自己已无数据发送; 1/4
23:05:19.744139 IP [local-ip].55405 > 180.101.49.12.http: Flags [F.], seq 78, ack 2782, win 274, length 0
### 服务端继续向本地发送数据
23:05:19.752994 IP 180.101.49.12.http > [local-ip].55405: Flags [P.], seq 1441:2782, ack 78, win 908, length 1341: HTTP
### 本地向服务端 ack
23:05:19.753001 IP [local-ip].55405 > 180.101.49.12.http: Flags [.], ack 2782, win 274, options [nop,nop,sack 1 {1441:2782}], length 0
### 服务度端向本地 ack; 2/4
23:05:19.755279 IP 180.101.49.12.http > [local-ip].55405: Flags [.], ack 79, win 908, length 0
### 服务端向本地发送 FIN; 3/4
23:05:19.755289 IP 180.101.49.12.http > [local-ip].55405: Flags [F.], seq 2782, ack 79, win 908, length 0
### 本地向服务端 ack; 4/4
23:05:19.755299 IP [local-ip].55405 > 180.101.49.12.http: Flags [.], ack 2783, win 274, length 0
### 服务端重置链接
23:05:22.765004 IP 180.101.49.12.http > [local-ip].55405: Flags [R], seq 1189579819, win 0, length 0
```

其中每一列的含义如下：

- `23:05:19.720766`: 代表 tcpdump 收到该 packet 的本地时间
- `IP`: 网络层的协议，在本例中 IP 代表 ipv4，如果是 ipv6，则会显示 IP6
- `[local-ip].55405 > 180.101.49.12.http`: 代表本地 ip.port 向 [remote ip].port 传输
- `Flags [S]`: 代表 TCP 标志，通过对照表可以判断出当前 packet 的标志

    Flags 对照表:

    |Value | Flag Type | Description       |
    |:----:|:---------:|:-----------------:|
    |S     | SYN       | Connection Start  |
    |F     | FIN       | Connection Finish |
    |P     | PUSH      | Data push         |
    |R     | RST       | Connection reset  |
    |.     | ACK       | Acknowledgment    |


- `seq 2801727995`: 代表当前 packet 数据的序列号。如果是第一个 packet(SYN)，那么是一个绝对值;
    如果是在后续传输数据的过程中(PUSH)，该 seq 是一个相对值，便于追踪整个流，比如 `seq 1441:2782`
- `ack 78`: 代表目前收到的最后一个 packet 的 seq 值，如果还没有，则 `ack 1`
- `win 29200`, 代表 tcp 滑动窗口的中的数据大小（byte）
- `options [mss 1460,nop,nop,sackOK,nop,wscale 7]`: tcp 协议选项，诸如 mss，window scale 等
- `length 0`: 代表当前 packet 中数据大小(byte)

另外，通过观察还能得出 ack num 和 seq num 有以下关系：

1. 在建立链接和关闭链接的过程中，ack 对方发送的数据时：ack num = seq num + 1
2. 在发送数据的过程中，ack num = 上一次发送的 seq 范围的最后一个字节
3. 在其它情况下，packet 会带上（重复）上一次本方的 ack num

另外通过实验，可以实现 3 次挥手。Flags 分别是：

1. F
2. F.
3. .

## 表达式

这是 tcpdump 的黑魔法。

tcpdump 用表达式过滤 packet，只输出表达式为 true 的 packet。

表达式由一个或多个表达元(primitive) 组成。一个表达元通常由一个或多个修饰符(qualifiers) 后跟一个名字或数字表示的 id 组成(即, 'qualifiers id').

有三种不同类型的修饰符: type, dir 以及 proto.

### type 修饰符

type 修饰符指定 id 所代表的对象类型, id 可以是名字也可以是数字. 

可选的对象类型有: host, net, port 以及 portrange。
host 表明 id 表示主机, net 表明 id 是网络, port 表明 id 是端口而 portrange 表明 id 是一个端口范围。如：

- `host foo`: 主机 foo
- `net 128.3`: 网络 128.3
- `port 20`: 端口 20
- `portrange 6000-6008`: 端口范围 6000-6008

如果不指定 type 修饰符, id 默认的修饰符为 host.

### dir 修饰符

dir 修饰符描述 id 所对应的传输方向, 即发往 id 还是从 id 接收（而 id 到底指什么需要看其前面的 type 修饰符）.
可取的方向为: src, dst, src 或 dst, src 并且 dst. 如: 

- `src foo`: 源主机是foo
- `dst net 128.3`: 目的网络是128.3
- `src or dst port ftp-data`: 源或目的端口为 ftp-data

如果不指定 dir 修饰符, id 默认的修饰符为 src 或 dst. 

### proto 修饰符

proto 修饰符描述 id 所属的协议. 可选的协议有: ether, fddi, tr, wlan, ip, ip6, arp, rarp, decnet, tcp 以及 upd.

- ether: 可理解为物理以太网传输协议 
- fddi: 光纤分布数据网传输协议
- tr: 用于路由跟踪的协议
- wlan: 无线局域网协议
- ip, ip6: 即通常的TCP/IP协议栈中所使用的 ipv4 以及 ipv6 网络层协议
- arp, rarp: 即地址解析协议,反向地址解析协议
- decnet: Digital Equipment Corporation 开发的, 最早用于 PDP-11 机器互联的网络协议
- tcp/udp: 即通常 TCP/IP 协议栈中的两个传输层协议

如: 
- `ether src foo`: 从以太网地址 foo 来的数据包
- `arp net 128.3`: 发往或来自 128.3 网络的 arp 协议数据包
- `tcp port 21`: 发送或接收端口为 21 的 tcp 协议数据包
- `udp portrange 7000-7009`: 发送或接收端口范围为 7000-7009 的 udp 协议数据包

如果不指定 proto 修饰符, 则默认为与相应 type 匹配的修饰符. 例如:
- `src foo` 含义是 '(ip or arp or rarp) src foo' 即, 来自主机 foo 的 ip/arp/rarp 协议数据包, 默认 type 为 host
- `net bar` 含义是 '(ip or arp or rarp) net bar' 即, 来自或发往 bar 网络的 ip/arp/rarp 协议数据包
- `port 53` 含义是 '(tcp or udp) port 53' 即, 发送或接收端口为 53 的 tcp/udp 协议数据包

由于 tcpdump 直接通过数据链路层的 BSD 数据包过滤器或 DLPI(datalink provider interface, 数据链层提供者接口) 来直接获得网络数据包, 
其可抓取的数据包可涵盖上层的各种协议, 包括 arp, rarp, icmp(因特网控制报文协议), ip, ip6, tcp, udp, sctp(流控制传输协议)。

对于修饰符后跟 id 的格式, 可理解为, type id 是对包最基本的过滤条件: 即对包相关的主机, 网络, 端口的限制; dir 表示对包的传送方向的限制; proto表示对包相关的协议限制)

表达元之间还可以通过关键字 and, or 以及 not 进行连接, 从而可组成比较复杂的条件表达式. 
比如：`host foo and not port ftp and not port ftp-data`，其过滤条件为: 数据包的主机为 foo, 并且端口不是 ftp(端口21) 和 ftp-data(端口20)。

常用端口和名字的对应可在 linux 系统中的 `/etc/service` 文件中找到。

为了表示方便, 同样的修饰符可以被省略, 如 'tcp dst port ftp or ftp-data or domain` 与以下的表达式含义相同 `tcp dst port ftp or tcp dst port ftp-data or tcp dst port domain`.
其过滤条件可理解为: 包的协议为 tcp, 目的端口为 ftp 或 ftp-data 或 domain(端口53).

借助括号以及操作符, 可把表达元组合在一起使用 (由于括号是 shell 的特殊字符, 所以在 shell 脚本或终端中使用时必须对括号进行转义, 即'(' 与')'需要分别表达成'\(' 与 '\)').

### 操作符:

1. 否定操作 (`!` 或 `not`)
1. 与操作(`&&` 或 `and`)
1. 或操作(`||` 或 `or`)

否定操作符的优先级别最高. 与操作和或操作优先级别相同, 并且二者的结合顺序是从左到右. 
要注意的是, 表达 '与操作' 时, 需要显式写出 'and' 操作符, 而不只是把前后表达元并列放置(nt: 二者中间的 'and' 操作符不可省略).

如果一个标识符前没有关键字, 则表达式的解析过程中最近用过的关键字(往往也是从左往右距离标识符最近的关键字)将被使用.

比如 `not host vs and ace` 是 `not host vs and host ace` 的精简表达，而不是 `not (host vs or ace)`。

前两者表示：所需数据包不是来自或发往 host vs, 而是来自或发往 ace，而后者表示数据包只要不是来自或发往 vs 或 ac 都符合要求)

整个条件表达式可以被当作一个单独的字符串参数也可以被当作空格分割的多个参数传入 tcpdump, 后者更方便些. 

通常, 如果表达式中包含元字符(如正则表达式中的 '*', '.' 以及 shell 中的 '('等字符)，最好还是使用单独字符串的方式传入. 
这时, 整个表达式需要被单引号括起来, 作为一个字符串被解析。

## 常用 tcpdump 的表达元

- `dst host [host]`

    如果 IPv4/v6 数据包的目的域是 [host], 则与此对应的条件表达式为真. host 可以是一个 ip 地址, 也可以是一个主机名.

- `src host [host]`
    
    如果 IPv4/v6 数据包的源域是 [host], 则与此对应的条件表达式为真。host 可以是一个 ip 地址, 也可以是一个主机名。

- `host [host]`

    如果 IPv4/v6 数据包的源或目的地址是 [host], 则与此对应的条件表达式为真。

以上的几个 host 表达式之前可以添加以下关键字: ip, arp, rarp, 以及 ip6.
比如: `ip host [host]`, 也可以表达为: `ether proto ip and host [host]`。

> 这种表达式在 ip 之前需要有 \ 来转义，因为 ip 对 tcpdump 来说已经是一个关键字

- `ether dst [ehost]`

    如果数据包(指 tcpdump 可抓取的数据包, 包括 ip 数据包, tcp数据包)的以太网目标地址是 [ehost], 则与此对应的条件表达式为真。
    
    ehost 可以是 /etc/ethers 文件中的名字或一个数字地址。
    
- `ether src [ehost]`

    如果数据包的以太网源地址是 [ehost], 则与此对应的条件表达式为真.

- `ether host [ehost]`
  
    如果数据包的以太网源地址或目标地址是 ehost, 则与此对应的条件表达式为真.

- `gateway [host]`

如果数据包的网关地址是 host, 则与此对应的条件表达式为真。
需要注意的是, 这里的网关地址是指以太网地址, 而不是IP 地址。

- `dst net [net]`

    如果数据包的目标地址(IPv4或IPv6格式)的网络号字段为 net, 则与此对应的条件表达式为真.
    net 可以是从网络数据库文件 /etc/networks 中的名字, 也可以是一个数字形式的网络地址.

    IPv4 网络地址将以点分四元组(比如, 192.168.1.0), 或点分三元组(比如, 192.168.1 ), 或点分二元组(比如, 172.16), 或单一单元组(比如, 10)来表达;

    对于 IPv6 地址, 网络编号必须全部写出来(8个部分必须全部写出来)，比如：`2001:0db8:86a3:08d3:1319:8a2e:0370:7344`。

- `src net [net]`

    如果数据包的源地址(IPv4或IPv6格式)的网络号字段为 net, 则与此对应的条件表达式为真.

- `net [net]`

    如果数据包的源或目的地址(IPv4或IPv6格式)的网络号字段为 net, 则与此对应的条件表达式为真.

- `dst port [port]`

    如果数据包(包括ip/tcp, ip/udp, ip6/tcp or ip6/udp协议)的目的端口为 [port], 则与此对应的条件表达式为真。
    
    port 可以是一个数字也可以是一个名字(相应名字可以在 `/etc/services` 中找到该名字, 也可以通过 `man tcp` 和 `man udp` 来得到相关描述信息。
    
    如果使用名字, 则该名字对应的端口号和相应使用的协议都会被检查。如果只是使用一个数字端口号,则只有相应端口号被检查。
    比如, `dst port 513` 将会使 tcpdump 抓取 tcp 协议的 login 服务和 udp 协议的 who 服务数据包, 而 `port domain` 将会使 tcpdump 抓取 tcp 协议的 domain 服务数据包, 以及 udp 协议的 domain 数据包。

- `src port [port]`

    如果数据包的源端口为port, 则与此对应的条件表达式为真.

- `port [port]`

    如果数据包的源或目的端口为port, 则与此对应的条件表达式为真.

- `src portrange port1-port2`
  
    如果数据包的源端口属于port1到port2这个端口范围(包括 port1, port2), 则与此对应的条件表达式为真.

- `portrange port1-port2`

    如果数据包的源端口或目的端口属于port1到port2这个端口范围(包括 port1, port2), 则与此对应的条件表达式为真.

以上关于 port 的选项都可以在其前面添加关键字: tcp 或者 udp, 比如: `tcp src port [port]`
这将使 tcpdump 只抓取源端口是 port 的 tcp 数据包。


- `ip proto [protocol]`

    如果数据包为 ipv4 数据包并且其协议类型为 [protocol], 则与此对应的条件表达式为真.

    Protocol 可以是一个数字也可以是名字, 比如: icmp6, igmp, igrp, pim, ah, esp, vrrp, udp, or tcp。
    
    由于 tcp , udp 以及 icmp 是 tcpdump 的关键字,所以在这些协议名字之前必须要用 \ 来进行转义(如果在C-shell 中需要用\\来进行转义)。
    
    注意此表达元不会把数据包中协议头链中所有协议头内容全部打印出来。实际上只会打印指定协议的一些头部信息, 比如
    
    tcpdump -i eth0 'ip proto \tcp and host 192.168.3.144', 则只打印主机 192.168.3.144 发出或接收的数据包中 tcp 协议头所包含的信息。

- `ip6 proto [protocol]`

    如果数据包为 ipv6 数据包并且其协议类型为 [protocol], 则与此对应的条件表达式为真.
    
    注意此表达元不会把数据包中协议头链中所有协议头内容全部打印出来

- `ether broadcast`

    如果数据包是以太网广播数据包, 则与此对应的条件表达式为真. ether 关键字是可选的.

## 表达式实战 - HTTP 示例

1. To monitor HTTP traffic including request and response headers and message body:

    ```
tcpdump -A -s 0 'tcp port 80 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)'
    ```

2. To monitor HTTP traffic including request and response headers and message body from a particular source:

    ```
tcpdump -A -s 0 'src example.com and tcp port 80 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)'
    ```

3. To monitor HTTP traffic including request and response headers and message body from local host to local host:

    ```
tcpdump -A -s 0 'tcp port 80 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)' -i lo
    ```

4. To only include HTTP requests, modify `tcp port 80` to `tcp dst port 80` in above commands

5. Capture TCP packets from local host to local host

    ```
tcpdump -i lo
    ```

6. 如果这台机器上建立的连接非常之多，我们需要限定抓取 本机(192.168.1.200) 上，4000 端口的流量，可以:

    ```
tcpdump -A -s 0 -n '(src host 192.168.1.200 and port 4000) or (dst host 192.168.1.200 and dst port 4000)' 
    ```

7. 如果想抓取来自本机的 curl 请求的流量，则需要声明 `-i lo` 

## _REF

- [Wireshark Charater Filter Generator](https://www.wireshark.org/tools/string-cf.html)
- [Use TCPDUMP to Monitor HTTP Traffic](https://sites.google.com/site/jimmyxu101/testing/use-tcpdump-to-monitor-http-traffic)
- [Linux tcpdump命令详解](https://www.cnblogs.com/ggjucheng/archive/2012/01/14/2322659.html)
- [Tcpdump little book](https://www.bookstack.cn/read/tcpdump-little-book/README.md)

`<<<EOF`
