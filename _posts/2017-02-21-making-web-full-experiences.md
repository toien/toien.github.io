---
layout: post
title: 为移动端 Web 构建全屏体验
excerpt_separator: <!-- more -->
---


[Origin Address](https://developers.google.com/web/fundamentals/native-hardware/fullscreen/)

我们能够很容易地制作具有带入感的全屏体验的网站或者应用程序，正如和 Web 相关的一切事物，我们有好几种途径来实现。
特别是现在越来越多的浏览器支持 “已安装的 Web” 以全屏的方式启动。
<!-- more -->

## 1. 将你的 App 全屏显示

有几种方式可以让用户或者开发者可以做到：

- 通过用户操作来请求浏览器进入全屏模式
- 安装这个 App 到主屏幕
- 伪装：隐藏地址栏

### 1.1 通过用户操作来请求浏览器进入全屏模式

[并不是所有浏览器都一样。](http://caniuse.com/#feat=fullscreen) iOS Safari 不提供全屏 API，但是 Android 上的 
Chrome Firefox，IE11+ 提供。绝大多数 Web 应用会结合使用全屏规范提供的 JS API 和 CSS 选择器。
当你在构建一个全屏应用的时候，主要的关心的 JS API：

{% highlight js %}
element.requestFullscreen() (currently prefixed in Chrome, Firefox, and IE) displays the element in fullscreen mode.
document.exitFullscreen() (currently prefixed in Chrome, Firefox and IE. Firefox uses cancelFullScreen() instead) cancels fullscreen mode.
document.fullscreenElement (currently prefixed in Chrome, Firefox, and IE) returns true if any of the elements are in fullscreen mode.
{% endhighlight %}

> 注意：你可能会注意到在不同的浏览器中的 API 中“fullscreen” s 的大小写可能会不一样。有点尴尬，但这些问题都会在未来的规范中解决掉。

当你的应用启用了全屏模式之后，浏览器提供的 UI 控件将不可用。这改变了用户和应用体验的交互。他们不再能够使用 
“前进”，“后退”，“刷新”。但是提供这些场景非常重要，当进入全屏模式的时候，你可以使用 CSS 选择器来改变展现的方式。

{% highlight html %}
<button id="goFS">Go fullscreen</button>
<script>
  var goFS = document.getElementById("goFS");
  goFS.addEventListener("click", function() {
      document.body.requestFullscreen();
  }, false);
</script>
{% endhighlight %}

以上示例有点不符合现实，因为它隐藏了所有和浏览器种类相关的复杂度。

真实的代码会复杂很多。Mozilla 已经编写了一套非常有用的代码来切换全屏模式。如你所见，对浏览器“敏感”的 API 比规范化的 API 更复杂，冗长。

{% highlight js %}
function toggleFullScreen() {
  var doc = window.document;
  var docEl = doc.documentElement;

  var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
  }
  else {
    cancelFullScreen.call(doc);
  }
}
{% endhighlight %}

Web 开发者讨厌复杂。一个高度抽象的 API 是 Screenfull.js，它整合了以上两种不一致的 JS API 屏蔽了不同的浏览器厂商的不同。

#### 使用全屏 API 建议

##### a. 将 document 置为全屏

<img class="portrait" src="https://developers.google.cn/web/fundamentals/native-hardware/fullscreen/images/body.png" alt="图 1: 将 body 置为全屏">

图 1: 将 body 置为全屏

开发者很自然地想到将 body 置为全屏。但是如果浏览器是 Webkit 或者 Blink 渲染引擎，你将会看到 body 被缩小的奇怪效果。（Mozilla Gecko 是正常的）

<img class="portrait" src="https://developers.google.cn/web/fundamentals/native-hardware/fullscreen/images/document.png" alt="图 1: 将 body 置为全屏">

图 2: 将 document 置为全屏

为了修复这个现象，我们用 document 代替 body 

{% highlight js %}
document.documentElement.requestFullscreen();
{% endhighlight %}

##### b. 将 video 元素置为全屏

将 video 元素置为全屏和其它元素置为全屏的方式一样，调用 video 元素的 `requestFullscreen` 方法即可。

{% highlight html %}
<video id=videoElement></video>
<button id="goFS">Go Fullscreen</button>
<script>
  var goFS = document.getElementById("goFS");
  goFS.addEventListener("click", function() {
      var videoElement = document.getElementById("videoElement");
      videoElement.requestFullscreen();
  }, false);
</script>
{% endhighlight %}

如果你的 video 元素没有定义任何控件属性，那么一旦进入全屏模式，用户就没有方法控制视频的播放。推荐的做法是用一个基础的 container 包住 video 和负责控制它的控件。

{% highlight html %}
<div id="container">
  <video></video>
  <div>
    <button>Play</button>
    <button>Stop</button>
    <button id="goFS">Go fullscreen</button>
  </div>
</div>
<script>
  var goFS = document.getElementById("goFS");
  goFS.addEventListener("click", function() {
      var container = document.getElementById("container");
      container.requestFullscreen();
  }, false);
</script>
{% endhighlight %}

因为你结合 CSS 伪元素选择器与容器元素，这将赋予你更多灵活性。

{% highlight css %}
<style>
  #goFS:-webkit-full-screen #goFS {
    display: none;
  }
  #goFS:-moz-full-screen #goFS {
    display: none;
  }
  #goFS:-ms-fullscreen #goFS {
    display: none;
  }
  #goFS:fullscreen #goFS {
    display: none;
  }
