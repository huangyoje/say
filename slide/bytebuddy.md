# how to monitor execution time of a method?
```java
T o = com.fasterxml.jackson.databind.ObjectMapper#readValue(byte[] src, Class<T> valueType);
List<E> list = org.apache.ibatis.executor.resultset.DefaultResultSetHandler#handleResultSets(Statement stmt);
```

# what is bytebuddy
Runtime code generation for the Java virtual machine.

# code generation
## compile time
[JSR 269: Pluggable Annotation Processing API](https://www.jcp.org/en/jsr/detail?id=269)
- lombok
## runtime
** bytecode manipulation **
- java proxy: `java.lang.reflect.Proxy`
- asm
- cglib
- Javassist
- bytebuddy

# bytecode manipulation
- add
- delete
- replace

# bytebuddy
- subclass
- rebase
- redefine

```java
String toString = new ByteBuddy()
                      .subclass(Object.class)
                      .name("com.yoje.bytebuddy.slides.SubclassDemo")
                      .method(named("toString")).intercept(FixedValue.value("Hello World!"))
                      .make()
                      .load(Subclass.class.getClassLoader())
                      .getLoaded()
                      .newInstance()
                      .toString();


```

# method intercept
- fixed value
- deletation
- methodcall
