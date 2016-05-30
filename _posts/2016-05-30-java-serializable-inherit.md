---
layout: post
title: Java Serializable 继承
excerpt_separator: <!-- more -->
---


让我们来看一个稍微复杂一点的的场景。在实际开发的过程中， extends 和 implements 都是比较常见的，那么 Serialization 的表现又如何呢？
<!-- more -->

### AdvancedUser

我们构造一个高级用户，它将继承 [基础篇](/2016/05/29/java-serializable-basics/) 的 User 

{% highlight java %}
public class AdvancedUser extends User {

  private static final long serialVersionUID = 1L;

  String[] perms;

  @Override
  public String toString() {
    return String.format("{ id:%d, nickname:%s, password:%s, age:%d, gender:%d, perms:%s }",
       id, nickname, password, age, gender, perms == null ? "[]" : Arrays.asList(perms));
  }

  public void deserialize(String fileName) throws IOException, 
    ClassNotFoundException {
    Path p = Paths.get("sers", fileName);
    File f = p.toFile();

    FileInputStream fis = new FileInputStream(f);
    try (ObjectInputStream ois = new ObjectInputStream(fis)) {
      AdvancedUser readed = (AdvancedUser) ois.readObject();

      this.id = readed.id;
      this.nickname = readed.nickname;
      this.password = readed.password;
      
      this.age = readed.age;
      this.gender = readed.gender;
      
      this.perms = readed.perms;
    }
  }

  public static void main(String[] args) throws ClassNotFoundException, 
    IOException {
    AdvancedUser ad = new AdvancedUser();
    
    ad.id = 2;
    ad.nickname = "li4";
    ad.password = "456";
    ad.age = 2;
    ad.gender = 2;
    
    ad.perms = new String[] {"1", "2", "3"};
    
    ad.serialize("aduser.ser");
    
    ad.deserialize("aduser.ser");
    
    System.out.println(ad);
  }
}
{% endhighlight %}

除了添加了额外的 perms 属性之外， AdvancedUser 还将拥有自己的 `deserialize` 方法，主要是为了能解析 `readObject` 返回的额外属性。运行 main 方法查看结果

<pre>{ id:2, nickname:li4, password:456, age:2, gender:2, perms:[1, 2, 3] }</pre>

可以看出 Serializable 接口和其他接口无异，对子类同样有效。现在，我们来对换下角色，把 Serializable 交给子类来实现看看会发生什么。

### DumbUser & NonDumbUser

NonDumbUser.java

{% highlight java %}
class DumbUser {
  int id;
  String nickname;
  String password;
  
  @Override
  public String toString() {
    return String.format("{ id:%d, nickname:%s, password:%s }",
      id, nickname, password);
  }
}

public class NonDumbUser extends DumbUser implements Serializable {
  
  private static final long serialVersionUID = 1L;
  
  String words;
  
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
      NonDumbUser readed = (NonDumbUser) ois.readObject();

      this.id = readed.id;
      this.nickname = readed.nickname;
      this.password = readed.password;
      this.words = readed.words;
    }
  }
  
  @Override
  public String toString() {
    return String.format("{ id:%d, nickname:%s, password:%s, words:%s }", 
      id, nickname, password, words);
  }
  
  public static void main(String[] args) throws IOException, 
    ClassNotFoundException {
    NonDumbUser u = new NonDumbUser();
    u.id = 1;
    u.nickname = "Lee";
    u.password = "123";
    u.words = "imcool";
    // 序列化
    u.serialize("inher.user.ser");
    // 反序列化
    u.deserialize("inher.user.ser");
    
    System.out.println(u);
  }
}
{% endhighlight %}

得到结果：

<pre>{ id:0, nickname:null, password:null, words:imcool }</pre>

Oops，由于父类并没有实现 Serializable 接口，导致父类的数据在序列化的过程中丢失了。因此我们得到一条最佳实践原则：尽可能在父类上实现 Serializable 接口，在各个子类中去定制序列化。

顺带一提，由于 serialVersionUID 是 private 的，所以每个子类都需要显示的声明各自的 versionUID 以保证兼容性。

### readObjectNoData

这个接口的使用，文档上描述得比较晦涩：

> For serializable objects, the readObjectNoData method allows a class to control the initialization of its own fields in the event that a subclass instance is deserialized and the serialization stream does not list the class in question as a superclass of the deserialized object.

翻译过来，简单地说就是在反序列化的时候控制域的初始化，有点像 Class 构造一实例的时候的“清理”工作。还有就是在一个极端的情况下：例如有 Animal 和 Cat 两个类，原本一开始的时候这两个类是独立的，并没有继承关系。

Cat.java

{% highlight java %}
class Animal implements Serializable {
  private static final long serialVersionUID = 1L;

  boolean alive;
}

public class Cat implements Serializable {
  private static final long serialVersionUID = 1L;

  boolean playingCute;

  public void serialize(String fileName) throws IOException {
    Path p = Paths.get("sers", fileName);
    File f = p.toFile();

    f.createNewFile();

    try (FileOutputStream fos = new FileOutputStream(f);
        ObjectOutputStream oos = new ObjectOutputStream(fos)) {
      oos.writeObject(this);
    }
  }