</style>
{% endhighlight %}

通过这种模式，你可以检测是否已经进入全屏模式，并适配你的界面元素。例如：

- 提供返回起始页面的链接
- 提供关闭对话框并返回的机制

## 1.2 手机主屏幕的全屏幕启动

当用户导航到一个页面的时候，以全屏的方式加载这个页面是不可能的。浏览器厂商非常介意以全屏模式加载一个页面，
这太让人讨厌了。所以当进入全屏模式的时候，浏览器首先会获得来自用户的确认。另一方面，厂商们同意用户通过 “install” 
的方式向操作系统发送一个信号来表示用户希望以 “App” 的方式来启动这个页面。

大部分平台上，通过如下所示使用 meta 标签或者 manifest 文件来实现是非常容易的。

### iOS

例如在 iPhone 上，用户能够安装 Web App 至主屏幕并且以全屏的方式启动它们。

{% highlight html %}
<meta name="apple-mobile-web-app-capable" content="yes">
{% endhighlight %}

如果 content 的值设置为 yes，Web 应用将会以全屏的方式启动。默认的行为是以使用 Safari 展示 Web 内容。
你可以通过 window.navigator.standalone 这个只读的 Boolean JS 属性判断一个 Web 页面是否是以全屏的方式启动。

### Chrome for Android

Chrome 团队最近实现当用户把某个 Web 页面添加到主屏幕时，以全屏的方式启动它这一特性。类似于 Safari。

{% highlight html %}
<meta name="mobile-web-app-capable" content="yes">
{% endhighlight %}

