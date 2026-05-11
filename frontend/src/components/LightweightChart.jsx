import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const LightweightChart = ({ symbol, data, finnhubKey }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    let chart = null;

    const initChart = () => {
      const w = container.clientWidth;
      const h = 360;
      if (chart || w <= 0) return;

      const chartOptions = {
        width: w,
        height: h,
        layout: {
          textColor: '#94a3b8',
          background: { type: 'solid', color: 'transparent' },
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: 'rgba(51, 65, 85, 0.4)' },
          horzLines: { color: 'rgba(51, 65, 85, 0.4)' },
        },
        crosshair: { mode: 0 },
        rightPriceScale: { borderColor: 'rgba(51, 65, 85, 0.4)' },
        timeScale: {
          borderColor: 'rgba(51, 65, 85, 0.4)',
          timeVisible: true,
          secondsVisible: false,
          lockVisibleTimeRangeOnResize: true,
        },
        handleScroll: false,
        handleScale: false,
        watermark: {
          color: 'rgba(255, 255, 255, 0.05)',
          visible: true,
          text: 'TRADER VISION',
          fontSize: 48,
          horzAlign: 'center',
          vertAlign: 'center',
        },
      };

      chart = createChart(container, chartOptions);
      chartRef.current = chart;

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });
      seriesRef.current = candlestickSeries;

      if (data && data.length > 0) {
        candlestickSeries.setData(data);
        setTimeout(() => {
          if (chartRef.current) chartRef.current.timeScale().fitContent();
        }, 50);
      }

      if (finnhubKey) {
        const ws = new WebSocket(`wss://ws.finnhub.io?token=${finnhubKey}`);
        wsRef.current = ws;
        ws.onopen = () => ws.send(JSON.stringify({ type: 'subscribe', symbol }));
        ws.onmessage = (event) => {
          const response = JSON.parse(event.data);
          if (response.type === 'trade' && response.data && seriesRef.current) {
            response.data.forEach(trade => {
              const tradeTime = Math.floor(trade.t / 1000);
              const currentData = seriesRef.current.data();
              if (currentData.length > 0) {
                const lastCandle = currentData[currentData.length - 1];
                const isSameMinute = Math.floor(lastCandle.time / 60) === Math.floor(tradeTime / 60);
                if (isSameMinute) {
                  seriesRef.current.update({ time: lastCandle.time, open: lastCandle.open, high: Math.max(lastCandle.high, trade.p), low: Math.min(lastCandle.low, trade.p), close: trade.p });
                } else {
                  const alignedTime = Math.floor(tradeTime / 60) * 60;
                  seriesRef.current.update({ time: alignedTime, open: trade.p, high: trade.p, low: trade.p, close: trade.p });
                }
              }
            });
          }
        };
        ws.onerror = (e) => console.error('WebSocket Error:', e);
        ws.onclose = () => console.warn('WebSocket Closed');
      }
    };

    // Use ResizeObserver to wait until container has a valid size before initializing
    const observer = new ResizeObserver(() => {
      if (!chart && container.clientWidth > 0) {
        initChart();
      }
    });
    observer.observe(container);
    initChart(); // Also try immediately

    return () => {
      observer.disconnect();
      if (wsRef.current) {
        const ws = wsRef.current;
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
        }
        ws.close();
        wsRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol, data, finnhubKey]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full rounded-xl overflow-hidden"
      style={{ height: 360 }}
    />
  );
};

export default LightweightChart;
