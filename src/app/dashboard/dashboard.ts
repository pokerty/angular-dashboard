import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { testquery } from '../../scripts/index';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [BaseChartDirective, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  testData = testquery();
  isBrowser = false;
  lobCategories: string[] = [];
  lobChartData: { [lob: string]: any } = {};
  lobFcvmPercentages: { [lob: string]: number } = {};
  lobTotalCounts: { [lob: string]: number } = {};
  lobFcvmCounts: { [lob: string]: number } = {};
  
  // Chart configuration templates
  public chartType = {
    pie: 'pie' as const,
    bar: 'bar' as const
  };

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.initializeLobCategories();
      this.updateChartsForAllLobs();
      this.calculateFcvmPercentages();
    }
  }

  private initializeLobCategories(): void {
    // Get unique LOB categories
    const lobs = new Set(this.testData.map(item => item.lob));
    this.lobCategories = Array.from(lobs).sort();
    
    // Initialize chart data for each LOB
    this.lobCategories.forEach(lob => {
      this.lobChartData[lob] = {
        pieChartData: {
          labels: [],
          datasets: [{
            data: [],
            backgroundColor: [
              '#FF6384',
              '#36A2EB', 
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40'
            ]
          }]
        },
        pieChartOptions: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: `${lob} - Infrastructure Types Distribution`
            }
          }
        },
        barChartData: {
          labels: [],
          datasets: [{
            label: 'Items Created',
            data: [],
            backgroundColor: '#36A2EB',
            borderColor: '#1f77b4',
            borderWidth: 1
          }]
        },
        barChartOptions: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: `${lob} - Items Created Per Month`
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      };
    });
  }

  private updateChartsForAllLobs(): void {
    this.lobCategories.forEach(lob => {
      this.updatePieChartForLob(lob);
      this.updateBarChartForLob(lob);
    });
  }

  private updatePieChartForLob(lob: string): void {
    // Filter data for this LOB
    const lobData = this.testData.filter(item => item.lob === lob);
    
    // Count occurrences of each infra_type for this LOB
    const infraTypeCounts: { [key: string]: number } = {};
    
    lobData.forEach(item => {
      const infraType = item.infra_type || 'Unknown';
      infraTypeCounts[infraType] = (infraTypeCounts[infraType] || 0) + 1;
    });

    // Update chart data
    this.lobChartData[lob].pieChartData.labels = Object.keys(infraTypeCounts);
    this.lobChartData[lob].pieChartData.datasets[0].data = Object.values(infraTypeCounts);
  }

  private updateBarChartForLob(lob: string): void {
    // Filter data for this LOB
    const lobData = this.testData.filter(item => item.lob === lob);
    
    // Count occurrences per month for this LOB
    const monthlyCounts: { [key: string]: number } = {};
    
    lobData.forEach(item => {
      if (item.createdtime) {
        const date = new Date(item.createdtime);
        const monthYear = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
      }
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyCounts).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    // Update chart data
    this.lobChartData[lob].barChartData.labels = sortedMonths;
    this.lobChartData[lob].barChartData.datasets[0].data = sortedMonths.map(month => monthlyCounts[month]);
  }

  private calculateFcvmPercentages(): void {
    this.lobCategories.forEach(lob => {
      const lobData = this.testData.filter(item => item.lob === lob);
      const totalItems = lobData.length;
      const fcvmItems = lobData.filter(item => item.infra_type === 'FCVM').length;
      
      this.lobTotalCounts[lob] = totalItems;
      this.lobFcvmCounts[lob] = fcvmItems;
      this.lobFcvmPercentages[lob] = totalItems > 0 ? Math.round((fcvmItems / totalItems) * 100) : 0;
    });
  }
}
