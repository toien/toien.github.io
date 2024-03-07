---
layout: post
title: Maven &amp; Gradle 依赖作用域
tags: maven gradle
excerpt_separator: <!-- more -->
---

Maven 和 Gradle 是目前 Java(JVM) 项目中比较主流的构建工具，今天我们来聊一下他们各自如何管理依赖的作用域。

正确地理解依赖作用域对于我们开发出简洁、轻量的程序很有帮助。

<!-- more -->

在开始讲依赖作用域之前，我们先回忆一下 Java 的开发过程。

我们编写的代码，需要经过**编译**，变成字节码，然后以 jar 的形式交给 jvm 去**运行**。

所以，依赖作用域配置主要影响它在两个地方出现，一个是编译期(compile time)，一个是运行期(runtime)。

## Maven Dependency Scope

Maven 的作用域比较直接，直接在 dependency 元素下声明 scope 即可。

```xml
<dependency>
  <groupId>com.alibaba</groupId>
  <artifactId>fastjson</artifactId>
  <version>1.17.25</version>
  <scope>compile</scope>
</dependency>
```

默认如果不配置，则是 `compile`.

### `compile`

即在编译环节就需要引入的依赖，如果应用最终会打成 uber jar，那么这些依赖都会被打包到 uber jar 中。
这也是 maven 里用得最多的作用域。

### `provided` & `runtime`

这俩兄弟有一个共同的特点，就是不会把依赖带到 uber jar 中。

区别是: 声明为 `provided` 的依赖，Maven 会加入到编译期的 classpath 中，而 `runtime` 则不会。举个栗子:

比如我们做的是一个 web 项目，最终会部署到 ecs 上的 tomcat 容器里运行，那么项目里声明的 servlet-api 依赖，应该是 provided: 

```xml
<dependency>
  <groupId>javax.servlet</groupId>
  <artifactId>javax.servlet-api</artifactId>
  <version>4.0.1</version>
  <scope>provided</scope>
</dependency>
```

为什么？程序在运行期，servlet-api 由容器统一管理，不需要单独打包到应用的 jar 包里。而我们在开发阶段，在编译期，开发功能时需要实现 servlet-api 相关的接口(import servlet-api 的类)，所以需要它在 classpath 上才能通过编译。

而 runtime 是彻底将依赖和应用 *"断绝关系"* ，编译期无法感知到它的存在，运行期由容器动态提供。一个例子是 slf4j:

项目在使用 slf4j 的时候，在编译期只需要引入 slf4j-api, 在程序运行期由具体的 classpath 上的 binding jar 来决定是使用 log4j or logback。

```xml
<dependency>
  <groupId>org.slf4j</groupId>
  <artifactId>slf4j-api</artifactId>
  <scope>compile</scope>
</dependency>
<dependency>
  <groupId>org.apache.logging.log4j</groupId>
  <artifactId>log4j-core</artifactId>
  <scope>runtime</scope>
</dependency>
<dependency>
  <groupId>org.apache.logging.log4j</groupId>
  <artifactId>log4j-slf4j2-impl</artifactId>
  <scope>runtime</scope>
</dependency>
```

### `import`

这是一个特殊的 scope，只能应用在 type 为 pom 的依赖上，很简单，把该 pom 的 `dependencyManagement` 内容引入到当前的项目。

但是，为了减少外部依赖对项目的影响，建议尽量少使用。

为什么这么说呢？可以试想一下，假如我 import 的 pom 依赖中有某个 jar 的版本是 A，但是项目的传递依赖的版本是 B。就导致冲突了。

而往往 import 的 pom 中包含很多依赖，所以非常容易导致冲突。

### `test`

被声明为 test 的依赖只出现在 test classpath 上。

## Gradle

Gradle 首先明确出 `compileClasspath` 和 `runtimeClasspath` 两个概念。

可以这个命令查看依赖树的情况:

```
> ./gradlew dependencies
```

Gradle 的 dependency scope 除了影响依赖是否加入到对应的 classpath 中，还会决定是否将依赖暴露给第三方，这个特性为 lib 开发带来了方便。

Scope | When available | Leaks to consumer
------------- | -------------- | -----------------
implementation | compiletime + runtime | runtime
api | compiletime + runtime | compiletime + runtime
compiletimeOnly | compiletime | -
runtimeOnly | runtime | runtime

> 注: 这里的 consumer 是指 jar 包的消费者，也就是 jar 包的使用方。

回到刚才 Maven 的例子:

- 如果是 servlet-api，在 Gradle 中对应的是 `compiletimeOnly`。
- 如果是 slf4j, 对于 slf4j-api 我们需要声明为 `implemtation`(或者 api)，而 binding jar: log4j 或者 logback 则需要声明为 `runtimeOnly`。

除此之外，Gradle 还提供了 `testApi`, `testImplemention` 选项用于控制 test 依赖是否暴露给 consumer。

`<<<EOF`
