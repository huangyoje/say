---
title: 'mysql-timezone'
author: yoje
date: 2019-01-11
---

mysql 在处理和时区有关的数据时, 需要获取当前connection的时区信息

# connection time zone
> Per-connection time zones. Each client that connects has its own time zone setting, given by the session time_zone variable. Initially, the session variable takes its value from the global time_zone variable

每个connection可以通过命令`SET time_zone = timezone`设置自己的时区.可以通过`show variables like '%time_zone%'`查看当前connection时区.

如果当前connection没有显示设置时区, 则使用`global time zone`作为自己的时区.

# global time zone
> The server's current time zone.
The global time_zone system variable indicates the time zone the server currently is operating in. The initial value for time_zone is 'SYSTEM', which indicates that the server time zone is the same as the system time zone.

> The initial global server time zone value can be specified explicitly at startup with the `--default-time-zone=timezone` option on the command line, or you can use the following line in an option file`default-time-zone='timezone'`.

global time zone的初始值是`SYSTEM`, 也就是mysql server运行所在的系统时区. 启动前可以通过配置文件或命令行修改. 启动后可以通过`SET GLOBAL time_zone = timezone` 修改.

# References
[https://dev.mysql.com/doc/refman/8.0/en/time-zone-support.html](https://dev.mysql.com/doc/refman/8.0/en/time-zone-support.html)
