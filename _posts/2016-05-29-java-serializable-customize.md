---
layout: post
title: Java Serializable 定制
tags: Java Serialize 序列化
excerpt_separator: <!-- more -->
---

接着 [上文](/2016/05/29/java-serializable-basics/) 说到的变更问题。
如果 User 在后来的某一个时间又发生了改变，比如你认为把 age 属性改为 birthday 更科学。
但是由于之前的版本已经在线上运行了一段时间，磁盘上的所有 .ser 文件中并没有保存 birthday 而是 age，
那么代码修改之后，虽然用 serialVersionUID 向前兼容了，
但是通过 Java 默认的 readObject 并不能将 age 转换为 birthday ，so 让我们定制一下吧。
<!-- more -->

### writeObject && readObject

如果希望由自己完成整个序列化，可以在类上声明该方法并实现

{% highlight java %}
private void writeObject(java.io.ObjectOutputStream out)
     throws IOException
{% endhighlight %}

反序列化同理：

{% highlight java %}
private void readObject(java.io.ObjectInputStream in)
   throws IOException, ClassNotFoundException;
{% endhighlight %}

测试一下：

CustomizedUser.java

{% highlight java %}
public class CustomizedUser implements Serializable {
  private void readObject(ObjectInputStream in) throws IOException, 
    ClassNotFoundException {
    this.id = in.readInt();
    this.nickname = in.readUTF();
    this.password = in.readUTF();
    this.birthday = (LocalDate) in.readObject();
  }

  private void writeObject(ObjectOutputStream out) throws IOException {
    out.writeInt(id);
    out.writeUTF(nickname);
    out.writeUTF(password);
    out.writeObject(birthday);
  }
  ...

  public static void main(String[] args) throws IOException, 
    ClassNotFoundException {
    CustomizedUser u = new CustomizedUser();

     u.id = 1;
     u.nickname = "zhangsan";
     u.password = "123";
     u.birthday = LocalDate.of(1990, 9, 12);
     u.gender = 1;
    
     u.serialize("cuser.1.ser");

    u.deserialize("cuser.1.ser");
    System.out.println(u);
  }
}
{% endhighlight %}

输出：

<pre>{ id:1, nickname:zhangsan, password:123, age:26 }</pre>

但是，自定义整个序列化方案并不能太好地兼容老的代码，Java 随之又提出了新的解决方式。

### writeReplace && readResolve

也就是说，在序列化和反序列化的过程中增加一层。例如 Web 前端和服务端交互的数据结构往往是 Data Transfer Object（Value Object），而在这些 JSON 和数据库表之间，还有一层称为 Persistent Object 的对象存在。

writeReplace 和 readResolve 方法的返回值就充当了这一层角色。

{% highlight java %}
public class AlternativeUser implements Serializable {
  ...  
  private Object writeReplace() throws ObjectStreamException {
    
    return new UserSerializer(this);
  }

  public static void main(String[] args) throws IOException, 
    ClassNotFoundException {
    AlternativeUser u = new AlternativeUser();

    u.id = 1;
    u.nickname = "zhangsan";
    u.password = "123";
    u.age = 5;
    u.gender = 1;
    
    u.serialize("aluser.ser");

    u.deserialize("aluser.ser");
    System.out.println(u);
  }
  ... 
}

class UserSerializer extends HashMap<String, Object> {
  private static final long serialVersionUID = 1L;

  UserSerializer(AlternativeUser au) {
    this.put("id", au.id);
    this.put("nickname", au.nickname);
    this.put("password", au.password);
    this.put("age", au.age);
    this.put("gender", au.gender);
  }

  private Object readResolve() throws ObjectStreamException {

    AlternativeUser au = new AlternativeUser();
    
    au.id = (int) this.get("id");
    au.nickname = (String) this.get("nickname");
    au.password = (String) this.get("password");
    au.age = (int) this.get("age");
    au.gender = (byte) this.get("gender");
    
    return au;
  }
}
{% endhighlight %}

最后输出的结果如下：

<pre>{ id:1, nickname:zhangsan, password:123, age:5, gender:1 }</pre>

UserSerializer 看起来使用比较奇怪，这是因为 readResolve 方法没有提供直接访问 readObject 方法返回值的方式，导致我们不得不在另外一个类中使用它。

然后，回到我们之前的兼容性问题，在 UserSerializer.readResolve 方法中我们终于可以通过判断 map 中是否存在对应的 field 来初始化反序列化的返回值。

到目前，我们已经做到了版本兼容，实现的方式就是：

1. 增加一层 Serialize Object。
1. 饶一个弯，在代理中使用 readResolve 而不是类本身。

<br>

### 参考资料

* [java.io.Serializable](http://docs.oracle.com/javase/8/docs/api/java/io/Serializable.html)
* [5 things you didn't know about ... Java Object Serialization](http://www.ibm.com/developerworks/library/j-5things1/)
* [Java Object Serialization Specification](https://docs.oracle.com/javase/8/docs/platform/serialization/spec/serial-arch.html)
* [《深入理解Java7 - 成富》](https://read.douban.com/ebook/15162299/)

`<<<EOF`