---
layout: post
title:  "超频高端B-Die：3733CL14烧机稳定，3800CL12可以开机测速！"
date:   2020-04-11
categories: blog
---

##### Last updated on Oct 11, 2020

<div id="google_translate_element"></div>

<script type="text/javascript">
function googleTranslateElementInit() {
  new google.translate.TranslateElement({pageLanguage: 'zh'}, 'google_translate_element');
}
</script>

<script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>

<br>

隔离期间没事情做，于是想到玩超频。这是我在Newegg上购买的两条[Patriot Viper Steel](https://viper.patriotmemory.com/products/viper-steel-ddr4-performance-memory-ram-viper-gaming-by-patriot-memory)，型号[PVS416G440C9K](https://assets.website-files.com/5cdb2ee0b102f96c3906500f/5dd6b314aa0dd278b0b6efc6_PVS416G440C9K%20Sku%20Sheet_Copyable_062819.pdf)，XMP 1的有效速度达4400MT/s，时序19-19-19-39，电压1.45V：

<img src="https://user-images.githubusercontent.com/14539571/77242264-f3b3f380-6bb9-11ea-8e06-c902a018081b.jpg" alt="包装" width="500"/>

很显然，由于Infinity Fabric的限制，X570平台是无法充分利用这个XMP的。而我前一段时间超频的G.Skill Trident Z Neo（F4-3600C16D-32GTZNC），是专为Ryzen 3000系列“优化”的内存条——**[这里是我的超频经历](../../../../blog/2019/10/22/overclocking-f4-3600c16d-32gtznc-x570.html)，其中包括了对X570平台的介绍和内存超频的基础，本文不再重复撰述。**

### 挑战3733CL14！
直接上数据！

> 注：
> 
> * Gear Down Mode默认开启，因此跳过了奇数tCR
> * Power Down Mode关闭
> * VDDP电压设置为900mV；VDDG电压设置为1050mV
> * 内存电压（VDDR）先调1.5V，不够再加
> * tRRDS = 4, tRRDL = 4, tFAW = 16, tWR = 10

MemClk = FClk = 1867MHz（内存有效速度为**3733MT/s**）

| **tCL**     | 16   | 14   | 14   | 14   | 14   | **14**  | 14   |
| **tRCD(RD)**| 16   | 14   | 15   | 15   | 15   | **15**  | 15   |
| **tRP**     | 16   | 14   | 14   | 13   | 12   | **11**  | 10   |
| **tRAS**    | 32   | 28   | 29   | 29   | 29   | **29**  | 29   |
| **是否POST？** | POST | POST | POST | POST | POST | POST | 无POST |
| **是否稳定？** | 稳定| 不稳定 | 稳定 | 稳定 | 稳定 | 稳定（@1.53V） | - |

有意思的是，
1. tRCDRD似乎遇到了瓶颈，无论怎么加电压都没用（可能这是X570的平台限制？）
2. 没想到B-Die的tRP可以设这么低......

根据以上测试的结果，最紧且稳定的**主要时序**（primary timings）为**14-15-11-29-1T**。

适当收紧的**第二时序/次要时序**（secondary timings）：

| tRC | tWR | tCWL | tRRDS | tRRDL   | tWTRS | tWTRL | tRFC | tRTP | tFAW |
|-----|-----|------|-------|---------|-------|-------|------|------|------|
| 40  | 10  | 12   | 4     | 4       | 4     | 8     | 243  | 8    | 16   |

适当收紧的**第三时序**（tertiary timings）:

| tRDWR | tRDRD_SC | tRDRD_SD | tRDRD_DD | tRDRD_SCL |
|-------|----------|----------|----------|-----------|
| 8     | 1        | 4        | 4        | 3         |

（续）

| tWRRD | tWRWR_SC | tWRWR_SD | tWRWR_DD | tWRWR_SCL | tCKE |
|-------|----------|----------|----------|-----------|------|
| 1     | 1        | 6        | 6        | 3         | 1    |

以下是使用[AIDA64 Extreme](https://www.aida64.com/) 6.20.5300测试内存的读、写、复制和延迟的结果：

|                  | Trial 1 | Trial 2 | Trial 3 | Trial 4 | Trial 5 | **Avg**   |
|------------------|---------|---------|---------|---------|---------|-----------|
| **读（MB/s）**   | 56468   | 56516   | 56225   | 56240   | 56134   | **56317** |
| **写（MB/s）**   | 29808   | 29804   | 29805   | 29809   | 29809   | **29807** |
| **复制（MB/s）** | 53963   | 53840   | 54364   | 53877   | 54139   | **54037** |
| **延迟 (ns)**    | 65.7    | 65.6    | 65.8    | 65.9    | 65.9    | **65.8**  |

### 挑战3800CL12！
* 1.6V? Meh
* 1.65V? Meh
* 1.7V? Meh
* 1.75V? Meh
* **1.8V**? 终于可以开机并测速了！

<img src="https://user-images.githubusercontent.com/14539571/95685334-16384900-0bac-11eb-8c31-b1dda1969c7d.png" alt="3800CL12 tested in AIDA64" width="500"/>

（稳定性就当是不存在😂）