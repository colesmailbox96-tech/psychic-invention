import { DataLogger } from './DataLogger';
import { MetricsCollector } from './MetricsCollector';

export class ExportManager {
  static exportJSON(logger: DataLogger, metrics: MetricsCollector): string {
    return JSON.stringify({
      actionLogs: logger.getActionLogs(),
      populationEvents: logger.getPopulationEvents(),
      metrics: metrics.getMetrics(),
    }, null, 2);
  }

  static downloadJSON(logger: DataLogger, metrics: MetricsCollector, filename?: string): void {
    const json = ExportManager.exportJSON(logger, metrics);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename ?? `living-worlds-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static exportCSV(logger: DataLogger): string {
    const logs = logger.getActionLogs();
    if (logs.length === 0) return '';

    const header = 'tick,entityId,generation,action,success,reward\n';
    const rows = logs.map(l =>
      `${l.tick},${l.entityId},${l.generation},${l.action},${l.success},${l.reward.toFixed(4)}`
    ).join('\n');

    return header + rows;
  }
}
