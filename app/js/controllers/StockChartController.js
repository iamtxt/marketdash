'use strict';

/**
 * Stock Chart Controller
 */
angular.module('stockWatcher.Controllers')
.controller('StockChartController', ['$scope', '$interval', '$timeout', '$element', '$attrs', 'stockService', 'errorMessages',
    function ($scope, $interval, $timeout, $element, $attrs, stockService, errorMessages) {

      // Set the default refresh interval for the table:
      $scope.refreshInterval = 60;

      // Set the ID of the <div> containing the chart (to be used by HighStocks library for drawing graph):
      var containerID = 'container' + $scope.symbol.replace('.', '');
      
      $scope.containerID = containerID;

      // "Open" price for the chart:
      $scope.yesterdayClosePrice = undefined;

      // "Chart" object to be used by HighStocks library for storing graph properties:
      $scope.chart = undefined;

      // Promise defined when "initGraph()" fails to receive data:
      $scope.initGraphPromise = undefined;

      // Promise defined when "updateGraph()" fails to receive data:
      $scope.updateGraphPromise = undefined;

      // Reset the Chart's Range Selector after the next redraw?
      var resetRangeSelector = true;



      /**
       * Fetches the "Previous Day's Close" price for the current stock.
       * @return {void} Executes a promise that, when resolved, sets the "yesterdayClosePrice" for the current stock.
       * @todo Add a timed "$interval" for this to be called regularly (i.e. at least at opening time each trade day).
       */
      var fetchPreviousDayClosePrice = function() {
        var symbols = [$scope.symbol];

        var promise = stockService.getCurrentDataWithDetails(symbols);
        promise.then(
            function (data) {
              if (data.query.count > 0) {
                var updatedClosePrice = data.query.results.quote.PreviousClose;

                // Prevent unnecessary redrawing of "Previous Close" Trendline:
                if (updatedClosePrice !== $scope.yesterdayClosePrice) {
                  $scope.yesterdayClosePrice = updatedClosePrice;

                  drawOpenPlotLine();
                }
              }
            },
            function (reason) {
              // If an error was detected, try fetching the data once again:
              fetchPreviousDayClosePrice();

              if (reason) {
                var printError = true;

                if (typeof reason.error !== 'undefined') {
                  if (reason.error === errorMessages.NoData.Error) {
                    printError = false;
                  }
                }

                if (printError) {
                  console.error('Error while fetching data', reason);
                }
              }
            }
        );
      };
      fetchPreviousDayClosePrice();


      /**
       * Creates the "chart" object using the "Highcharts" library.
       * @param  {Array<Array<Date,int>>} dataRows The initial dataset of values to plot on the chart.
       * @return {void}
       */
      var createGraph = function(dataRows) {
        $scope.chart = new Highcharts.StockChart({
          chart: {
            renderTo: containerID,
            backgroundColor:'rgba(249, 249, 249, 0.5)'
          },
          title: {
            text: $scope.symbol + ' Stock Price'
          },
          credits: {
            enabled: false
          },
          rangeSelector: {
            buttons: [{
              type: 'hour',
          count: 12,
          text: '1d'
            },{
              type: 'day',
        count: 2,
        text: '2d'
            },{
              type: 'day',
              count: 5,
              text: '7d'
            },{
              type: 'day',
              count: 120,
              text: '1m'
            },{
              type: 'all',
              text: 'All'
            }],
            selected: 2,
            allButtonsEnabled: true
          },
          xAxis: {
            events: {
              setExtremes: function(e) {
                if (typeof e.rangeSelectorButton === 'undefined') {
                  return;

                }


                var clickedButtonIndex = undefined;
                var clickedButtonOptions = undefined;
                for (var i = 0, nbButtons = $scope.chart.rangeSelector.buttonOptions.length; i < nbButtons; i++) {
                  var button = $scope.chart.rangeSelector.buttonOptions[i];
                  if (button.text === e.rangeSelectorButton.text && button.type === e.rangeSelectorButton.type) {
                    clickedButtonIndex = i;
                    clickedButtonOptions = button;

                    break;
                  }
                }

                if (clickedButtonIndex !== $scope.chart.rangeSelector.selected
                    && e.trigger === 'rangeSelectorButton') {
                      e.preventDefault();


                      if (clickedButtonIndex > 2) {
                        var newInterval = undefined;
                        var newPeriod = undefined;
                        switch (clickedButtonOptions.type) {
                          case 'month':
                            newInterval = 60*30;
                            newPeriod = clickedButtonOptions.count + 'M';
                            break;

                          case 'ytd':
                            newInterval = 60*60*24;
                            newPeriod = '12M';
                            break;
                        }

                        if (typeof newPeriod !== 'undefined') {
                          interval = newInterval;
                          period = newPeriod;

                          //$scope.chart.rangeSelector.clickButton(clickedButtonIndex, $scope.chart.rangeSelector.buttonOptions[clickedButtonIndex], true);
                        }
                      } else {
                        interval = 60;
                        period = '10d';
                      }

                      // Set the flag to redraw the Chart's RangeSelector after data is received:
                      resetRangeSelector = true;

                      // Show a "Loading..." message overlayed on top of the chart:
                      $scope.chart.showLoading();

                      $scope.updateGraph();
                    }
              }
            }
          },
          series: [{
            name: $scope.symbol,
            type: 'area',
            data: dataRows,
            //gapSize: 2,
            tooltip: {
              valueDecimals: 2
            },
            fillColor: {
              linearGradient: {
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 1
              },
              stops: [
                [0, Highcharts.getOptions().colors[0]],
              [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                ]
            },
            threshold: null
          }]
        });

        var chartButtons = $scope.chart.rangeSelector.buttons;

        if (typeof $scope.yesterdayClosePrice !== 'undefined') {
          drawOpenPlotLine();
        }
      };



      /**
       * Kick off the initialization of the chart and the loading of the initil data.
       */
      var bootstrap = function() {
        // Kick off the request for data to fill the chart and remove the 
        // "Loading..." message (hopefully the chart will have been created once
        // the data is received):
        initGraph();

        // Create the graph a first time, with empty data:
        createGraph([null]);
        // Show a "Loading..." message overlayed on top of the chart:
        $scope.chart.showLoading();
      };
      $timeout(bootstrap, 0);





      var symbol = $scope.symbol.replace('.TO', '').replace('-','.');
      var exchange = $scope.symbol.indexOf('TO') > -1 ? 'TSE' : null;
      var interval = 60;
      var period = '10d';
      // Google Finance URL for this stock would be:
      // http://www.google.com/finance/getprices?q=T&x=TSE&i=60&p=10d&f=d,c,v,k,o,h,l&df=cpct&auto=0&ei=Ef6XUYDfCqSTiAKEMg

      var initGraph = function() {
        var promise = stockService.getLiveData(symbol, exchange, interval, period);
        promise.then(
            function (data) {
              if (data && data.length > 0) {
                // Hide the "Loading..." message overlayed on top of the chart:
                $scope.chart.hideLoading();

                // Recreate the chart with the new data:
                createGraph(data);
              } else {
                console.warn('"' + symbol + '" init did not receive data, refreshing it.');
                $scope.initGraphPromise = $timeout(initGraph, 1000);
              }
            },
            function (reason) {
              // If an error was detected, try fetching the data once again:
              initGraph();

              if (reason.error !== errorMessages.NoData.Error) {
                console.error(reason);
              }
            }
        ).then(
          function (data) {
            var now = new Date();
            var dividendHistoryStartDate = '2014-01-01';
            var dividendHistoryEndDate = [
          now.getFullYear(),
        (now.getMonth() + 1 < 10 ? '0' : '') + (now.getMonth() + 1),
        (now.getDate() < 10 ? '0' : '') + (now.getDate())
          ].join('-');

        var dividendsPromise = stockService.getDividendHistoryForStock(symbol, dividendHistoryStartDate, dividendHistoryEndDate);
        dividendsPromise.then(
          function (dividendData) {
            var newData = [];
            var chartExtremes = $scope.chart.xAxis[0].getExtremes();
            for (var i = 0, nbDividends = dividendData.length; i < nbDividends; i++) {
              var dividend = dividendData[i];

              var formattedDividendData = {
                x: dividend.Date, // new Date(new Date().getTime() - 40000000)
                title: "Dividend:<br />" + parseFloat(dividend.Dividends, 10).toFixed(4) + '$',
          text: 'Dividend Pay Date'
              };

              if (formattedDividendData.x > chartExtremes.min && formattedDividendData.x < chartExtremes.max) {
                newData.push(formattedDividendData);
              }
            }

            if (newData.length > 0) {
              $scope.chart.addSeries({
                name: 'Dividends',
                type: 'flags',
                data: newData,
                color: Highcharts.getOptions().colors[0], // same as onSeries
                fillColor: Highcharts.getOptions().colors[0],
                onSeries: 'dataseries',
                width: 60,
                style: { // text style
                  color: 'white'
                },
                states: {
                  hover: {
                    fillColor: '#395C84' // darker
                  }
                }
              });
            }
          },

        function (reason) {
          // 
        }
        );
          }
        );
      };
      //initGraph();

      /**
       * Updates the chart with new data.
       * @return {void}
       */
      $scope.updateGraph = function() {
        var promise = stockService.getLiveData(symbol, exchange, interval, period);
        promise.then(
            function (data) {
              //console.log('Updating graph for "' + symbol + '"');

              if (data && data.length > 0) {
                setGraphData(data);
              } else {
                console.warn('"' + symbol + '" update did not receive data, refreshing it.');
                $scope.updateGraphPromise = $timeout($scope.updateGraph, 1000);
              }
            },
            function (reason) {
              // If an error was detected, try fetching the data once again:
              $scope.updateGraph();

              if (reason.error !== errorMessages.NoData.Error) {
                console.error(reason);
              }
            }
            );
      }

      var setGraphData = function(data) {
        var serie = $scope.chart.series[0];
        serie.setData(data, !resetRangeSelector);

        //if (typeof $scope.yesterdayClosePrice !== 'undefined') {
        //	drawOpenPlotLine();
        //}

        //$scope.chart.redraw();

        if (resetRangeSelector) {
          $scope.chart.xAxis[0].setExtremes();
          resetRangeSelector = false;

          $scope.chart.redraw();

          // Hide the "Loading..." message overlayed on top of the chart:
          $scope.chart.hideLoading();
        }
      };


      /**
       * Draws the "Previous Close" Trendline on the chart.
       * @return {void}
       */
      var drawOpenPlotLine = function() {
        if (typeof $scope.chart !== 'undefined') {
          var previousClose = $scope.yesterdayClosePrice;
          //console.log('Drawing "Open" PlotLine for "%s" ($%s)', $scope.symbol, previousClose);

          var openPlotLineID = $scope.symbol + '-previousClose',
              chartYAxis = $scope.chart.yAxis[0];

          chartYAxis.removePlotLine(openPlotLineID);
          chartYAxis.addPlotLine({
            color: 'red',
            dashStyle: 'LongDash',
            id: openPlotLineID,
            label: {
              text: 'Prev Close ($' + previousClose + ')'
                      },
                      width: 1,
                      zIndex: 3,
                      value: previousClose
                      });
              }
              };




              $scope.createRefresher = function() {
                return $interval(function() {
                  $scope.updateGraph();
                }, $scope.refreshInterval*1000);
              };

              $scope.createPreviousCloseRefresher = function() {
                return $interval(function() {
                  fetchPreviousDayClosePrice();
                }, $scope.refreshInterval*1000);
              };

              $scope.destroyRefresher = function() {
                // Cancel "refresher":
                if (typeof $scope.refresher !== 'undefined') {
                  $interval.cancel($scope.refresher);
                  $scope.refresher = undefined;
                }

                // Cancel "previousCloseRefresher":
                if (typeof $scope.previousCloseRefresher !== 'undefined') {
                  $interval.cancel($scope.previousCloseRefresher);
                  $scope.previousCloseRefresher = undefined;
                }
              };

              $scope.refreshIntervalChanged = function() {
                $scope.destroyRefresher();
                $scope.createRefresher();
              };

              $scope.refresher = $scope.createRefresher();
              $scope.previousCloseRefresher = $scope.createPreviousCloseRefresher();


              /**
               * Called on exit of the Controller, when it is destroyed.
               * Opportunity to destroy the remaining resources and free up memory.
               */
              $scope.$on('$destroy', function() {
                // Make sure that the "refresher" $interval is destroyed:
                $scope.destroyRefresher();


                // Destroy the "initGrap" $timeout Promise, if it is set:
                if (typeof $scope.initGraphPromise !== 'undefined') {
                  $timeout.cancel($scope.initGraphPromise);
                  $scope.initGraphPromise = undefined;
                }

                // Destroy the "updateGraph" $timeout Promise, if it is set:
                if (typeof $scope.updateGraphPromise !== 'undefined') {
                  $timeout.cancel($scope.updateGraphPromise);
                  $scope.updateGraphPromise = undefined;
                }


                // Removes the chart and purges memory:
                if (typeof $scope.chart !== 'undefined') {
                  $scope.chart.destroy();
                }
              });
    }]);
