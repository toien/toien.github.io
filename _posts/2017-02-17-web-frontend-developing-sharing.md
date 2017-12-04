---
layout: post
title: 前端工作心得
excerpt_separator: <!-- more -->
---


web 前端这十年经历了爆炸式的生长、进化、演进。

从一开始简单处理用户交互到 HTML、CSS、JS 分离，移动端突起随之而来的响应式布局，前端 MVX 框架、Modular 标准和工具出现、NodeJS 在服务端占据一席之地。

前端初学者一开始可能会迷茫，从何学起？本文简单梳理了笔者在工作中接触的前端技术的各个板块。
<!-- more -->

### Base：

通过优秀的书籍，结构化的学习 base 知识点：《JavaScript权威指南》，包括 CSS3，H5 的规范和使用，语义化标签。

HTTP 协议，Chrome Network 瀑布图的背后是什么，优化原则，缓存协议，GET POST HEAD PUT，RESTful，

客户端存储：Cookie 不仅仅是 key-value 键值对，还有一堆额外的属性，LocalStorage，SessionStorage，

### Framework：

熟练使用 JS 框架：jQuery

熟练使用 CSS 框架: Bootstrap，这两样东西目前绝大部分公司都在用，需要细腻深入的学习，特别是 jQuery。

### App:

粗犷地学习下一代 Web App 架构和框架，React / RIOT，VueJS，Angular

这些号称要统治下一代 Web 应用的构建工具，多 coding，写 demo，重在感觉，体会他的设计思想。

有些元老级的 Lib 并没有那么知名，但是直接地解决实际的问题，并且非常轻量级。前端的圈子很浮躁，尽可能地打好底子，多思考，自己判断。

### Modular：

模块化需要透彻理解。前端的蛮荒时代已经过去了，越来越多的 SPA。复杂的业务和友好的用户体验一定会需要模块化来支撑。

规范：CMD & AMD

模块管理 Lib：seajs，requirejs，（还有一个远古的 labjs）

### 构建：
目前 node 生态占绝大部分。

简单的可以用 gulp，上手快，过程直观，方便扩展。

webpack 后来居上，团队很牛，可以多看看，现在 webpack 2 已经发布了正式版，很有潜力。

### Node & ES6:

构建工具都是 node 写的。而目前 js 应用在服务端也越来越多，用空可以研究研究：Express，KOA。

ES 6 开放了很多新特性，这不完全是方向， BABEL 的出现让 ES6 越来越多地加入到工程中应用。

### Chrome：

所有的代码都是 run 在浏览器中，Chrome 开发者工具提供了非常丰富的特性: Elements, Network(HTTP), Source, Console, Application, Audit, Profile...

每一个面板都可以展开成一本书，熟悉越多，就意味着你掌握越多。

### Server & Linux：

熟悉服务器和命令行不仅能让你应付开发，测试环境的搭建，在发布上线，操作线上服务器的时候也 hold 住。

相较于早期的 Apache，Nginx 更轻量，更简单，无论是作为静态资源部署、负载均衡、还是缓存控制都绰绰有余。

`<<<EOF`