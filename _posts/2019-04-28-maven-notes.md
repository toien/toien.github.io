---
layout: post
title: Maven 实践笔记
tags: maven
excerpt_separator: <!-- more -->
---

maven 是目前使用最广泛的 java 构建工具。源于构建，又不止于构建。
本文记录笔者在使用 maven 的时候踩过的坑。

<!-- more -->

java 程序编写好之后需要通过编译器编译称为 class 文件，将工程下的 class 文件打成包的形式供外部调用。常见的有 jar 包和 war 包。

上古时期，调用方一般会在自己的工程目录里建一个 lib 目录，用来存放外部的库文件。
随着大量框架快速更新，类库增加，自身业务迭代，这个 lib 目录里的库文件爆炸式增长。
加之 Java 版本在 Oracle 管理下更新迅速，新旧 class 兼容也逐渐凸显。管理依赖成为一个痛点。

由此，引出了 maven 两大核心：构建自动化，依赖配置化。

maven 希望通过统一源码目录规范，形成标准的 java 构建流，开发者在编写完成之后通过 maven 命令完成构建。
而臃肿复杂的依赖库，通过在项目中进行配置即可。

开发者不再自行维护依赖库文件。
maven 工具通过解析配置文件从 maven 仓库中下载对应的库文件到本地，并在构建阶段合并至最终的 jar 包中。

不仅如此，maven 通过各式各样的插件包揽了生成脚手架、依赖检查、编译、打包、入库等流程。
你的代码构建完成之后也可以上传至 maven 的仓库中，被任何一个 Java 开发者所用。

确认 maven 正确安装的方法，在终端运行如下命令：

    ~ mvn --version
    Apache Maven 3.5.0 (ff8f5e7444045639af65f6095c62210b5713f426; 2017-04-04T03:39:06+08:00)
    Maven home: /Users/sherry/soft/apache-maven-3.5.0
    Java version: 1.8.0_131, vendor: Oracle Corporation
    Java home: /Library/Java/JavaVirtualMachines/jdk1.8.0_131.jdk/Contents/Home/jre
    Default locale: zh_CN, platform encoding: UTF-8
    OS name: "mac os x", version: "10.12.6", arch: "x86_64", family: "mac"

## maven 配置

最佳实践：使用 _用户级别_ 而不是 maven 级别的配置。

在 maven 安装好之后，会在当前用户 `profile` 目录下生成一个 `.m2` 目录。里面包含 maven 配置 `settings.xml` 以及本地仓库 repository 。

其中 `settings.xml` 中可以配置各大远程 maven 仓库的地址，而 mirror 节点用于配置镜像，加速 maven 在依赖下载时的速度。

例如：

```xml
<profile>
  <activation>
    <activeByDefault>true</activeByDefault>
  </activation>
  <repositories>
    <repository>
      <id>central</id>
      <name>Maven repository</name>
      <url>http://repo1.maven.org/maven2</url>
      <releases>
        <enabled>true</enabled>
      </releases>
      <snapshots>
        <enabled>true</enabled>
      </snapshots>
    </repository>
  </repositories>
</profile>

  ...

<mirrors>
  <mirror>
    <id>alimaven</id>
    <mirrorOf>central</mirrorOf>
    <name>aliyun maven</name>
    <url>http://maven.aliyun.com/nexus/content/repositories/central/</url>
  </mirror>
</mirrors>
```

## maven-archetype 插件

用于生成项目脚手架。archetype 库目前有超过 1700 种项目脚手架，从最简单的 java 工程到 reactive web 应用。
脚手架减轻开发者在遵从 maven 项目结构时的工作。大多数 IDE 在新建项目时都会选择 archetype 来加速项目创建。

maven-archetype 每次从服务端拉取目前的支持的结构到本地。默认这个文件到路径是在：

    {repository}/archetype-catalog.xml

常用命令：

    # 想更新本地的数据可以运行：
    mvn archetype:crawl

    # 需要创建项目可以：
    mvn archetype:generate 

以交互的形式创建项目。

## maven-dependency 插件

