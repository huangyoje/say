
## 使用clion debug mysql server

1. git clone https://github.com/mysql/mysql-server.git
2. git checkout 5.7
3. 使用clion 打开mysql-server项目
4. 下载1.5.9版本的boost
   ```text
   wget http://sourceforge.net/projects/boost/files/boost/1.59.0/boost_1_59_0.tar.gz
   tar -xzf boost_1_59_0.tar.gz --directory ~/bin/boost && rm boost_1_59_0.tar.gz
   ```
4. 修改clion 的cmake 参数: -DCMAKE_BUILD_TYPE=Debug -DWITH_BOOST=~/bin/boost
5. 运行clion 的cmake
6. 初始化
   ```text
   cd cmake-build-debug
   mkdir data
   # https://dev.mysql.com/doc/refman/5.7/en/mysql-install-db.html#option_mysql_install_db_basedir
   ./sql/mysqld  --initialize-insecure  --basedir=/Users/yoje/tiger/github/mysql-server/cmake-build-debug --datadir=data
   ```  
7. 编辑clion Run/Debug Configurations. 添加如下启动参数
   ```text
   --basedir=/Users/yoje/tiger/github/mysql-server/cmake-build-debug --datadir=data --debug
   ```
