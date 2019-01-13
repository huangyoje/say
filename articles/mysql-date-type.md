---
title: 'mysql-date-type'
author: yoje
date: 2019-01-11
---

# Question
设计数据库结构时, `create_time, update_time` 这两个字段应该使用 `datetime`, 还是 `timestamp`?

# Learning
## `datetime` vs `timestamp`
以下内容参考[https://dev.mysql.com/doc/refman/8.0/en/datetime.html](https://dev.mysql.com/doc/refman/8.0/en/datetime.html)
### range
`datetime`可以支持的区间是`'1000-01-01 00:00:00' - '9999-12-31 23:59:59'`, `timestamp` 可以支持的区间是`UTC '1970-01-01 00:00:01'  - UTC '2038-01-19 03:14:07'`

从区间表示上可以看出, `datetime` 类型不包含时区信息, 而`timestamp` 类型包含时区信息, 因此如果存储的日期和时区有关则只能使用`timestamp`, 或使用单独的字段存储时区信息.

### storage
> MySQL converts TIMESTAMP values from the current time zone to UTC for storage, and back from UTC to the current time zone for retrieval. (This does not occur for other types such as DATETIME.)

mysql server 写入`timestamp` 类型的数据时, 首先将时间从当前connection的时区(参考[]()) 转换成UTC进行存储, 读 `timestamp` 类型的数据时, 会将数据从UTC转换为当前connection 时区, 然后返回给client. 而对于`datetime`类型, 则不做任何转换. (猜测对于`timestamp`和`datetime`, 底层存储的都是`1970-01-01 00:00:01`格式的字符串.)

**由于一般情况下, mysql server 和mysql client 部署在同一个时区, 因此这个区别被隐藏起来, 我们混用`datetime`和`timestamp`这两种类型也没有问题.** 而当server和client部署在不同的时区时, 则要慎重对待这个区别.

#### proof
接下来用代码演示一下第二点区别.

编码之前还有一个地方需要了解: 对于`timestamp` 类型, 在server 和client 之间传输的格式是`2017-02-15 10:32:15` 这种字符串, 时区是当前connection的时区.

因此, 读一个`timestamp`类型数据完整的流程是:
1. mysql server 取出存储的数据(utc时区)
2. mysql server 将数据转换为当前connection的时区对应的数据
3. 将转换后的数据传输给client.

```java
    static final String DB_URL = "jdbc:mysql://localhost:3306/test";
    static final String USER = "root";
    static final String PASS = "";
    static Connection conn = null;
    static Statement stmt = null;
    static ResultSet resultSet = null;
    static final String CREATE_TABLE =
            "CREATE TABLE IF NOT EXISTS`date_type_test` (\n" +
                    "  `record` varchar(8) DEFAULT NULL,\n" +
                    "  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,\n" +
                    "  `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n" +
                    ") ENGINE=InnoDB DEFAULT CHARSET=utf8";

    public static void main(String[] args) throws Exception {
        try {
            connect();
            // 创建表
            execute(CREATE_TABLE);
            execute("delete from date_type_test;");
            // 插入一条数据
            execute("insert into date_type_test(record) value('first');");
            // 查看当前连接的时区
            execute("show variables like '%time_zone%';");
            // 查看数据
            execute("select * from date_type_test;");
            // 修改当前连接时区
            execute("set time_zone = '+10:00';");
            execute("show variables like '%time_zone%';");
            execute("select * from date_type_test;");
            // 恢复当前连接的时区为 +08:00
            execute("set time_zone = '+08:00';");
            execute("show variables like 'time_zone';");
            execute("insert into date_type_test(record) value('second');");
            execute("select * from date_type_test;");
        } finally {
            close(stmt);
            close(conn);
        }
    }

    private static void execute(String sql) throws Exception {
        try {
            boolean query = stmt.execute(sql);
            StringBuilder sb = new StringBuilder("> ");
            sb.append(sql).append(System.lineSeparator());
            if (query) {
                ResultSet resultSet = stmt.getResultSet();
                int columnCount = resultSet.getMetaData().getColumnCount();
                sb.append(" |");
                for (int i = 1; i <= columnCount; i++) {
                    sb.append(resultSet.getMetaData().getColumnName(i)).append(" | ");
                }
                sb.append(System.lineSeparator());
                while (resultSet.next()) {
                    sb.append(" |");
                    for (int i = 1; i <= columnCount; i++) {
                        // 使用ResultSet.getBytes(int columnIndex)
                        // 查看mysql server 返回给client的原始字符串
                        sb.append(new String(resultSet.getBytes(i))).append(" | ");
                    }
                    sb.append(System.lineSeparator());
                }
            }
            System.out.println(sb.toString());
        } finally {
            close(resultSet);
        }
    }
    private static void connect() throws SQLException {
        conn = DriverManager.getConnection(DB_URL, USER, PASS);
        stmt = conn.createStatement();
    }
    private static void close(AutoCloseable closeable) throws Exception {
        if (closeable != null) {
            closeable.close();
        }
    }
```

输出结果及分析如下:
```text
> show variables like '%time_zone%';
 |Variable_name | Value |
 |system_time_zone | CST |
 |time_zone | SYSTEM |
```
当前connection的时区为`SYSTEM`, 而`SYSTEM`的值为`CST`, 这里`CST`表示的`China Standard Time`, 即"+08:00".

```text
> insert into date_type_test(record) value('first');

> select * from date_type_test;
 |record | create_time | update_time |
 |first | 2019-01-13 14:37:29 | 2019-01-13 14:37:29 |
```
插入一条数据, 其中, `create_time`是`datetime`类型, `update_time` 是`timestamp`类型. 由于数据写入和查询的时区相同, 因此查询出的数据也一样.

```text
> set time_zone = '+10:00';

> show variables like 'time_zone';
 |Variable_name | Value |
 |time_zone | +10:00 |

> insert into date_type_test(record) value('second');

> select * from date_type_test;
 |record | create_time | update_time |
 |first | 2019-01-13 14:37:29 | 2019-01-13 16:37:29 |
 |second | 2019-01-13 16:37:29 | 2019-01-13 16:37:29 |
```
修改当前connection的时区为"+10:00",  并插入一条新数据.

对于第一条数据, `update_time` 已经自动变成了"+10:00"时区的格式, 而`create_time` 无变化.

对于刚插入的数据, `update_time` 和`create_time` 都是当前"+10:00"时区的格式.

```text
> set time_zone = '+08:00';

> show variables like 'time_zone';
 |Variable_name | Value |
 |time_zone | +08:00 |

> select * from date_type_test;
 |record | create_time | update_time |
 |first | 2019-01-13 14:37:29 | 2019-01-13 14:37:29 |
 |second | 2019-01-13 16:37:29 | 2019-01-13 14:37:29 |
```
将时区恢复为`+08:00`. 两条数据的`timestamp` 字段自动变化为`+08:00`时区, 而`create_time` 无变化.

# Conclusion
在得出结论之前, 首先必须达成一致, `create_time, update_time` 是绝对时间, 需要时区信息. 因此, 结论如下
1. `create_time, update_time` 应该使用`timestamp` 类型.
   使用`datetime`类型是一种技术错误, 只不过在特定的情况下(server和client时区一致), 这个错误没有影响.
2. `datetime` 字段的数据应该由mysql client主动写入, 避免在mysql server端通过`DEFAULT CURRENT_TIMESTAMP`等方式自动更新.
   因为自动更新时, 会使用当前connection的时区, 而这个字段不应该存储和时区有关的数据.

# References
[https://dev.mysql.com/doc/refman/8.0/en/datetime.html](https://dev.mysql.com/doc/refman/8.0/en/datetime.html)
[https://jira.mariadb.org/browse/CONJ-433](https://jira.mariadb.org/browse/CONJ-433)
[https://stackoverflow.com/questions/409286/should-i-use-the-datetime-or-timestamp-data-type-in-mysql](https://stackoverflow.com/questions/409286/should-i-use-the-datetime-or-timestamp-data-type-in-mysql)
