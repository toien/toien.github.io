---
layout: post
title: Apache HttpComponents 实践
tags: http client
excerpt_separator: <!-- more -->
---

作为老牌 java http 组件，http-client 提供了丰富的策略，hook，配置以支持广泛的 http 调用需求。
本文以 HttpClient 4.5 为例，就超时、链接池、以及调试做实践小结。

<!-- more -->

### 1. core flow

`HttpClient` 是核心接口，因 HTTP 协议的 "请求-响应" 交互规则，我们发起一次请求，在代码中体现为:

```java
// 1. 构造 request
HttpUriRequest reqeust = buildRequest(); 

// 2. 利用 client 执行 request
HttpClient client = buildHttpClient();

// 3. 解析响应数据
HttpResponse response = client.execute(request);
```

其中 `HttpUriRequest` 又根据 HTTP 请求方法的不同分为 HttpGet, HttpPost, HttpPut 等等。

核心接口 HttpClient 因职责重大，配置复杂，一般来说，以单例的形式出现在我们的应用里。其常用的实现类 `InternalHttpClient`，它的属性包含:

```java
// 执行调用链，在 httpClient 内部通过一条执行链，解耦代理、路由、回调等
private final ClientExecChain execChain;    
// TCP 链接管理
private final HttpClientConnectionManager connManager;
// 路由管理
private final HttpRoutePlanner routePlanner;
// cookie 管理
private final Lookup<CookieSpecProvider> cookieSpecRegistry;
// auth 管理
private final Lookup<AuthSchemeProvider> authSchemeRegistry;
// cookie 存储
private final CookieStore cookieStore;
// 信任管理，和鉴权系统的交互
private final CredentialsProvider credentialsProvider;
// 默认的请求配置
private final RequestConfig defaultConfig;
// close 回调
private final List<Closeable> closeables;
```

通过以上拆分，把 client 的功能拆到不同的组件上。接下来看 `RequestConfig` 类：

### 2. timeouts

```java
private final boolean expectContinueEnabled;
private final HttpHost proxy;
private final InetAddress localAddress;
private final boolean staleConnectionCheckEnabled;
private final String cookieSpec;
private final boolean redirectsEnabled;
private final boolean relativeRedirectsAllowed;
private final boolean circularRedirectsAllowed;
private final int maxRedirects;
private final boolean authenticationEnabled;
private final Collection<String> targetPreferredAuthSchemes;
private final Collection<String> proxyPreferredAuthSchemes;
// 从 ConnectionManager 获取 Connection 超时
private final int connectionRequestTimeout;
// socket connect 超时
private final int connectTimeout;
// socket 超时
private final int socketTimeout;
private final boolean decompressionEnabled;
```

非常多，不要泄气，先抛开其它配置，我们只看 timeout。所有的 timeout 的单位都是毫秒，默认是 -1，表示可以**无限**等待。

试想你的服务依赖某个 http 上游服务，在某一天，它很不幸地挂了，而你的服务因为默认超时为 -1，处理请求的线程只会傻傻地等在那里，你的服务将在很快的时间内彻底 hang 住。

### 3. pool

HTTP 是应用层的协议，依赖传输层 TCP 建立长链接；而建立链接是一件耗时的事情，为了能复用链接，HTTP1.1 推出了 `Connection`、`Keep-Alive` 头。

http-client 会在实际执行链中根据这些头信息来判断是否应该关闭链接，你也可以通过配置 [KeepAliveStrategy](http://hc.apache.org/httpcomponents-client-4.5.x/tutorial/html/connmgmt.html#d5e425)，
忽略服务端返回的 header。

链接池做法是：请求完成后，并不 close 链接，而是把它放到池中，在下次请求时复用。
这是一种非常通用的技术，数据库客户端、缓存客户端、都用得上。

#### 3.1 time to live

链接长时间存活并不是一件好事，因为绝大多数服务器会设置过期时间，由于客户端没有正确释放，就会进入 CLOSE_WAIT 状态。

这是一种单方面关闭状态，长时间处于这种状态既是资源浪费，也占用池的空间。

类 `PoolingHttpClientConnectionManager` 提供多个重载构造参数，推荐使用：

```java
PoolingHttpClientConnectionManager connManager = new PoolingHttpClientConnectionManager(180, TimeUnit.SECONDS);
```

两个参数分别是 long timeToLive, TimeUnit timeUnit。
ttl + unit 给予链接存活时间，时间一到，链接进入被动[^1] expire 状态，等待着被清理。

但是清理的活儿 http-client 并不会帮你干，需要你起一个定时任务[自己完成](http://hc.apache.org/httpcomponents-client-4.5.x/tutorial/html/connmgmt.html#d5e418)。

#### 3.2 validate

除了存活时间，http-client 的链接还可以用 validate 方法判断是否有效，有两种途径：

1. 通过设置 `RequestConfig.staleConnectionCheckEnabled`
   
   在请求发起时，判断链接是否 stale，如果是，就会先 close，然后重新 establish，
   [注释](https://hc.apache.org/httpcomponents-client-4.5.x/httpclient/apidocs/org/apache/http/client/config/RequestConfig.html#isStaleConnectionCheckEnabled())
   中提到这种策略会导致每次请求增加至多 30ms 的耗时，而且已经 @deprecated 被第二种替代

2. 通过设置 `PoolingHttpClientConnectionManager.setValidateAfterInactivity`，默认 2 秒

   它的原理是每次使用链接后设置一个 expiry 时间，如果从 pool 获取一个链接的时候，发现这个链接的已经过期，就会释放这个链接。
   这样既保证从 pool 中获取的链接都是可用的，也可以减少检查的次数。

#### 3.3 plan & max

最后，我们设置 pool 的大小及路由规划：

```java
// Increase max total connection to 200
connManager.setMaxTotal(20);
// Increase default max connection per route to 20
connManager.setDefaultMaxPerRoute(10);
```

池内的链接分配是基于 route 的，不同的 route 不会复用链接。
代理、隧道、域名、端口，这些都是 route 的构成因素。

至此，一个带超时，池化管理的 http-client 已经构造完成。

### 4. 调试

除了在程序中设置断点，我们可以看看机器上打开的 TCP 链接状态，这在检查链接是否正确释放时很有必要。

    > netstat -atn | grep [port]

也可以设置 http 代理软件，看看我们发出的请求内容是否正确

## _ REFs

- [Apache HttpCompoents Tourials](http://hc.apache.org/httpcomponents-client-4.5.x/tutorial/html/index.html)

`<<<EOF`

[^1]: 说 "被动" 是因为需要调用 `PoolEntry.isExpired` 才会知道它已经过期
