---
layout: post
title:  "学习笔记之mysql"
date:   2018-04-16 14:48:26 +0800
tag: code
---

**简介：**
-------------
MySQL原本是一个开放源代码的关系数据库管理系统，原开发者为瑞典的MySQL AB公司，该公司于2008年被sun公司收购。2009年，甲骨文公司收购sun公司，MySQL成为Oracle旗下产品。
通常我们使用Community社区版、Enterprise企业版 
去IOE的概念（阿里巴巴 2008年） I(IBM的小型机 AIX //注释不可用 )O(ORACLE 装在HP机（对内存要求必须是8字节的整数倍 数据紧凑型排列）)E（EMC 存储） 传统架构都是这样
阿里云 n个x86 mysql mysql 自动提交（没有事务） 操作n个表，要求一起提交。
阿里巴巴提出的概念：最终一致.

mysql是一个虚拟用户
```
su - mysql
```

执行mysql不加参数会用root用户默认密码登陆

修改当前登录用户密码：
```
SET PASSWORD = PASSWORD('123456');
```

使用自己设置的密码登陆：
```
mysql -uroot -p123456
```

创建一个名为mysql01的用户，并为其设置密码123456：
```
CREATE USER 'mysql01'@'localhost' IDENTIFIED BY '123456';
```

为mysql01用户设置数据库权限:
```
GRANT ALL PRIVILEGES ON *.* TO 'mysql01'@'%' IDENTIFIED BY '123456' WITH GRANT OPTION;
```

为mysql01用户设置数据库具体权限(下面的*.*表示所有表，可以具体指定为database.table)
```
GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,DROP ON *.* TO 'mysql01'@'localhost' IDENTIFIED BY '123456' WITH GRANT OPTION;
```

在root用户下修改mysql01用户的密码
```
SET PASSWORD FOR 'mysql01'@'localhost'=password('123456789');
```

刷新权限：
```
FLUSH PRIVILEGES;
```

显示所有用户:
```
SELECT DISTINCT User FROM mysql.user;
```

查看一个表中有哪些字段，以及字段的属性信息:
```
describe mysql.user;
```

准备工作:

    在mysql01用户
    mkdir sql
	上传文件 scott_data.sql
	--在mysql客户端执行
	source /home/mysql01/sql/scott_data.sql

-------------
多表查询:
```
	--显示员工号、姓名、部门编号、部门名称
	--oracle 写法
	select e.empno,e.ename,e.deptno,d.dname
    from emp e,dept d
    where e.deptno=d.deptno;
 	--sql99写法 口诀 1. "," ---> inner join ,2. where ---> on 
 	select e.empno,e.ename,e.deptno,d.dname
    from emp e inner join dept d
    on e.deptno=d.deptno;
	--统计各部门人数，显示：部门编号、部门名称，人数
	select d.deptno,d.dname,count(e.empno)
    from emp e,dept d
    where e.deptno(+)=d.deptno
    group by d.deptno,d.dname;--oracle 写法不适用
   
    --右外连接写法 口诀： 1. "," -----> right outer join  2. where -----> on
    select d.deptno,d.dname,count(e.empno)
    from emp e right outer join dept d
    on e.deptno=d.deptno
    group by d.deptno,d.dname
	--左外连接 口诀： 1. "," -----> left outer join  2. where -----> on
	select d.deptno,d.dname,count(e.empno)
    from dept d left outer join emp e
    on e.deptno=d.deptno
    group by d.deptno,d.dname
	--左外连接和右外连接取决于表的位置，和等号没关系 
	--显示 xx的老板是xxx
	select concat(e.ename,'''s boss is',b.ename)
    from emp e,emp b
    where e.mgr=b.empno;
    ---->
    select concat(e.ename,'''s boss is',b.ename)
    from emp e left outer join  emp b
    on e.mgr=b.empno;
    
    ERROR 1305 (42000): FUNCTION scott.nvl does not exist
   
    --正确写法
    select concat(e.ename,'''s boss is',ifnull(b.ename,'himself'))
    from emp e left outer join  emp b
    on e.mgr=b.empno;
  
    inner，outer可以省略 
 
    --查询后面加一个 \G
    select * from emp \G
 
    LANG="zh_CN.UTF-8" 存储是按照UTF8，菜单是按照中文 
 
    --查看语言设置
    echo $LANG
 
    [mysql01@localhost ~]$ source .bash_profile 
    [mysql01@localhost ~]$ 
    [mysql01@localhost ~]$ 
    [mysql01@localhost ~]$ echo $LANG
    C

    应用部署尽量独立用户 
```
-------------
数据库的增删改查:
```
	--体系结构，与oracle的不同
	oracle 是基于用户的处理，mysql 是基于数据库的管理
	--数据库的增删改查
    show user; 没有
    --查看已有的数据库，下面这四个千万别删 
    mysql> show databases;
    +--------------------+
    | Database           |
    +--------------------+
    | information_schema |
    | mysql              |
    | performance_schema |
    | test               |
    +--------------------+
    4 rows in set (0.00 sec)
    
    --创建 字符集
    create database mydb1;
    mysql> show create database mydb1;
    +----------+------------------------------------------------------------------+
    | Database | Create Database                                                  |
    +----------+------------------------------------------------------------------+
    | mydb1    | CREATE DATABASE `mydb1` /*!40100 DEFAULT CHARACTER SET latin1 */ |
    +----------+------------------------------------------------------------------+
    1 row in set (0.00 sec)
    --创建的时候指定字符集
    create database mydb2 character set utf8;
    --建立数据库的时候加 if not exists，可以不报错
    mysql> create database if not exists mydb2 character set utf8;
    Query OK, 1 row affected, 1 warning (0.00 sec)
    
    mysql> create database  mydb2 character set utf8;
    ERROR 1007 (HY000): Can't create database 'mydb2'; database exists
    --按照utf8的格式进行检查
    create database mydb3 character set utf8 collate utf8_general_ci;
    --查看 
    show create database mydb1;
    --修改,修改为utf8格式 
    alter database mydb1 character set utf8;
    --删除
    drop database mydb3;
    数据库大小写敏感
```
-------------
表的CURD:
```
	建表前要选择数据库
	mysql> create table t1(id number,name varchar2(20);
	ERROR 1046 (3D000): No database selected
	--选择mydb1
	use mydb1
	samllint 2的16 == 2的10*2的6 =  1k 64k
	
	--创建，数据类型
		--注意类型
		create table t1(id int,name varchar(20));
	--查看表
	--查看当前数据库有哪些表
	mysql> show tables;
	+-----------------+
	| Tables_in_mydb1 |
	+-----------------+
	| t1              |
	+-----------------+
	--查看表结构
	desc t1;
	--查看创建表的结构
	show create table t1;
	ENGINE=InnoDB 是默认引擎，支持事务的，默认情况下事务不开启
	--表名大小写敏感 
	mysql> select * from T1;
	ERROR 1146 (42S02): Table 'mydb1.T1' doesn't exist
	--修改表
	--增加列
	alter table t1 add column sal float;
	alter table t1 add  comm float;
    -- 增加一列二进制
    alter table actorvariable add column sal mediumblob
	--修改列属性
	alter table t1 modify column comm double;
	alter table t1 modify  sal double;
	--删除列
	alter table t1 drop column comm;
	alter table t1 drop sal;
    --修改列名
    alter table t1 change column comm comm1 double;
	--重命名表
	rename table t1 to t2;
    --查看所有表
	show tables;
	--删除表
	drop table t2; --purge关键字不支持
```
-------------
mysql 如何查询某表第一个字段内容长度:
```
    aaa表，有字段id,bbb,ccc，现在想查询bbb字段第一个内容的长度，应该怎么写
    id bbb ccc
    1 111 222
    2 333 444

    select length（bbb）from aaa limit 1
```
-------------
表数据的CURD:
```
	--插入
	create table employee(id int,
                name varchar(20),
                sex int,
                birthday date,
                salary double,
                entry_date date,
                resume text
                );
	insert into employee values(1,'张三',1,'1983-04-27',15000,'2012-06-24','一个大牛');
	insert into employee(id,name,sex,birthday,salary,entry_date,resume) values(2,'李四',1,'1984-02-22',10000,'2012-07-24','一个中牛');
	insert into employee(id,name,sex,birthday,salary,entry_date,resume) values(3,'王五',0,'1985-08-28',7000,'2012-08-24','一个小虾');
	--修改
    表名 						   	    列名					
	update employee set resume='一个小牛' where name='王五';
	--删除
	delete from employee where id =3;
	--查询
	mysql> select *from employee;
	--练习和任务
	--分组数据
	alter table student add class_id int;
	修改数据
	update student set class_id=ceil(id/5);
	
	--求每个班的英语平均成绩
	select class_id,avg(english) from student group by class_id;
	--mysql的group by 语法不够严格
	mysql> select class_id,id,avg(english) from student group by class_id;
	+----------+------+--------------+
	| class_id | id   | avg(english) |
	+----------+------+--------------+
	|        1 |    1 |      91.4000 |
	|        2 |    6 |      83.2000 |
	+----------+------+--------------+
	--求各个班的总成绩
	select class_id,sum(chinese+english+math) from student group by class_id;
	--求总成绩超过1300的班级
	select class_id,sum(chinese+english+math) from student group by class_id having sum(chinese+english+math) > 1300;
	--组函数同样不能在where后出现
	mysql> select class_id,sum(chinese+english+math) from student where sum(chinese+english+math) > 1300 group by class_id;
	ERROR 1111 (HY000): Invalid use of group function

	--日期时间函数
	mysql> select sysdate from dual;
	ERROR 1054 (42S22): Unknown column 'sysdate' in 'field list'
	mysql> select now() from dual;
	+---------------------+
	| now()               |
	+---------------------+
	| 2016-07-21 15:02:23 |
	+---------------------+
	1 row in set (0.06 sec)
	
	mysql> select now() ;
	+---------------------+
	| now()               |
	+---------------------+
	| 2016-07-21 15:02:33 |
	+---------------------+
	1 row in set (0.00 sec)
	--求昨天、今天、明天，不能 用 select now()-1 昨天,now() 今天,now()+1 今天 from dual;
	mysql> select addtime(now(),10),now() from dual;
	+---------------------+---------------------+
	| addtime(now(),10)   | now()               |
	+---------------------+---------------------+
	| 2016-07-21 15:04:52 | 2016-07-21 15:04:42 |
	+---------------------+---------------------+
	--加一分钟
	mysql> select addtime(now(),'0:1:0'),now() from dual;
	+------------------------+---------------------+
	| addtime(now(),'0:1:0') | now()               |
	+------------------------+---------------------+
	| 2016-07-21 15:06:32    | 2016-07-21 15:05:32 |
	+------------------------+---------------------+
	
	
	select date_add(now(),interval -1 day) 昨天,date_add(now(),interval 1 day) 明天,now() 今天 from dual; //ok
	
	select year(now()),month(now()),date(now()) from dual;
	--求明年的今天
	select date_add(now(),interval 1 year) 明年的今天 from dual;
	date_format,str_to_date
	--yyyy-mm-dd 格式保留了，但是没有功能，语法不会报错
	mysql> select date_format(now(),'yyyy-mm-dd') from dual;
	+---------------------------------+
	| date_format(now(),'yyyy-mm-dd') |
	+---------------------------------+
	| yyyy-mm-dd                      |
	+---------------------------------+
	mysql> select to_char(now(),'yyyy-mm-dd') from dual;
	ERROR 1305 (42000): FUNCTION mydb1.to_char does not exist
	
	select date_format(now(),'%Y-%m-%d'),date_format(now(),'%Y-%M-%D'),date_format(now(),'%Y-%c-%d') from dual;
	select date_format(now(),'%Y-%m-%d'),date_format(now(),'%Y-%M-%D'),date_format(now(),'%y-%c-%d') from dual;
	select date_format(now(),'%Y-%m-%d %h:%i:%s') from dual;
	
	--转换字符串'2016-07-21 03:15:05'为时间
	select str_to_date('2016-07-21 03:15:05','%Y-%m-%d %h:%i:%s') from dual;
	
	--字符串相关函数
	--charset(str) 返回字符集,示例
	mysql> select charset('aaa'),charset('叶开') from dual;
	+----------------+-------------------+
	| charset('aaa') | charset('叶开')   |
	+----------------+-------------------+
	| utf8           | utf8              |
	+----------------+-------------------+
	
	--字符串连接
	mysql> select concat('hello','world','aaaa','nbbbb'),'hello'||'world' from dual;
	+----------------------------------------+------------------+
	| concat('hello','world','aaaa','nbbbb') | 'hello'||'world' |
	+----------------------------------------+------------------+
	| helloworldaaaanbbbb                    |                0 |
	+----------------------------------------+------------------+
	
	
	--数学相关函数
	mysql> select bin(10),conv(10,10,2),conv(10,10,16) from dual;
	+---------+---------------+----------------+
	| bin(10) | conv(10,10,2) | conv(10,10,16) |
	+---------+---------------+----------------+
	| 1010    | 1010          | A              |
	+---------+---------------+----------------+
	

	--约束（主键字段特殊，check语法保留，但是无效）
		drop table myclass;
		create table myclass(
                                class_id int primary key auto_increment,
                                class_name varchar(20) not null,
                                create_date timestamp);
		--插入数据
		insert into myclass(class_name) values('1班');
		insert into myclass(class_name) values('2班');
		insert into myclass(class_id,class_name) values(5,'5班');
		insert into myclass(class_name) values('6班');
		insert into myclass(class_id,class_name) values(1,'8班');
		insert into myclass(class_name) values('9班');
		
		create table mystudent(
                                student_id int primary key auto_increment,
                                student_name varchar(20) not null,
                                hiredate timestamp,
                                class_id int,
                                constraint stu_classid_FK foreign key(class_id) references myclass(class_id));
       --插入学生数据
       insert into mystudent values(1,'张三',now(),1);
       
       mysql> insert into mystudent values(1,'张三风',now(),1);
	   ERROR 1062 (23000): Duplicate entry '1' for key 'PRIMARY'
	   
	   insert into mystudent(student_name,class_id) values('张三风',1);
	   
	   
		mysql> insert into mystudent(student_name,class_id) values(null,1);
		ERROR 1048 (23000): Column 'student_name' cannot be null
		
		insert into mystudent(student_name,class_id) values('',1);
		
		select * from mystudent where student_name ='';
		
		mysql> insert into mystudent(student_name,class_id) values('张三疯',10);
		ERROR 1452 (23000): Cannot add or update a child row: a foreign key constraint fails (`mydb1`.`mystudent`, CONSTRAINT `stu_classid_FK` FOREIGN KEY (`class_id`) REFERENCES `myclass` (`class_id`))
		
		mysql> delete from myclass where class_id=1;
	    ERROR 1451 (23000): Cannot delete or update a parent row: a foreign key constraint fails (`mydb1`.`mystudent`, CONSTRAINT `stu_classid_FK` FOREIGN KEY (`class_id`) REFERENCES `myclass` (`class_id`))

        --查询进程并关闭进程
        1. 查询进程
        show processlist
        2. 查询到相对应的进程然后
        kill id
```
--查看mysql数据库空间占用
```sql
select TABLE_SCHEMA, concat(truncate(sum(data_length)/1024/1024,2),' MB') as data_size,
concat(truncate(sum(index_length)/1024/1024,2),'MB') as index_size
from information_schema.tables
group by TABLE_SCHEMA
order by data_length desc;
```
--不进入mysql控制台执行sql语句:
```bash
mysql -u root --password='lyZMD8HKeMe6Gz' -e "show databases"
mysql -u root --password='lyZMD8HKeMe6Gz' --database='game' -e 'show tables'
```
--mysql备份策略
```bash
mysqldump --host=bid-dev-57.csgvvc7xlukd.us-east-1.rds.amazonaws.com --port=3306 --user=bid --password=SA7X6JMpWIqUtEQIbtusNry1 --databases dev_bid > bidogo_dev.sql 
```
-------------
总结:
```
	数据库有什么好处？ACID（原子性、一致性、隔离性、持久性）
	开发一个系统：数据库+语言

    1.mysql 安装和登陆， mysql db 瑞典 
    注意安装的时候，默认创建root用户，保存在/root/目录下
    /root/.mysql_secret 
    --后台进程查看，服务起停 
    登陆不成功后如何操作
    mysql kill
    root service mysql stop -start 

    oracle 多用户 hr scott
    mysql 一个用户，多个数据库 mydb1,mydb2


    mysql -uroot -p123456
    show databases;
    use mydb1
    show tables;

    2.数据库的增删改查 注意字符集 if not exists  数据库的名称是大小写敏感
    
    3.表的增删改查  注意数据类型 innodo  表名也是大小写敏感 
    表可以有自己的字符集

    4.表数据的增删改查 group by mysql语法不严格，实际还是oracle的准确

    5.分组，日期和时间函数


    6.字符串函数，脚本
    select length('叶开'),length('aaab') from dual;
    7.多表查询
    内连接  oracle写法转换  1."," ---> [inner] join 2. where ---> on
    左外连接  1."," ---> left [outer] join 2. where ----> on 
    右外连接  1."," ---> right [outer] join 2. where ----> on
    左外连接与右外连接与等式无关，与表的位置有关 
    自连接 1. 数据都在一个表 2. 不在同一行 笛卡儿积是平方 

    mysql> select * from (select sal,comm,ename from emp);
    ERROR 1248 (42000): Every derived table must have its own alias
    mysql> select * from (select sal,comm,ename from emp) a;

    select * from emp \G

    8.mysql的中文问题
    9.总结
```
