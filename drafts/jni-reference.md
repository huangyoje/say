

# jni reference

  jni reference是 从native code引用java object的引用, 目的是避免在执行native方法的过程中, 对应的java object被gc回收.

# local reference  
  local reference的生命周期是当前方法栈, 方法return之后，当前方法里创建的local reference对象会被gc回收.
  如果当前方法里创建太多的local reference, 或引用的java object尺寸比较大, 那最好手动调用`DeleteLocalRefs` 及时回收, 不需要等待方法返回.

# global reference

   可以通过`NewGlobalRef()` 从local reference得到一个global reference. 使用结束之后，必须通过DeleteGlobalRefs释放

# more

  [http://journals.ecs.soton.ac.uk/java/tutorial/native1.1/implementing/index.html](http://journals.ecs.soton.ac.uk/java/tutorial/native1.1/implementing/index.html)
  [http://journals.ecs.soton.ac.uk/java/tutorial/native1.1/implementing/refs.html](http://journals.ecs.soton.ac.uk/java/tutorial/native1.1/implementing/refs.html)
