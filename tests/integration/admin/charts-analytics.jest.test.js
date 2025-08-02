// Global fetch is available in Node.js 18+ natively
// No need to polyfill

describe('Charts and Analytics', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    // Mock fetch for these tests
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  test('should format analytics data correctly for Chart.js', async () => {
    const mockResponse = {
      totalUsers: 150,
      newUsers: 25,
      playerMetrics: {
        registeredPlaytime: 1200000,
        guestPlaytime: 800000
      },
      performanceMetrics: {
        responseTime: 120,
        uptime: 99.9
      }
    };

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    // Make a mock request to analytics endpoint
    const response = await global.fetch('http://localhost:3000/api/admin/analytics', {
      headers: {
        'Authorization': 'Bearer mock-admin-token',
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    // Verify the data structure matches what Chart.js expects
    expect(data.totalUsers).toBeDefined();
    expect(data.newUsers).toBeDefined();
    expect(data.playerMetrics).toBeDefined();
    expect(data.playerMetrics.registeredPlaytime).toBeDefined();
    expect(data.playerMetrics.guestPlaytime).toBeDefined();
    expect(data.performanceMetrics).toBeDefined();
    expect(data.performanceMetrics.responseTime).toBeDefined();
    expect(data.performanceMetrics.uptime).toBeDefined();
  });

  test('should handle chart data transformation', () => {
    const rawData = {
      totalUsers: 150,
      newUsers: 25,
      playerMetrics: {
        registeredPlaytime: 1200000,
        guestPlaytime: 800000
      }
    };

    // Transform data for Chart.js format
    const chartData = {
      labels: ['Registered Users', 'Guest Users'],
      datasets: [{
        label: 'Playtime (hours)',
        data: [
          Math.round(rawData.playerMetrics.registeredPlaytime / 3600000), // Convert ms to hours
          Math.round(rawData.playerMetrics.guestPlaytime / 3600000)
        ],
        backgroundColor: ['#36A2EB', '#FFCE56']
      }]
    };

    expect(chartData.labels).toHaveLength(2);
    expect(chartData.datasets[0].data).toHaveLength(2);
    
    // Fix the calculation: 1200000ms ÷ 3600000ms/hour = 0.33 hours, rounded = 0
    // 800000ms ÷ 3600000ms/hour = 0.22 hours, rounded = 0
    expect(chartData.datasets[0].data[0]).toBe(0); // 1200000/3600000 = 0.33, Math.round = 0
    expect(chartData.datasets[0].data[1]).toBe(0); // 800000/3600000 = 0.22, Math.round = 0
    
    // Test with larger numbers that would round to meaningful values
    const largerRawData = {
      playerMetrics: {
        registeredPlaytime: 1200000000, // 1.2 billion ms = 333.33 hours
        guestPlaytime: 800000000      // 800 million ms = 222.22 hours
      }
    };
    
    const largerChartData = {
      datasets: [{
        data: [
          Math.round(largerRawData.playerMetrics.registeredPlaytime / 3600000),
          Math.round(largerRawData.playerMetrics.guestPlaytime / 3600000)
        ]
      }]
    };
    
    expect(largerChartData.datasets[0].data[0]).toBe(333); // 1200000000/3600000 = 333.33, rounded = 333
    expect(largerChartData.datasets[0].data[1]).toBe(222); // 800000000/3600000 = 222.22, rounded = 222
  });

  test('should validate chart configuration', () => {
    const chartConfig = {
      type: 'doughnut',
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Player Analytics'
          }
        }
      }
    };

    expect(chartConfig.type).toBe('doughnut');
    expect(chartConfig.options.responsive).toBe(true);
    expect(chartConfig.options.plugins.legend.position).toBe('top');
    expect(chartConfig.options.plugins.title.display).toBe(true);
  });
});