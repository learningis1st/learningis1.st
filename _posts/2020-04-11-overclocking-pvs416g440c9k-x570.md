---
layout: post
title:  "挑战B-Die内存超频：3733CL14烧机稳定，3800CL12起死回生！"
categories: blog
---

<div id="google_translate_element"></div>

<script type="text/javascript">
function googleTranslateElementInit() {
  new google.translate.TranslateElement({pageLanguage: 'zh'}, 'google_translate_element');
}
</script>

<script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>

<br>

在隔离期间，找到了一个消遣的方式：超频内存。这是我在Newegg购买的两条[Patriot Viper Steel](https://viper.patriotmemory.com/products/viper-steel-ddr4-performance-memory-ram-viper-gaming-by-patriot-memory)内存条，型号[PVS416G440C9K](https://assets.website-files.com/5cdb2ee0b102f96c3906500f/5dd6b314aa0dd278b0b6efc6_PVS416G440C9K%20Sku%20Sheet_Copyable_062819.pdf)，XMP 1的有效速度达4400MT/s，时序19-19-19-39，电压1.45V：

<img src="/images/viper-steel.webp" alt="包装" width="500"/>

显然，由于Infinity Fabric的限制，X570平台无法充分利用这个XMP。不久前，我超频了 G.Skill Trident Z Neo（F4-3600C16D-32GTZNC），这是专为Ryzen 3000系列优化的内存条。关于此经历的详细信息，请查看[这篇博文](../../../../blog/2019/10/22/overclocking-f4-3600c16d-32gtznc-x570.html)。

### 挑战3733CL14！
让我们直接看数据吧！

> 注：
> 
> * 默认情况下Gear Down Mode是开启的，所以我跳过了奇数tCL的值。
> * 关闭了Power Down Mode。
> * VDDP电压设置为900mV；VDDG电压设置为1050mV。
> * 内存电压（VDDR）首先调整到 1.5V，如果不够稳定再逐渐增加。
> * tRRDS = 4, tRRDL = 4, tFAW = 16, tWR = 10

MemClk = FClk = 1867MHz（内存有效速度为**3733MT/s**）

| **tCL**     | 16   | 14   | 14   | 14   | 14   | **14**  | 14   |
| **tRCD(RD)**| 16   | 14   | 15   | 15   | 15   | **15**  | 15   |
| **tRP**     | 16   | 14   | 14   | 13   | 12   | **11**  | 10   |
| **tRAS**    | 32   | 28   | 29   | 29   | 29   | **29**  | 29   |
| **是否POST？** | POST | POST | POST | POST | POST | POST | 无POST |
| **是否稳定？** | 稳定| 不稳定 | 稳定 | 稳定 | 稳定 | 稳定（@1.53V） | - |

有趣的地方在于：
1. tRCDRD 似乎遇到了瓶颈，无论加多少电压都无济于事（可能这是 X570 平台的限制？）。
2. B-Die 的 tRP 居然可以设置这么低......

根据以上测试结果，最紧且稳定的**主要时序**（primary timings）为**14-15-11-29-1T**。

适当调整的**第二时序/次要时序**（secondary timings）：

| tRC | tWR | tCWL | tRRDS | tRRDL   | tWTRS | tWTRL | tRFC | tRTP | tFAW |
|-----|-----|------|-------|---------|-------|-------|------|------|------|
| 40  | 10  | 12   | 4     | 4       | 4     | 8     | 243  | 8    | 16   |

适当调整的**第三时序**（tertiary timings）:

| tRDWR | tRDRD_SC | tRDRD_SD | tRDRD_DD | tRDRD_SCL |
|-------|----------|----------|----------|-----------|
| 8     | 1        | 4        | 4        | 3         |

（续）

| tWRRD | tWRWR_SC | tWRWR_SD | tWRWR_DD | tWRWR_SCL | tCKE |
|-------|----------|----------|----------|-----------|------|
| 1     | 1        | 6        | 6        | 3         | 1    |

以下是使用 [AIDA64 Extreme](https://www.aida64.com/) 6.20.5300 测试内存读取、写入、复制和延迟的结果：

|                 | 试验 1 | 试验 2 | 试验 3 | 试验 4 | 试验 5 | **平均值** |
|-----------------|-------|-------|-------|-------|-------|-----------|
| **读 (MB/s)**   | 56468 | 56516 | 56225 | 56240 | 56134 | **56317** |
| **写 (MB/s)**   | 29808 | 29804 | 29805 | 29809 | 29809 | **29807** |
| **复制 (MB/s)** | 53963 | 53840 | 54364 | 53877 | 54139 | **54037** |
| **延迟 (ns)**   | 65.7  | 65.6  | 65.8  | 65.9  | 65.9  | **65.8**  |

### 挑战3800CL12！
* 1.6V? Meh
* 1.65V? Meh
* 1.7V? Meh
* 1.75V? Meh
* **1.8V**? 终于可以开机并测速了！

<img src="/images/aida64-3800cl12.webp" alt="3800CL12 tested in AIDA64" width="500"/>

（稳定性就当不存在吧 😂）