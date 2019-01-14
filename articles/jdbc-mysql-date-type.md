---
title: 'jdbc-mysql-date-type'
author: yoje
date: 2019-01-13
---

# Question
使用jdbc访问mysql时, 如何处理`date, time, datetime, timestamp` 类型? 其中涉及的时区如何转换?

# Learning
## ResultSet
jdbc 规范定义了接口`ResultSet` 用于访问数据. 其中, 对于时间类型的数据, 提供了`java.sql.Date getDate(int columnIndex), java.sql.Time getTime(int columnIndex), java.sql.Timestamp getTimestamp(int columnIndex)` 三个方法.  而对于时间类型的数据, mysql server 返回给mysql client的格式是`2017-02-15 10:32:15`.

那么如何将`2017-02-15 10:32:15`这种格式转换成`java.sql.Date,java.sql.Time,java.sql.Timestamp`?

## java.sql.*

`java.sql.Date,java.sql.Time,java.sql.Timestamp` 都是`java.util.Date` 的子类, 而`java.util.Date` 表示的是一个精度为毫秒的时间戳.

因此这里的问题是如何将`2017-02-15 10:32:15` 转换成时间戳? 答案是需要一个时区, 只有将`2017-02-15 10:32:15` 放到某个具体的时区下, 才能表示一个绝对时间, 才可以得到对应的时间戳.

因此问题变成了正确的时区是什么? 以及如何确保使用正确的时区?

## TimeZone
这里涉及的时区有: mysql server的时区, mysql client(也就是当前应用)的时区, 当前connection的时区.

对于 `datetime` 类型, 由于mysql server返回的数据和时区无关, 因此这里mysql client可以转换为自己想要的时区.

而对于 `timestamp` 类型, 正确的时区是 **当前connection的时区**, 因为mysql server返回的是将utc转换为当前connection时区之后的数据.

那么对于我们常用的jdbc实现库, `mysql-connector-java`:
1. 当前connection的时区是哪个?
2. 如何修改当前connection的时区?
3. 对于`timestamp` 类型的数据, 是使用哪个时区转换为`java.sql.TimeStamp`?

## mysql-connector-java

1. 当前connection的时区默认使用mysql server 配置的时区, 即`show variables like 'time_zone'`的值.
2. 可以在jdbc url连接参数中通过`sessionVariables=time_zone='+09:00'` 配置connection的时区.
3. 转换`timestamp` 类型的数据时, 使用的时区取决于具体的版本和配置. 具体如下

### version 6.x, 8.x
转换`timestamp` 类型的数据时, 使用当前connection的时区. 因此转换之后的数据是正确的.

由于mysql 和java 中时区规范不兼容, 可能出现
1. java不认识mysql server配置的时区
2. java将mysql server中配置的时区解析错误

因此, 可以使用如下参数, 用符合java规范且等价于mysql server配置的时区值, 告诉`mysql-connector-java` 正确的时区信息
> serverTimezone   
  Override detection/mapping of time zone. Used when time zone from server doesn't map to Java time zone

**需要注意的案例**

部署在中国标准时区(GMT+8:00)的mysql server, 默认的时区值是`CST`, 而`CST` 对应多个时区, 在mysql server中, CST=中国标准时区(China Standard Time. GMT+8:00), 而在java(1.8)中, CST=美国中央时区(Central Standard Time. GMT-6:00), 因此读取的`timestamp`数据会和实际时间差14个小时. **解决方案是通过在jdbc url中添加参数serverTimeZone=GMT%2b8:00**, 这样在java中得到的时区就是正确的.

推荐版本:6.0.3(低于这个版本的解析日期时间时存在bug).

### version 5.X
5.x版本提供两种方式, 通过配置`useLegacyDatetimeCode=true/false` 决定使用哪一种方式. 默认为true.

1. `useLegacyDatetimeCode=false`

    不使用遗留的日期时间代码. 处理方式和6.x, 8.x的相同.

    推荐版本version: 5.1.39+(低于这个版本的解析日期时间时存在bug).

2. `useLegacyDatetimeCode=true`

    使用遗留的日期时间代码.  

    具体的行为是， 不管当前connection的时区是什么, 对于`timestamp` 类型的数据, 总是使用java应用的默认时区`TimeZone.getDefault()` 转换成`java.sql.TimeStamp` 对象.

    如果java应用的默认时区和当前connection的时区不一致时, 这种转换会导致错误的数据. 因此, 这种使用方式应该避免.

# Conclusion
1. 和时区有关的数据使用`timestamp`类型存储
2. `timestamp` 类型在mysql server端存储的是对应的utc数据, 查询时, 首先会转换为当前connection的时区,然后返回
3. mysql client拿到`timestamp` 类型的数据时, 必须通过当前connection的时区, 转换成对应的`java.sql.TimeStamp` 对象.

因此正确的使用方式:

  对于`version 5.x`, 配置 `useLegacyDatetimeCode=false&serverTimeZone=timezone`

  对于`version 6.x, 8.x`, 配置 `serverTimeZone=timezone`

# References
[https://stackoverflow.com/questions/3323618/handling-mysql-datetimes-and-timestamps-in-java](https://stackoverflow.com/questions/3323618/handling-mysql-datetimes-and-timestamps-in-java)

[https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-properties-changed.html](https://dev.mysql.com/doc/connector-j/8.0/en/connector-j-properties-changed.html)

[https://dev.mysql.com/doc/relnotes/connector-j/6.0/en/news-6-0-3.html](https://dev.mysql.com/doc/relnotes/connector-j/6.0/en/news-6-0-3.html)