用于查看、分析当前项目的依赖，常用的命令：

    # 以树状图的形式列出档期项目的依赖
    ~ mvn dependency:tree
    [INFO] Scanning for projects...
    [INFO] --- maven-dependency-plugin:3.0.2:tree (default-cli) @ {APP NAME} ---
    [INFO] {GROUP NAME}:{APP NAME}:jar:1.0-SNAPSHOT
    [INFO] +- com.google.guava:guava:jar:21.0:compile
    [INFO] +- org.springframework.boot:spring-boot-starter:jar:2.0.5.RELEASE:compile
    [INFO] |  +- org.springframework.boot:spring-boot:jar:2.0.5.RELEASE:compile
    [INFO] |  |  \- org.springframework:spring-context:jar:5.0.9.RELEASE:compile
    [INFO] |  +- org.springframework.boot:spring-boot-autoconfigure:jar:2.0.5.RELEASE:compile
    [INFO] |  +- org.springframework.boot:spring-boot-starter-logging:jar:2.0.5.RELEASE:compile
    [INFO] |  |  +- org.apache.logging.log4j:log4j-to-slf4j:jar:2.10.0:compile
    [INFO] |  |  |  \- org.apache.logging.log4j:log4j-api:jar:2.10.0:compile
    [INFO] |  |  \- org.slf4j:jul-to-slf4j:jar:1.7.21:compile
    [INFO] |  +- javax.annotation:javax.annotation-api:jar:1.3.2:compile
    [INFO] |  +- org.springframework:spring-core:jar:5.0.9.RELEASE:compile
    [INFO] |  |  \- org.springframework:spring-jcl:jar:5.0.9.RELEASE:compile
    [INFO] |  \- org.yaml:snakeyaml:jar:1.19:runtime
    [INFO] +- org.springframework.boot:spring-boot-starter-web:jar:2.0.5.RELEASE:compile

    # 分析依赖，主要查看: 1.已使用但是未声明的依赖, 2.未使用但已声明的依赖
    ~ mvn dependency:analyze
    [INFO] --- maven-dependency-plugin:3.0.2:analyze (default-cli) @ {APP NAME} ---
    [WARNING] Used undeclared dependencies found:
    [WARNING]    org.springframework:spring-test:jar:5.0.9.RELEASE:test
    [WARNING]    org.springframework.boot:spring-boot-test:jar:2.0.5.RELEASE:test
    [WARNING]    org.springframework.boot:spring-boot:jar:2.0.5.RELEASE:compile
    [WARNING]    org.springframework:spring-beans:jar:5.0.9.RELEASE:compile
    [WARNING]    org.springframework.boot:spring-boot-autoconfigure:jar:2.0.5.RELEASE:compile
    [WARNING]    com.fasterxml.jackson.core:jackson-databind:jar:2.9.6:compile
    [WARNING]    org.apache.tomcat.embed:tomcat-embed-core:jar:8.5.34:compile
    [WARNING]    org.springframework:spring-jcl:jar:5.0.9.RELEASE:compile
    [WARNING]    org.springframework:spring-web:jar:5.0.9.RELEASE:compile
    [WARNING]    org.springframework:spring-core:jar:5.0.9.RELEASE:compile
    [WARNING]    javax.annotation:javax.annotation-api:jar:1.3.2:compile
    [WARNING]    com.fasterxml.jackson.datatype:jackson-datatype-jsr310:jar:2.9.6:compile
    [WARNING]    org.springframework:spring-context:jar:5.0.9.RELEASE:compile
    [WARNING]    org.mybatis:mybatis-spring:jar:2.0.1:compile
    [WARNING]    com.fasterxml.jackson.core:jackson-core:jar:2.9.6:compile
    [WARNING]    org.springframework:spring-webmvc:jar:5.0.9.RELEASE:compile
    [WARNING]    com.fasterxml.jackson.core:jackson-annotations:jar:2.9.0:compile
    [WARNING]    org.mybatis:mybatis:jar:3.5.1:compile
    [WARNING]    junit:junit:jar:4.12:test
    [WARNING]    org.springframework:spring-jdbc:jar:5.0.9.RELEASE:compile
    [WARNING] Unused declared dependencies found:
    [WARNING]    org.springframework.boot:spring-boot-starter:jar:2.0.5.RELEASE:compile
    [WARNING]    org.springframework.boot:spring-boot-starter-web:jar:2.0.5.RELEASE:compile
    [WARNING]    org.springframework.boot:spring-boot-starter-tomcat:jar:2.0.5.RELEASE:compile
    [WARNING]    org.springframework.boot:spring-boot-starter-test:jar:2.0.5.RELEASE:test

然鹅，经过测试，发现插件并不能很好地理解 __传递依赖__ 。

比如上述文件中，插件认为 `spring-boot-starter-web` 是无用的依赖，而使用到的依赖 `org.springframework:spring-web:jar:5.0.9` 缺少声明，其实不然。

由于本项目依赖了 `starter-web`，而 `starter-web` 依赖了 `spring-web`，我们的才能使用 `spring-web` 中的 api。

可见，analyze 的结果只能做个参考。

## dependencies vs dependencyManagement

`<dependencyMangement>` 用来加强和集中控制所有子项目的依赖。在 `<dependencyManagement>` 中声明的依赖并不会被包含在项目的 target 目录。

在 `<dependencies>` 中声明的构件(artifacts) 一定会被包含在自模块中。

而在 `<dependencyManagement>` 中声明的构件，只有当子模块在 `<dependencies>` 中声明之后才会被包含进去。我们可以在 parent 模块中使用 `<dependencyManagement>` 来统一管理依赖的版本，而在自模块中只需要在 `<dependencies>` 中引入即可，无需指定版本。

为什么需要版本控制？在稍复杂的项目中，我们可能会遇到不同某块依赖不同类库的不同版本，同一个限定名的 class 存在两种版本，JVM 已定会报错。

我们需要统一依赖的版本，最大限度地保证兼容性。

说起来，反而是 npm 的依赖方式更简单，`node_modules` 下的模块依赖的是自己的 `node_modules` 的内容。

但是，虽然各自模块隔离(隐藏)自己的依赖，不会互相影响，也导致了项目里 `node_modules` 往往巨大无比的问题。

`<<<EOF`