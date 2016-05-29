---
layout: post
title: Java Serializable 基本使用
excerpt_separator: <!-- more -->
---


Java 程序运行的过程中，所有的对象都在内存中，一旦程序重启之后，对象将全部丢失。常见的持久化策略有：XML，JSON，数据库，还有 Java 自带的序列化。
<!-- more -->

### Serializable Interface

想要使用这个 built-in 特性，必须在类声明的时候 `implements Serializable` 接口。这是一个标记接口，不用实现任何具体的方法，只是为了告诉 JVM ：这个类你可以帮我序列化。如果尝试序列化一个没有声明该接口的类，会抛出 `java.io.NotSerializableException` 异常。

另外，实现了该接口之后，可以声明一个序列化版本 ID 用来控制序列化向前兼容，在后面详细讨论。

### 基本使用

User.java

{% highlight java %}
public class User implements Serializable {

  int id;
  String nickname;
  String password;

  int age;

  @Override
  public String toString() {
    return String.format("{ id:%d, nickname:%s, password:%s, age:%d }",
      id, nickname, password, age);
  }

  public void serialize(String fileName) throws IOException {
    Path p = Paths.get("sers", fileName);
    File f = p.toFile();

    f.createNewFile();

    try (FileOutputStream fos = new FileOutputStream(f);
        ObjectOutputStream oos = new ObjectOutputStream(fos)) {
      oos.writeObject(this);
    }
  }

  public void deserialize(String fileName) throws IOException,
    ClassNotFoundException {
    Path p = Paths.get("sers", fileName);
    File f = p.toFile();

    FileInputStream fis = new FileInputStream(f);
    try (ObjectInputStream ois = new ObjectInputStream(fis)) {
      User readed = (User) ois.readObject();

      this.id = readed.id;
      this.nickname = readed.nickname;
      this.password = readed.password;
      
      this.age = readed.age;
    }
  }
 
  public static void main(String[] args) throws IOException, 
    ClassNotFoundException {
    User u = new User();

    u.id = 1;
    u.nickname = "zhangsan";
    u.password = "123";
    u.age = 5;

    // 序列化
    u.serialize("user.ser");

    // 反序列化
    u.deserialize("user.ser");

    System.out.println(u);
  }
}
{% endhighlight %}

### 向前兼容

试想：如果有一天，你发现用户只有这些属性还不够，比如需要增加一个 gender 属性表示用户的性别。所以你增加了如下 gender 属性，并且修改 `deserialize` 方法，在反化时一并设置：

{% highlight java %}
public class User implements Serializable {
  ...
  byte gender = 0;
  ...

  public void deserialize(String fileName) throws IOException, 
    ClassNotFoundException {
    ...
    try (ObjectInputStream ois = new ObjectInputStream(fis)) {
      User readed = (User) ois.readObject();

      this.id = readed.id;
      ...
      this.gender = readed.gender;
    }
  }
  ...
}
{% endhighlight %}

看似不起眼的改动，如果此时我们尝试 deserialize 一个没有 gender 属性的 User，会得到如下异常：`java.io.InvalidClassException`。原因就是：如果你没有指定序列化版本，那么 Java 会根据对象的持久化内容生成一个，在反序列化时，如果两个 versionUID 不一致，则会抛出异常。

显式指定 versionUID 可以解决这个问题，在类声明之后加上如下语句：

{% highlight java %}
public class User implements Serializable {
  private static final long serialVersionUID = 1L;
  ...
{% endhighlight %}

注意 private 修饰符表示不同的类可以使用相同的 UID，它们并不会相互影响。

增加 serialVersionUID 之后，重新序列化，增加 gender 属性，反序列化，正常。

`<<<EOF`