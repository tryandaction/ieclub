
// ==================== src/utils/metrics.js ====================
/**
 * 业务指标监控
 */
class Metrics {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.startTime = Date.now();
  }

  /**
   * 增加计数器
   */
  increment(key, value = 1, labels = {}) {
    const labelKey = this.getLabelKey(key, labels);
    const current = this.counters.get(labelKey) || 0;
    this.counters.set(labelKey, current + value);
  }

  /**
   * 设置仪表值
   */
  gauge(key, value, labels = {}) {
    const labelKey = this.getLabelKey(key, labels);
    this.gauges.set(labelKey, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * 记录直方图数据
   */
  histogram(key, value, labels = {}) {
    const labelKey = this.getLabelKey(key, labels);
    const data = this.histograms.get(labelKey) || [];
    data.push({ value, timestamp: Date.now() });
    
    // 只保留最近1000个数据点
    if (data.length > 1000) {
      data.shift();
    }
    
    this.histograms.set(labelKey, data);
  }

  /**
   * 计时器
   */
  timer(key, labels = {}) {
    const start = Date.now();
    
    return {
      end: () => {
        const duration = Date.now() - start;
        this.histogram(`${key}_duration`, duration, labels);
        return duration;
      }
    };
  }

  /**
   * 获取标签键
   */
  getLabelKey(key, labels) {
    if (Object.keys(labels).length === 0) return key;
    
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    
    return `${key}{${labelStr}}`;
  }

  /**
   * 获取所有指标
   */
  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: this.getHistogramStats(),
      system: this.getSystemMetrics()
    };
  }

  /**
   * 获取直方图统计
   */
  getHistogramStats() {
    const stats = {};
    
    for (const [key, data] of this.histograms) {
      const values = data.map(d => d.value).sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      const count = values.length;
      
      stats[key] = {
        count,
        sum,
        avg: sum / count,
        min: values[0],
        max: values[count - 1],
        p50: this.percentile(values, 50),
        p95: this.percentile(values, 95),
        p99: this.percentile(values, 99)
      };
    }
    
    return stats;
  }

  /**
   * 计算百分位数
   */
  percentile(sortedValues, percentile) {
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[index];
  }

  /**
   * 获取系统指标
   */
  getSystemMetrics() {
    const usage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
        rss: Math.round(usage.rss / 1024 / 1024)
      },
      cpu: {
        user: Math.round(cpuUsage.user / 1000),
        system: Math.round(cpuUsage.system / 1000)
      },
      eventLoop: {
        delay: this.getEventLoopDelay()
      }
    };
  }

  /**
   * 获取事件循环延迟
   */
  getEventLoopDelay() {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delay = Number(process.hrtime.bigint() - start) / 1000000;
      this.gauge('event_loop_delay', delay);
    });
    return this.gauges.get('event_loop_delay')?.value || 0;
  }

  /**
   * 重置所有指标
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  /**
   * 导出Prometheus格式
   */
  exportPrometheus() {
    let output = '';
    
    // 导出计数器
    for (const [key, value] of this.counters) {
      output += `# TYPE ${key} counter\n`;
      output += `${key} ${value}\n`;
    }
    
    // 导出仪表
    for (const [key, data] of this.gauges) {
      output += `# TYPE ${key} gauge\n`;
      output += `${key} ${data.value}\n`;
    }
    
    return output;
  }
}

module.exports = new Metrics();