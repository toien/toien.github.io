---
layout: post
title: 10 分钟掌握 JSONP
tags: JSONP HTTP Java jQuery
excerpt_separator: <!-- more -->
---


跨域请求一直困扰着不少开发者，随着业务的复杂成都提升，不免会与外部系统产生调用，
常规的做法可以是在前端 JSONP 调用，或者让同域的服务端做接口代理。

其实想想，两者都需要服务端支持，不是么？

<!-- more -->
### JSONP：JSON with Padding.

为啥叫 padding？ 浏览器发送 JSONP 请求时会 padding 上一个 callback 函数的名字，服务端接受这个 callback 并将数据 padding 到其中。

想想 css 中的 padding，JSONP 不也就是把真正的数据放在一个带 padding 的 box 中么。

### 原理

在 html 中虽然不允许存在跨域的 ajax 请求，但是却可以标签的形式跨域获取服务端的资源。常见的 `<script>`, `<link>`, `<img>` 都可以请求其它站点的资源。

所以，只要服务端返回的是一段可执行代码，并且将数据封装在其中，那么就跟前面的 `<script>` 标签一样，既满足跨域请求的安全规则，又实现了业务接口调用。

### JSONP 的限制

JSONP 并不是多么高端的黑魔法，请把它当成一个 `<script>` 标签和浏览器端的 `eval` 调用，所以它的限制也是如此明显：

1. 只允许 GET 请求
2. 要求存在一个全局函数供 `eval` 调用，否则即使请求成功，浏览器也会认为调用出现异常。

### 最小化 JSONP 的限制

1. 如果一定要用除 GET 之外的 HTTP 请求方法，请强烈考虑服务端代理。

    > 附上 [跨域 POST 请求的解决方案](http://ajaxian.com/archives/how-to-make-xmlhttprequest-calls-to-another-server-in-your-domain)（刁钻，难以维护，且已大于10分钟）

2. 试想如果你页面上的 JSONP 请求会有很多很多，那么你为此准备的 JS 全局函数是不是也会有很多很多。
    
    解决方式是使用一个什么都不做的 `noop function`， 然后使用 jQuery Deferred Object 属性，通过 `.done` 的方式来处理各种 JSONP 请求

### 是时候看代码了

#### 前端使用 jQuery ： 

{% highlight js %}
var jsonpCallback = $.noop;
  
function getJsonP2() {
  $.ajax({
    url : "http://localhost:8080/discover-spring/jsonp/hello2",
    type : "GET",
    contentType : "application/json;chaset=UTF-8",
    data : {
      "name" : "hello"
    },
    jsonpCallback: "jsonpCallback", 
    // jQuery 默认情况下为你生成的 callback 函数数的名字是随机的，这就没法使用第二条优化了
    dataType : "jsonp"
  }).done(function(resp) {
    debugger
  }).error(function(resp) {
    debugger
  });
}
{% endhighlight %}

如果同域的请求任然使用 JSONP 作为 `dataType` 会如何呢？

#### 服务端 Spring MVC：

{% highlight java %}
@RequestMapping(value = "hello2", method = RequestMethod.GET)
public String hello2(@RequestParam String callback, 
    HttpServletRequest request, HttpServletResponse response) {

  Map<String, Object> result = new HashMap<String, Object>();

  result.put("id", 1L);
  result.put("name", "Toien");
  result.put("age", 11);

  response.setHeader("Content-Type", "text/javascript");

  String serialized = null;
  try {
    // 将数据序列化成 JSON 格式
    serialized = this.mapper.writeValueAsString(result); 
  } catch (JsonProcessingException e) {
    e.printStackTrace();
  }
  
  return callback + "(" + serialized + ")";
}
{% endhighlight %}

#### 看看结果

前端已经可以顺利得到服务端返回的 JSONP 数据了，就像 ajax 请求一样

<p class="text-center">
  <img src="/public/img/posts/get-jsonp-in-chrome.png">
</p>

<br>

### 参考资料

* [JSONP](https://zh.wikipedia.org/wiki/JSONP)
* [说说JSON和JSONP，也许你会豁然开朗，含jQuery用例](http://www.cnblogs.com/dowinning/archive/2012/04/19/json-jsonp-jquery.html)

`<<<EOF`