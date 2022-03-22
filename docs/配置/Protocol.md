---
title: Protocol
lang: zh-CN
---

# Protocol

这部分是bird的第二层，一个protocol通常代表一个特定协议的对外连接。

通常而言，我们主要使用的协议有如下几种：

- Babel
- BGP
- Device
- Direct
- OSPF
- RPKI
- Static

在这里我们仅讲解`Device`, `Direct`, `RPKI`, `Static`.

## 常见参数

有这么一些参数是基本通用的。

### debug

语法：

```
debug all|off|{ states|routes|filters|interfaces|events|packets [, ...] }
```

开启调试

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

### description

语法：

```
description "text"
```

协议的描述，它将成为 `birdc show protocols all` 输出中的一部分

### interface

语法：

```
interface [-] [ "mask" ] [ prefix ] [, ...] [ { option; [...] } ]
```

可以在`Babel`, `BFD`, `Device`, `Direct`, `OSPF`, `RAdv`, `RIP` 中使用。默认为匹配所有端口，前面带`-`意为排除这个端口。

常见用法：

```
interface "eth*"; # 匹配eth开头的所有端口
interface "eth0", -"eth*", "*"; # 匹配eth0和所有不以eth开头的端口
```

## Device

Device是Bird中需要的配置行数最少的协议。在大部分情况，仅下面两行就能使它正常运行。

```
protocol device {
};
```

但即便是如此简单的协议，它一样有可以用来配置的属性。

### 配置

#### scan time

语法：

```
scan time number
```

顾名思义，两次扫描网络接口的时间。默认配置为60秒。通常而言这已经足够用，你也可以通过如下的示例来使它增快扫描时间。

```
scan time 10; # 将扫描时间设置为10秒
```

在网络接口比较多的时候，我们也可以延长时间来缓解占用。但在一定时间过后依旧会高占用。

#### interface

指定协议启用的接口。默认情况下启用所有接口。

语法：

```
interface pattern [, ...]
```

请参照[前面所述](Protocol.md#interface)。

interface中仅有`preferred`选项可用。该选项用于选择网络接口的首选IP地址，作为数据包的源地址或路由协议宣布的下一跳。

该选项将指定一个IPv4地址，一个IPv6地址，一个IPv6 链路本地地址（IPv6 LL）。

示例：

```
interface "eth0" {
    preferred 192.168.1.1;
    preferred 2001:db8:1:10::1;
};
```

**当你的机器接口太多的时候（大于100个），请务必使用该语句排除掉不必要的interface或仅选择有用的interface，以免造成bird卡顿**

## Direct

## RPKI

## Static