你可以为你的 Web App 在手机主屏幕设置一个快捷方式，通过 Android 上 Chrome 菜单中的 “添加到主屏幕” 的以全屏模式启动。
[Google Chrome](https://developers.chrome.com/multidevice/android/installtohomescreen) 

更好的方式是通过使用 Web 应用的 Manifest 属性。

### Web App Manifest (Chrome, Opera, Firefox, Samsung)

Web 应用的 Manifest 文件是一个简单的 JSON 文件，它赋予 Web 开发者控制你的 App 如何在用户期望的地方（例如手机主屏幕）呈现给用户。用户可以启动哪些，更重要的是，如何启动它们。
在未来， manifest 文件将赋予你更多的控制能力，但是现在我们将集中在如何启动它们。

- 告诉浏览器你的 manifest 在哪里
- 在 manifest 中描述如何启动

一旦你创建好了 manifest 文件，并且在你的网站中持有它，你只需要在所有的页面添加一个 link 标签包含它：

{% highlight html %}
<link rel="manifest" href="/manifest.json">
{% endhighlight %}

Android 上 Chrome 在版本 38 之后已经支持。它让你控制你的 Web App 如何在主屏幕上展示以及当用户点击图标的时候如何启动。

一个 manifest 示例文件如下，虽然它还没有完全展示 manifest 的全部属性。

{% highlight json %}
{
  "short_name": "Kinlan's Amaze App",
  "name": "Kinlan's Amazing Application ++",
  "icons": [
    {
      "src": "launcher-icon-4x.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ],
  "start_url": "/index.html",
  "display": "standalone",
  "orientation": "landscape"
}
{% endhighlight %}

这个特性非常满足渐进原则，支持这一特性让你创建一个更好，更持续性的用户体验。

当一个用户添加了你的站点或者应用到主屏幕上时，用户的意图就是把它作为一个 App。这意味着你需要指引用户到你 App 的功能，而不仅仅是加载一个页面。
例如：如果用户需要登陆才能使用你的 App，那么登陆页面是一个不错的选择。

#### 工具类 Apps

大多数工具类的 App 会从这个特性中直接受益。因为这些工具类的 App 你会需要就像手机中其他 App 一样以独立的方式启动。
告诉一个 App 以独立的方式启动，添加 Web App Manifest：

    "display": "standalone"

#### 游戏

大多数工具类的 App 会从这个特性中直接受益。绝大多数游戏希望以全屏的方式启动并且需要强制使用一种方向。

如果你正在开发一款垂直方向的游戏，例如 Flappy Birds，你可能想启用 portrait 模式。

    "display": "fullscreen",
    "orientation": "portrait"

如果你像构造一个迷宫或者想 X-com 的游戏，你可能需要使用 landscape 模式。

    "display": "fullscreen",
    "orientation": "landscape"

#### 新闻站点

新闻网站在大多数情况下是重点在于内容的体验。大多数开发者不会想要添加一个 manifest 文件。它会让你定义启动那个页面以及如何启动。

选择在于你如何看待你的用户喜欢访问你的网站。如果你希望你的站点在 Chrome 中呈现，你可以设置 display 为 browser

    "display": "browser"

如果你希望你的站点感觉上像大多数以新闻为中心的 App 一样被用户对待，移除 Chrome 上所有和 Web 相关的 UI 组件，你可以这样设置。

    "display": "standalone"

## 1.3 伪装，自动隐藏地址栏

你可以通过自动隐藏地址栏伪装成为全屏。

{% highlight js %}
window.scrollTo(0,1);
{% endhighlight %}

> Caution: I am telling you this as a friend. It exists. It is a thing, but it is a hack. Please don't use it. — Paul

这是一种非常简单的方法，页面加载后，浏览器条已经消失了。不幸的是，这不是一种标准的方式，并没有被很好的支持。你可以同样找到一大堆奇怪的方法。

例如，浏览器当回退到某个页面的时候，经常重置它的位置。覆盖 window.scrollTo 是一个可能会令用户懊恼的方法。解决页面最后位置这个问题的时候，
一个方式是将最后的位置存储到 localStorage 中，并且需要处理一些极端情况，比如用户是否在多个窗口打开了同一个页面。

## 2 UX 原则

当你构造一个利用了全屏优势的站点的时候，有一些潜在的用户体验需要你意识到，才能打造一个用户喜欢的产品。

### 2.1 不要依靠导航控件

iOS 在硬件上没有提供一个 “回退” 或者 “刷新” 按钮。但是你必须确定用户可以通过 App 导航，而不被卡死在那里。

你可以在大多数平台上轻易地检测当前是否运行在全屏模式中还是一个通过 "安装" 的模式。

#### iOS

在 iOS 上你可以通过 navigator.standalone Boolean 值来判断当前用户是否从主屏幕上启动。

{% highlight js %}
if(navigator.standalone == true) {
  // My app is installed and therefore fullscreen
}
{% endhighlight %}

#### Web App Manifest (Chrome, Opera, Samsung)

当启动一个已安装的 App 的时候，Chrome 并不是运行在一个真正的全屏环境中，所以 document.fullscreenElement 会返回 null 并且 CSS 选择器不会生效。

当用户在你的站点请求全屏幕时，标准的全屏 API，包括 CSS 伪元素选择器会可用，让你可以动态调整 UI 以响应全屏状态。例如：

{% highlight css %}
selector:-webkit-full-screen {
  display: block; /* displays the element only when in fullscreen */
}

selector {
  display: none; /* hides the element when not in fullscreen mode */
}
{% endhighlight %}

如果用户从主屏幕上启动站点，display-mode 媒体查询属性会被设置成为 Web App mainifest 文件中定义的值。这种纯粹的全屏模式下，将会成为：

{% highlight css %}
@media (display-mode: fullscreen) {

}
{% endhighlight %}

如果用户以 standalone 模式启动 App，display-mode 媒体查询会变为 standalone：

{% highlight css %}
@media (display-mode: standalone) {

}
{% endhighlight %}

#### Firefox

当用户在你的站点请求全屏幕时，标准的全屏 API，包括 CSS 伪元素选择器会可用，让你可以动态调整 UI 以响应全屏状态。例如：

{% highlight css %}
selector:-moz-full-screen {
  display: block; /* hides the element when not in fullscreen mode */
}

selector {
  display: none; /* hides the element when not in fullscreen mode */
}
{% endhighlight %}

#### Internet Explorer

在 IE 中，CSS 伪类选择器缺少一个连字符，其他部分和 Chrome 和 Firefox 类似。

{% highlight css %}
selector:-ms-fullscreen {
  display: block;
}

selector {
  display: none; /* hides the element when not in fullscreen mode */
}
{% endhighlight %}

#### Specification

规范中的拼写规则和 IE 的类似。

{% highlight css %}
selector:fullscreen {
  display: block;
}

selector {
  display: none; /* hides the element when not in fullscreen mode */
}
{% endhighlight %}

### 2.2 让用户保持在全屏体验中

全屏 API 有时候可能会有点娇气。浏览器厂商并不希望把用户所在一个全屏幕的页面中，这样的话他们必须要开发一种打破全屏的机制。
这意味着你不能够构建一个包含好几个不同页面的全屏的站点。

- 通过代码改变地址 window.location = "http://example.com"  会退出全屏
- 用户在页面中点击一个外部的链接会退出全屏
- 通过 navigator.pushState API 改变地址栏也会退出全屏

你可以有两个选择，保持用户在全屏体验中

1. 通过可安装的 Web App 机制进入全屏
1. 通过 #fragment 管理你的 UI 组件和 App 状态

通过使用 # 语法更新 url ，并且监听 window.onhashchange 事件，你可以使用浏览器自己历史管理来管理应用的状态。允许用户使用硬件 “后退” 按钮，或者利用 history API 编写一个简单的
后退按钮，例如：

{% highlight js %}
window.history.go(-1);
{% endhighlight %}

### 让用户选择在何时进入全屏模式

没有比一个网站做出一些意想不到的事情更让用户懊恼的事情了。当一个用户导航到一个网站的时候，不要尝试通过一些小把戏，诱导他们进入全屏模式。

不要拦截一个 touch 事件并且调用 requestFullscreen()

1. 这让人生气。
2. 浏览器在未来也许会检测到这一行为并且提示用户是否允许启动 App 并进入全屏模式。

如果你想以全屏的方式启动应用，考虑在每个平台上使用安装的方式。

### 不要作弊让用户安装你的 App 到主屏幕

如果你打算通过安装的机制提供给用户一个全屏的浏览体验。

- 慎重。使用一个横幅或者页尾的方式让他们知道他们可以安装这个应用。
- 如果他们否定了这个提示，不要再提示。
- 当用户第一次访问你的站点的时候，他们大都不太愿意安装 App 除非他们非常乐意使用你的功能。考虑在一段时间之后再次提示他们安装该应用。
- 如果用户周期性地访问你的站点并且他们没有安装 App ，那么他们以后也不太会安装，不要再骚扰他们。

## 3 总结

当我们还没有完全标准化 API 的实现的时候，你可以使用本文之前提到过的一些指导建议，在不考虑用户的前提下，利用全屏幕的优势容易地构建用户体验。

`<<<EOF`