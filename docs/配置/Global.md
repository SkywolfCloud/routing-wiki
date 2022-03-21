---
title: Global
lang: zh-CN
---

# Global

这部分是`bird.conf`的最外层，一般用来写像log，router id等参数。

## 常用参数

### log

顾名思义，日志选项。

语法：

```
log "filename" [limit "backup"] | syslog [name name] | stderr all|{ list of classes }
```

Classes:

- `info`, `warning`, `error`, `fatal` 均为本地问题
- `debug` 开启debug选项后才有，为调试信息
- `trace` 开启debug选项后才有，为更加详细的调试信息（通常会告诉你每一步都在干什么）
- `remote` 为远程主机的不正确行为
- `auth`为认证错误
- `bug`为Bird的内部错误

常见用法：

```
log syslog all;
log "/var/log/bird.log" all;
```

### debug

调试选项，打开后会增加输出`debug`和`trace`信息

语法：

```
debug protocols all|off|{ states|routes|filters|interfaces|events|packets [, ...] }
```

类型选项：

- states: 协议启动关闭等相关的调试信息
- filters: 过滤器相关的调试信息
- routes: 与路由表交换的路由
- interfaces: 发送到协议的接口更改的事件
- events: 协议内部的事件
- packets: 被协议发送和接受的包

常见用法：

```
debug all;
```



## router id

顾名思义，为bird设定一个router id，它是路由器的**全球唯一标识**，通常为路由器的IPv4地址之一。

通常在使用中，需要注意**整个网络中不允许有重复**（批量部署中时有发生）

语法：

```
router id IPv4 address
```

常见用法：

```
router id 114.5.1.4;
```