  public void deserialize(String fileName) throws IOException, ClassNotFoundException {
    Path p = Paths.get("sers", fileName);
    File f = p.toFile();

    FileInputStream fis = new FileInputStream(f);
    try (ObjectInputStream ois = new ObjectInputStream(fis)) {
      Cat readed = (Cat) ois.readObject();
      
      this.playingCute = readed.playingCute;
    }
  }

  @Override
  public String toString() {
    return String.format("{ playingCute:%b }", playingCute);
  }

  public static void main(String[] args) throws IOException, ClassNotFoundException {
    Cat c = new Cat();

    c.playingCute = true;
    c.serialize("cat.ser");

    c.deserialize("cat.ser");

    System.out.println(c);
  }
}
{% endhighlight %}

运行程序，输出：

<pre>{ playingCute:true }</pre>

然后后来的某一天，你希望 Cat 集成 Animal ，那么在反序列化的时候，历史代码产生的 .ser 文件对新代码的影响会是什么样呢？

{% highlight java %}
class Animal implements Serializable {
  private static final long serialVersionUID = 1L;

  boolean alive;
  /**
   * IMPORTANT
   */
  private void readObjectNoData() throws ObjectStreamException {
    this.alive = true;
  }
}

public class Cat extends Animal implements Serializable {
  private static final long serialVersionUID = 1L;

  boolean playingCute;

  public void serialize(String fileName) throws IOException {
    Path p = Paths.get("sers", fileName);
    File f = p.toFile();

    f.createNewFile();

    try (FileOutputStream fos = new FileOutputStream(f);
        ObjectOutputStream oos = new ObjectOutputStream(fos)) {
      oos.writeObject(this);
    }
  }

  public void deserialize(String fileName) throws IOException, ClassNotFoundException {
    Path p = Paths.get("sers", fileName);
    File f = p.toFile();

    FileInputStream fis = new FileInputStream(f);
    try (ObjectInputStream ois = new ObjectInputStream(fis)) {
      Cat readed = (Cat) ois.readObject();
      
      this.alive = readed.alive;
      this.playingCute = readed.playingCute;
    }
  }

  @Override
  public String toString() {
    return String.format("{ alive:%b, playingCute:%b }", alive, playingCute);
  }

  public static void main(String[] args) throws IOException, ClassNotFoundException {
    Cat c = new Cat();

    c.deserialize("cat.ser");

    System.out.println(c);
  }
}
{% endhighlight %}

尝试反序列化老的 .ser 文件：得到的结果如下：

<pre>{ alive:true, playingCute:true }</pre>

注意 alive 的值。

程序没有抛出异常，但是站在序列化（数据）的角度，老版本的 Cat 在序列化的时候没有父类 Animal 相关的数据，而在新版本的 Cat 在 readObjec 的时候确期望它出现。Java 此时会认为这一份 Cat 的序列化数据被破坏了。但是任然可以帮你反序列化，尽管结果可能不如你意。

有没有补救的办法呢？答案就是 readObjectNoData 。

我们在新版本的 Animal 中实现了这个方法，结果就是在当前这种数据丢失的情况下的反序列化过程中， Java 调用了它。导致你看到的 alive 值为 true。

### summary

最后，让我们来看看序列化的真相：

打开之前生成的 .ser 文件，以 User 为例：

> 

不难看到所有的 non-static 和 non-transient 的 field 通通都参与了进来，如文档所说，是 Object Graph 转换为字节流的过程。

Java 真正的序列化实现，交给了 java.io.ObjectOutputStream 和 java.io.ObjectInputStream。看看 defaultReadObject 的实现：

{% highlight java %}
public void defaultReadObject()
        throws IOException, ClassNotFoundException
{
    SerialCallbackContext ctx = curContext;
    if (ctx == null) {
        throw new NotActiveException("not in call to readObject");
    }
    Object curObj = ctx.getObj();
    ObjectStreamClass curDesc = ctx.getDesc();
    bin.setBlockDataMode(false);
    defaultReadFields(curObj, curDesc); // 调用默认的反序列化所有域
    bin.setBlockDataMode(true);
    if (!curDesc.hasWriteObjectData()) {
        /*
         * Fix for 4360508: since stream does not contain terminating
         * TC_ENDBLOCKDATA tag, set flag so that reading code elsewhere
         * knows to simulate end-of-custom-data behavior.
         */
        defaultDataEnd = true;
    }
    ClassNotFoundException ex = handles.lookupException(passHandle);
    if (ex != null) {
        throw ex;
    }
}
{% endhighlight %}

所以，定制序列化和反序列化的终极方案：继承，重写这两个类。前提是保证正确性与效率。

<br>

### 参考资料

* [When to add readObjectNoData() during serialization](http://stackoverflow.com/questions/7445217/java-when-to-add-readobjectnodata-during-serialization)
* [Java Object Serialization Specification: 3 - Object Input Classes](http://docs.oracle.com/javase/6/docs/platform/serialization/spec/input.html#6053)
* [understand readObjectNoData callback - Serializable](http://www.coderanch.com/t/517881/java-io/java/understand-readObjectNoData-callback-Serializable)

`<<<EOF`