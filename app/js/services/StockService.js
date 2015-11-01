'use strict';

angular.module('stockWatcher.Services')
	.factory('stockService', ['$q', '$http', '$timeout', 'appConfig', 'errorMessages', 
		function($q, $http, $timeout, appConfig, errorMessages) {
		
		// See note about known Yahoo! Finance API bugs:
		// https://developer.yahoo.com/forum/General-Discussion-at-YDN/Stock-Quote-API-returning-commas-in/1234765072000-6036c128-a7e0-3aa5-9e72-1af1871e1b41/
		var yahooAPITags = [
			['a0', 'Ask'],                                  // Ask
			['a2', 'AverageDailyVolume'],                   // Average Daily Volume
			['a5', 'AskSize'],                              // Ask Size
			['b0', 'Bid'],                                  // Bid
			['b2', 'AskRealTime'],                          // Ask (Real-time)
			['b3', 'BidRealTime'],                          // Bid (Real-time)
			['b4', 'BookValue'],                            // Book Value
			['b6', 'BidSize'],                              // Bid Size
			['c0', 'ChangeAndPercentChange'],               // Change & Percent Change
			['c1', 'Change'],                               // Change
			['c3', 'Commission'],                           // Commission
			['c4', 'Currency'],                             // Currency
			['c6', 'ChangeRealTime'],                       // Change (Real-time)
			['c8', 'AfterHoursChangeRealTime'],             // After Hours Change (Real-time)
			['d0', 'DividendPerShare'],                     // Dividend/Share
			['d1', 'LastTradeDate'],                        // Last Trade Date
			['d2', 'TradeDate'],                            // Trade Date
			['e0', 'EarningsPerShare'],                     // Earnings/Share
			['e1', 'ErrorIndication'],                      // Error Indication (returned for symbol changed/invalid)
			['e7', 'EPSEstimateCurrentYear'],               // EPS Estimate Current Year
			['e8', 'EPSEstimateNextYear'],                  // EPS Estimate Next Year
			['e9', 'EPSEstimateNextQuarter'],               // EPS Estimate Next Quarter
			['f0', 'TradeLinksAdditional'],               // Trade Links Additional --> not available for all stocks outside of the US.
			['f6', 'FloatShares'],                        // Float Shares --> Comma-related bug in Yahoo! Finance API
			['h0', 'DaysHigh'],                             // Day's High
			['j0', '_52WeekLow'],                           // 52-week Low
			['k0', '_52WeekHigh'],                          // 52-week High
			['g0', 'DaysLow'],                              // Day's Low
			['g1', 'HoldingsGainPercent'],                  // Holdings Gain Percent
			['g3', 'AnnualizedGain'],                       // Annualized Gain
			['g4', 'HoldingsGain'],                         // Holdings Gain
			['g5', 'HoldingsGainPercentRealTime'],          // Holdings Gain Percent (Real-time)
			['g6', 'HoldingsGainRealTime'],                 // Holdings Gain (Real-time)
			['i0', 'MoreInfo'],                             // More Info
			['i5', 'OrderBookRealTime'],                    // Order Book (Real-time)
			['j0', 'YearLow'],                              // Year Low
			['j1', 'MarketCapitalization'],                 // Market Capitalization
			['j2', 'SharesOutstanding'],                  // Shares Outstanding --> Comma-related bug in Yahoo! Finance API
			['j3', 'MarketCapRealTime'],                    // Market Cap (Real-time)
			['j4', 'EBITDA'],                               // EBITDA
			['j5', 'ChangeFrom52WeekLow'],                  // Change From 52-week Low
			['j6', 'PercentChangeFrom52WeekLow'],           // Percent Change From 52-week Low
			['k0', 'YearHigh'],                             // Year High
			['k1', 'LastTradeRealTimeWithTime'],            // Last Trade (Real-time) With Time
			['k2', 'ChangePercentRealTime'],                // Change Percent (Real-time)
			['k3', 'LastTradeSize'],                      // Last Trade Size --> not available for all stocks outside of the US.
			['k4', 'ChangeFrom52WeekHigh'],                 // Change From 52-week High
			['k5', 'PercentChangeFrom52WeekHigh'],          // Percent Change from 52-week High
			['l0', 'LastTradeWithTime'],                    // Last Trade (With Time)
			['l1', 'LastTradePriceOnly'],                   // Last Trade (Price Only)
			['l2', 'HighLimit'],                            // High Limit
			['l3', 'LowLimit'],                             // Low Limit
			['m0', 'DaysRange'],                            // Day's Range
			['m2', 'DaysRangeRealTime'],                    // Day's Range (Real-time)
			['m3', '_50DayMovingAverage'],                  // 50-day Moving Average
			['m4', '_200DayMovingAverage'],                 // 200-day Moving Average
			['m5', 'ChangeFrom200DayMovingAverage'],        // Change From 200-day Moving Average
			['m6', 'PercentChangeFrom200DayMovingAverage'], // Percent Change From 200-day Moving Average
			['m7', 'ChangeFrom50DayMovingAverage'],         // Change From 50-day Moving Average
			['m8', 'PercentChangeFrom50DayMovingAverage'],  // Percent Change From 50-day Moving Average
			['n0', 'Name'],                                 // Name
			['n4', 'Notes'],                                // Notes
			['o0', 'Open'],                                 // Open
			['p0', 'PreviousClose'],                        // Previous Close
			['p1', 'PricePaid'],                            // Price Paid
			['p2', 'ChangeInPercent'],                      // Change in Percent
			['p5', 'PricePerSales'],                        // Price/Sales
			['p6', 'PricePerBook'],                         // Price/Book
			['q0', 'ExDividendDate'],                       // Ex-Dividend Date
			['r0', 'PERatio'],                              // P/E Ratio
			['r1', 'DividendPayDate'],                      // Dividend Pay Date
			['r2', 'PERatioRealTime'],                      // P/E Ratio (Real-time)
			['r5', 'PEGRatio'],                             // PEG Ratio
			['r6', 'PricePerEPSEstimateCurrentYear'],       // Price/EPS Estimate Current Year
			['r7', 'PricePerEPSEstimateNextYear'],          // Price/EPS Estimate Next Year
			['s0', 'Symbol'],                               // Symbol
			['s1', 'SharesOwned'],                          // Shares Owned
			['s6', 'Revenue'],                              // Revenue
			['s7', 'ShortRatio'],                           // Short Ratio
			['t1', 'LastTradeTime'],                        // Last Trade Time
			['t6', 'TradeLinks'],                         // Trade Links --> not available for all stocks outside of the US.
			['t7', 'TickerTrend'],                          // Ticker Trend
			['t8', '_1YearTargetPrice'],                    // 1-year Target Price
			['v0', 'Volume'],                               // Volume
			['v1', 'HoldingsValue'],                        // Holdings Value
			['v7', 'HoldingsValueRealTime'],                // Holdings Value (Real-time)
			['w0', '_52WeekRange'],                         // 52-week Range
			['w1', 'DaysValueChange'],                      // Day's Value Change
			['w4', 'DaysValueChangeRealTime'],              // Day's Value Change (Real-time)
			['x0', 'StockExchange'],                        // Stock Exchange
			['y0', 'DividendYield']                         // Dividend Yield
		];
		

		/**
		 * Gets historical data about the given symbol, between the given dates.
		 * @param  {string}  symbol    The stock quote symbol (eg: "PG").
		 * @param  {string}  startDate The start date for historical data (eg: "2014-12-01").
		 * @param  {string}  endDate   The end date for historical data (eg: "2014-12-07").
		 * @return {Deferred.promise}  A promise to be resolved when the request is successfully received.
		 */
		var getHistoricalData = function(symbol, startDate, endDate) {
			var deferred = $q.defer();
			var timeoutPromise = $q.defer();
			var requestTimedOut = false;
			var timeoutCountdown = undefined;
			
			var query = 'select * from yahoo.finance.historicaldata where symbol = "' + symbol + '" and startDate = "' + startDate + '" and endDate = "' + endDate + '"';
			var format = '&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=JSON_CALLBACK';
			var url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(query) + format;
			
			$http.jsonp(url, { timeout: timeoutPromise.promise })
				.success(function (data) {
					var quotes = [];
					
					if (data.query.count > 0) {
						// TODO: Filter & format quotes:
						quotes = data.query.results.quote;
					}

					// Fail the request, as no data has been received:
					if (data.query.count === 0) {
						deferred.reject({
							error: errorMessages.NoData.Error,
							message: errorMessages.NoData.Message
						});
					}
					

					// Cancel the "timeout" $timeout:
					$timeout.cancel(timeoutCountdown);
					// Cancel the "timeout" Promise:
					timeoutPromise.reject();

					
					// Resolve the Promise with data:
					deferred.resolve(quotes);
				})
				.error(function (data) {
					if (requestTimedOut) {
						deferred.reject({
							error: errorMessages.Timeout.Error,
							message: errorMessages.Timeout.Message.format(appConfig.JSONPTimeout),
							data: data
						});
					} else {
						deferred.reject(data);
					}
				});


			// Start a $timeout which, if resolved, will fail the $http request sent (and assume a timeout):
			timeoutCountdown = $timeout(function() {
				requestTimedOut = true;
				timeoutPromise.resolve();
			}, appConfig.JSONPTimeout);

			return deferred.promise;
		};
		
		/**
		 * Gets current data for the given symbols.
		 * @param  {Array<string>} symbols An array of symbols for which to get current data.
		 * @return {Deferred.promise}      A promise to be resolved when the request is successfully received.
		 */
		var getCurrentData = function(symbols) {
			var deferred = $q.defer();
			var timeoutPromise = $q.defer();
			var requestTimedOut = false;
			var timeoutCountdown = undefined;
			
			// Proper URL:
			// https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.quote%20where%20symbol%20in%20(%22YHOO%22%2C%22AAPL%22%2C%22GOOG%22%2C%22MSFT%22)&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=
			
			var formattedSymbols = [];
			for (var i = 0, nbSymbols = symbols.length; i < nbSymbols; i++) {
				formattedSymbols.push('"' + symbols[i] + '"');
			}
			var query = 'select * from yahoo.finance.quote where symbol in (' + formattedSymbols.join(',') + ')';
			var format = '&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=JSON_CALLBACK';
			var url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(query) + format;
			
			$http.jsonp(url, { timeout: timeoutPromise.promise })
				.success(function (data) {
					var quotes = [];
					
					if (data.query.count > 0) {
						// TODO: Filter & format quotes:
						quotes = data.query.results.quote;
					}

					// Fail the request, as no data has been received:
					if (data.query.count === 0) {
						deferred.reject({
							error: errorMessages.NoData.Error,
							message: errorMessages.NoData.Message
						});
					}
					

					// Cancel the "timeout" $timeout:
					$timeout.cancel(timeoutCountdown);
					// Cancel the "timeout" Promise:
					timeoutPromise.reject();

					
					// Resolve the Promise with data:
					deferred.resolve(quotes);
				})
				.error(function (data) {
					if (requestTimedOut) {
						deferred.reject({
							error: errorMessages.Timeout.Error,
							message: errorMessages.Timeout.Message.format(appConfig.JSONPTimeout),
							data: data
						});
					} else {
						deferred.reject(data);
					}
				});


			// Start a $timeout which, if resolved, will fail the $http request sent (and assume a timeout):
			timeoutCountdown = $timeout(function() {
				requestTimedOut = true;
				timeoutPromise.resolve();
			}, appConfig.JSONPTimeout);

			return deferred.promise;
		};

    /**
     * converts array-like object to array
     * @param  collection the object to be converted
     * @return {Array} the converted object
     */
    var arrayify = function(collection) {
      return Array.prototype.slice.call(collection);
    }


    /**
     * given a table, generate an array of objects.
     * each object corresponds to a row in the table.
     * each object's key/value pairs correspond to a column's heading and the row's value for that column
     * 
     * @param  {HTMLTableElement} table the table to convert
     * @return {Array[Object]}       array of objects representing each row in the table
     */
    var parseTable = function(table) {
      var headings = arrayify(table.tHead.rows[0].cells).map(function(heading) {
        return heading.innerText;
      });
      return arrayify(table.tBodies[0].rows).map(factory(headings));
    }

    //table-dark-row

		/**
		 * Gets stock details for the given symbols.
		 * @param  {Array<string>} symbols The stock symbols for which to get the stock details.
		 * @return {Deferred.promise}      A promise to be resolved when the request is successfully received.
		 */
		var getCurrentDataWithDetailsFinviz = function(symbols) {
			var deferred = $q.defer();
			var timeoutPromise = $q.defer();
			var requestTimedOut = false;
			var timeoutCountdown = undefined;

			var formattedSymbols = symbols.join(',');
			var url = 'http://finviz.com/quote.ashx?t=' + formattedSymbols;
			
			$http.jsonp(url, { timeout: timeoutPromise.promise })
				.success(function (data) {
					console.log(data);
					


					//if (!angular.isArray(data.query.results)) {
					//	data.query.results = [data.query.results];
					//}

					// Fail the request, as no data has been received:
          /*
					if (data.query.count === 0) {
						deferred.reject({
							error: errorMessages.NoData.Error,
							message: errorMessages.NoData.Message
						});
					} else {
						// Parse & format the incoming data:
						if (data.query.count === 1) {
              data.query.results.row.stockSymbol = symbols.join('');
							data.query.results.row.Change = parseFloat(data.query.results.row.Change, 10);
							data.query.results.row.ChangeInPercent = parseFloat(data.query.results.row.ChangeInPercent, 10);
							data.query.results.row.LastTradePriceOnly = parseFloat(data.query.results.row.LastTradePriceOnly, 10);
						} else {
							for (var i = 0, nbResults = data.query.count; i < nbResults; i++) {
                data.query.results.row[i].stockSymbol = symbols;
								data.query.results.row[i].Change = parseFloat(data.query.results.row[i].Change, 10);
								data.query.results.row[i].ChangeInPercent = parseFloat(data.query.results.row[i].ChangeInPercent, 10);
								data.query.results.row[i].LastTradePriceOnly = parseFloat(data.query.results.row[i].LastTradePriceOnly, 10);
							}
						}
					}
					*/

					// Cancel the "timeout" $timeout:
					$timeout.cancel(timeoutCountdown);
					// Cancel the "timeout" Promise:
					timeoutPromise.reject();

					
					// Resolve the Promise with data:
					deferred.resolve(data);
				})
				.error(function (data) {
					if (requestTimedOut) {
						deferred.reject({
							error: errorMessages.Timeout.Error,
							message: errorMessages.Timeout.Message.format(appConfig.JSONPTimeout),
							data: data
						});
					} else {
						deferred.reject(data);
					}
				});


			// Start a $timeout which, if resolved, will fail the $http request sent (and assume a timeout):
			timeoutCountdown = $timeout(function() {
				requestTimedOut = true;
				timeoutPromise.resolve();
			}, appConfig.JSONPTimeout);

			return deferred.promise;
		};
		/**
		 * Gets stock details for the given symbols.
		 * @param  {Array<string>} symbols The stock symbols for which to get the stock details.
		 * @return {Deferred.promise}      A promise to be resolved when the request is successfully received.
		 */
		var getCurrentDataWithDetails = function(symbols) {
			var deferred = $q.defer();
			var timeoutPromise = $q.defer();
			var requestTimedOut = false;
			var timeoutCountdown = undefined;

			var formattedSymbols = symbols.join(',');
			var formattedYahooAPITags = [];
			var formattedYahooColumns = [];
			for (var i = 0, nbTags = yahooAPITags.length; i < nbTags; i++) {
				var yahooAPITag = yahooAPITags[i];
				formattedYahooAPITags.push( yahooAPITag[0] );
				formattedYahooColumns.push( yahooAPITag[1] );
			}
			formattedYahooAPITags = formattedYahooAPITags.join('');
			formattedYahooColumns = formattedYahooColumns.join(',');

			var csvUrl = 'http://download.finance.yahoo.com/d/quotes.csv?s=' + formattedSymbols + '&f=' + formattedYahooAPITags + '&e=.csv';
			var query = "select * from yahoo.finance.quotes where symbol in (\""+formattedSymbols+"\")";// url='" + csvUrl + "' and columns='" + formattedYahooColumns + "'"; // and columns='symbol,price,date,time,change,col1,high,low,col2'";
			var format = '&format=json&env=http%3A%2F%2Fdatatables.org%2Falltables.env&callback=JSON_CALLBACK';
      //var format = '&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=JSON_CALLBACK';
			var url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(query) + format;
			
			$http.jsonp(url, { timeout: timeoutPromise.promise })
				.success(function (data) {
					//console.log(data);
					
					/*
          var data = {};
					for (var i = yahooAPITags.length - 1; i >= 0; i--) {
						var columnName = yahooAPITags[i][1];
						var columnValue = data.query.results.row['col' + (i+3)];

						data[columnName] = columnValue;
					}

					console.log(data);
					*/

					//if (!angular.isArray(data.query.results)) {
					//	data.query.results = [data.query.results];
					//}

					// Fail the request, as no data has been received:
					if (data.query.count === 0) {
						deferred.reject({
							error: errorMessages.NoData.Error,
							message: errorMessages.NoData.Message
						});
					} else {
						// Parse & format the incoming data:
						if (data.query.count === 1) {
              data.query.results.quote.stockSymbol = symbols.join('');
              
              //console.log(data.query.results.quote.Name);

							data.query.results.quote.Change = parseFloat(data.query.results.quote.Change, 10);
							data.query.results.quote.ChangeInPercent = parseFloat(data.query.results.quote.ChangeInPercent, 10);
							data.query.results.quote.LastTradePriceOnly = parseFloat(data.query.results.quote.LastTradePriceOnly, 10);
						} else {

              //console.log(data.query.results);

							for (var i = 0, nbResults = data.query.count; i < nbResults; i++) {
                data.query.results.quote[i].stockSymbol = symbols;
								data.query.results.quote[i].Change = parseFloat(data.query.results.quote[i].Change, 10);
								data.query.results.quote[i].ChangeInPercent = parseFloat(data.query.results.quote[i].ChangeInPercent, 10);
								data.query.results.quote[i].LastTradePriceOnly = parseFloat(data.query.results.quote[i].LastTradePriceOnly, 10);
							}
						}
					}
					

					// Cancel the "timeout" $timeout:
					$timeout.cancel(timeoutCountdown);
					// Cancel the "timeout" Promise:
					timeoutPromise.reject();

					
					// Resolve the Promise with data:
					deferred.resolve(data);
				})
				.error(function (data) {
					if (requestTimedOut) {
						deferred.reject({
							error: errorMessages.Timeout.Error,
							message: errorMessages.Timeout.Message.format(appConfig.JSONPTimeout),
							data: data
						});
					} else {
						deferred.reject(data);
					}
				});


			// Start a $timeout which, if resolved, will fail the $http request sent (and assume a timeout):
			timeoutCountdown = $timeout(function() {
				requestTimedOut = true;
				timeoutPromise.resolve();
			}, appConfig.JSONPTimeout);

			return deferred.promise;
		};
		
		/**
		 * Gets live, streaming stock data for the given symbol.
		 * @param  {string}      symbol   The stock symbol for which to get streaming data (eg: "PG").
		 * @param  {string|null} exchange The exchange market for the given stock (eg: "NYSE").
		 * @param  {int}         interval The refresh interval, in seconds (eg: 60).
		 * @param  {string}      period   The duration for which to get data, up to 10 days (eg: "1d", "1h", etc.).
		 * @return {Deferred.promise}     A promise to be resolved when the request is successfully received.
		 */
		var getLiveData = function(symbol, exchange, interval, period) {
			var deferred = $q.defer();
			var timeoutPromise = $q.defer();
			var requestTimedOut = false;
			var timeoutCountdown = undefined;
			
			var maxTimestamp = 0;
			
			var googleFinanceURL = 'http://www.google.com/finance/getprices'
				+ '?q=' + symbol 
				+ (exchange === null ? '' : '&x=' + exchange)
				+ '&i=' + interval
				+ '&p=' + period
				+ '&f=d,c,v,k,o,h,l&df=cpct&auto=0&ei=Ef6XUYDfCqSTiAKEMg';
			var yqlQuery = 'SELECT * FROM csv WHERE url="' + googleFinanceURL + '"';
			var yqlURL = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(yqlQuery) + '&format=json&callback=JSON_CALLBACK';
			
			// Format of the Google Finance URL:
			//    http://www.google.com/finance/getprices?q=T&x=TSE&i=60&p=10d&f=d,c,v,k,o,h,l&df=cpct&auto=0&ei=Ef6XUYDfCqSTiAKEMg
			// Where:
			//    "q" is the stock symbol
			//    "x" is the stock exchange market
			//    "i" is the interval
			//    "p" is the period

			$http.jsonp(yqlURL, { timeout: timeoutPromise.promise })
				.success(function (data) {
					var quotes = [];
					var now = new Date();
					
          //console.log(data);

					var process = data.query.results !== null && data.query.results.row.length >= 7; // TODO: Some results do not have a "TIMEZONE_OFFSET=" line, parse data until "DATA=" line is found...
					if (data.query && data.query.count > 0 && process) {
						var timezoneOffset = 0;
						if (data.query.results.row[6]) {
							timezoneOffset = parseInt(data.query.results.row[6].col0.replace('TIMEZONE_OFFSET=', ''), 10); // in minutes
						}
						
						var startTimestamp = parseInt(data.query.results.row[7].col0.replace('a', ''), 10) + timezoneOffset * 60;
						var offset = 0;
						
						var chartNeedsRedraw = false;
						for (var i = 7; i < data.query.count; i++) {
							if (data.query.results.row[i].col0[0] === 'a') {
								startTimestamp = parseInt(data.query.results.row[i].col0.replace('a', ''), 10) + timezoneOffset * 60;
								offset = 0;
							} else {
								offset = parseInt(data.query.results.row[i].col0, 10);
							}
							//var date = new Date(startTimestamp + offset * interval).getTime()*1000;
							var date = new Date((startTimestamp + offset * interval + now.getTimezoneOffset() * 60)*1000);
							
							if (date > maxTimestamp) {
								var close = parseFloat(data.query.results.row[i].col1, 10);
								var dataRow = [date, close];
								
								maxTimestamp = date;
								
								quotes.push(dataRow);
							}
						}
					}


					// Fail the request, as no data has been received:
					if (quotes.length === 0) {
						deferred.reject({
							error: errorMessages.NoData.Error,
							message: errorMessages.NoData.Message
						});
					}
					

					// Cancel the "timeout" $timeout:
					$timeout.cancel(timeoutCountdown);
					// Cancel the "timeout" Promise:
					timeoutPromise.reject();


					// Resolve the Promise with data:
					deferred.resolve(quotes);
				})
				.error(function (data) {
					if (requestTimedOut) {
						deferred.reject({
							error: errorMessages.Timeout.Error,
							message: errorMessages.Timeout.Message.format(appConfig.JSONPTimeout),
							data: data
						});
					} else {
						deferred.reject(data);
					}
				});


			// Start a $timeout which, if resolved, will fail the $http request sent (and assume a timeout):
			timeoutCountdown = $timeout(function() {
				requestTimedOut = true;
				timeoutPromise.resolve();
			}, appConfig.JSONPTimeout);
			

			return deferred.promise;
		};

		/**
		 * Gets live, streaming stock data for the given market.
		 * @param  {string}      symbol   The market symbol for which to get streaming data (eg: ".INX").
		 * @param  {int}         interval The refresh interval, in seconds (eg: 60).
		 * @param  {string}      period   The duration for which to get data, up to 10 days (eg: "1d", "1h", etc.).
		 * @return {Deferred.promise}     A promise to be resolved when the request is successfully received.
		 */
		var getLiveMarketData = function(marketSymbol, interval, period) {
			return getLiveData(marketSymbol, null, interval, period);
		};

		/**
		 * Gets Yahoo! Finance Newsfeed items for the given stock symbol.
		 * @param  {string} stockSymbol The stock symbol for which to get streaming data (eg: "PG").
		 * @return {Deferred.promise}   A promise to be resolved when the request is successfully received.
		 */
		var getNewsFeedForStock = function(stockSymbol) {
			var deferred = $q.defer();
			var timeoutPromise = $q.defer();
			var requestTimedOut = false;
			var timeoutCountdown = undefined;

			var csvUrl = 'http://feeds.finance.yahoo.com/rss/2.0/headline?s=' + stockSymbol + '&region=US';
			var query = "select * from feed where url='" + csvUrl + "'"; // and columns='symbol,price,date,time,change,col1,high,low,col2'";
			var format = '&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=JSON_CALLBACK';
			var url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(query) + format;
			
			$http.jsonp(url, { timeout: timeoutPromise.promise })
				.success(function (data) {
					// Return YQL error message:
					if (typeof data.error !== 'undefined') {
						deferred.reject({
							error: errorMessages.YQL.Error,
							message: errorMessages.YQL.Message,
							data: data.error
						});

						return;
					}

					var nbResults = data.query.count;

					// Fail the request, as no data has been received:
					if (nbResults === 0) {
						deferred.reject({
							error: errorMessages.NoData.Error,
							message: errorMessages.NoData.Message
						});
					}
					

					// Cancel the "timeout" $timeout:
					$timeout.cancel(timeoutCountdown);
					// Cancel the "timeout" Promise:
					timeoutPromise.reject();

					
					// Resolve the Promise with data:
					deferred.resolve(data.query.results.item);
				})
				.error(function (data) {
					if (requestTimedOut) {
						deferred.reject({
							error: errorMessages.Timeout.Error,
							message: errorMessages.Timeout.Message.format(appConfig.JSONPTimeout),
							data: data
						});
					} else {
						deferred.reject(data);
					}
				});


			// Start a $timeout which, if resolved, will fail the $http request sent (and assume a timeout):
			timeoutCountdown = $timeout(function() {
				requestTimedOut = true;
				timeoutPromise.resolve();
			}, appConfig.JSONPTimeout);

			return deferred.promise;
		};

		/**
		 * Gets dividend history for the given symbol, between the given dates.
		 * @param  {string}  stockSymbol The stock quote symbol (eg: "PG").
		 * @param  {string}  startDate   The start date for historical data (eg: "2014-12-01").
		 * @param  {string}  endDate     The end date for historical data (eg: "2014-12-07").
		 * @return {Deferred.promise}    A promise to be resolved when the request is successfully received.
		 */
		var getDividendHistoryForStock = function(stockSymbol, startDate, endDate) {
			var deferred = $q.defer();
			var timeoutPromise = $q.defer();
			var requestTimedOut = false;
			var timeoutCountdown = undefined;

			var query = 'select * from yahoo.finance.dividendhistory where symbol = "' + stockSymbol + '" and startDate = "' + startDate + '" and endDate = "' + endDate + '"';
			var format = '&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=JSON_CALLBACK';
			var url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(query) + format;
			
			$http.jsonp(url, { timeout: timeoutPromise.promise })
				.success(function (data) {
					// Return YQL error message:
					if (typeof data.error !== 'undefined') {
						deferred.reject({
							error: errorMessages.YQL.Error,
							message: errorMessages.YQL.Message,
							data: data.error
						});

						return;
					}

					var nbResults = data.query.count;

					// Fail the request, as no data has been received:
					if (nbResults === 0) {
						deferred.reject({
							error: errorMessages.NoData.Error,
							message: errorMessages.NoData.Message
						});
            
            return;
					}
					

					// Cancel the "timeout" $timeout:
					$timeout.cancel(timeoutCountdown);
					// Cancel the "timeout" Promise:
					timeoutPromise.reject();


          //console.log(data.query);

					// Make sure the data to return is an Array (in case there is only 1 result returned):
					/*if(typeof data !== 'undefined') {
            console.log("wtf");
            if (!angular.isArray(data.query.results.quote)) {
              data.query.results.quote = [data.query.results.quote];
            }
          }*/

					for (var i = 0, nbDividends = data.query.results.quote.length; i < nbDividends; i++) {
						var now = new Date();
						if (typeof data.query.results.quote[i] !== 'undefined') {
							var dateString = data.query.results.quote[i].Date.split('-');
							now.setYear(dateString[0]);
							now.setMonth(dateString[1]-1);
							now.setDate(dateString[2]);
							now.setHours(12);
							now.setMinutes(0);
							now.setSeconds(0);
							now.setMilliseconds(0);

							data.query.results.quote[i].Date = now;
						}
					}

					
					// Resolve the Promise with data:
					deferred.resolve(data.query.results.quote);
				})
				.error(function (data) {
					if (requestTimedOut) {
						deferred.reject({
							error: errorMessages.Timeout.Error,
							message: errorMessages.Timeout.Message.format(appConfig.JSONPTimeout),
							data: data
						});
					} else {
						deferred.reject(data);
					}
				});


			// Start a $timeout which, if resolved, will fail the $http request sent (and assume a timeout):
			timeoutCountdown = $timeout(function() {
				requestTimedOut = true;
				timeoutPromise.resolve();
			}, appConfig.JSONPTimeout);

			return deferred.promise;
		};


   var getelement = function(row){
        if(row.hasOwnProperty("")) return(row.p.text());
        return(row.font.text());
    };

    /**
		 * Gets Analyst Estimates for the given symbol.
		 * @param  {string}  stockSymbol The stock quote symbol (eg: "PG").
		 * @return {Deferred.promise}    A promise to be resolved when the request is successfully received.
     */
		var getAnalystEstimatesForStock2 = function(stockSymbol) {
      var deferred = $q.defer();
			var timeoutPromise = $q.defer();
			var requestTimedOut = false;
			var timeoutCountdown = undefined;

      var url = "http://finviz.com/quote.ashx?t=TSLA";// + stockSymbol;

      var returnData;

      var params = {};

			//var req = $http.jsonp(url, { timeout: timeoutPromise.promise } ).success(function(data) {
        /*if (!error && response.statusCode == 200) {
          deferred.reject(error);
        //console.log(body) // Print the google web page.
        }
        */

			$http.jsonp(url, { timeout: timeoutPromise.promise })
				.success(function (data) {
          
          //console.log('getAnalystEstimatesForStock2');

          //console.log(data);

          
          // Cancel the "timeout" $timeout:
					$timeout.cancel(timeoutCountdown);
					// Cancel the "timeout" Promise:
					timeoutPromise.reject();
          
          var rawresult = data;

          var doc = new dom().parseFromString(rawresult);

          var aequery = xpath.select(
            "//table[@class='yfnc_tableout1']/tr[count(td)=0]/parent::*|" +
            "//table[@class='yfnc_tableout1']/tr/td/table",
            rawresult
            );


          // Process Results
          //for (var i = 0, aelength = aequery.length; i < aelength; i++) {
            //var v = arr[i];
          var i = 0;
          while(i < aequery.length) {
            var table  = aequery[i];

            
            var rows = {};
            if(table.td.class === 'yfnc_tablehead1') {
            


            }
            var thead  = table.tr[0];
            var tname  = thead.th[0].strong.text().toString().replace(/ /g, "");
            var fname1 = thead.th[1].p.text().toString().replace(/\n.*/, "");
            var fname2 = thead.th[2].p.text().toString().replace(/\n.*/, "");
            var fname3 = thead.th[3].p.text().toString().replace(/\n.*/, "");
            var fname4 = thead.th[4].p.text().toString().replace(/\n.*/, "");
          
            for (var j = 0, l = table.tr.length; j < l; j++) {
            //while(j < table.tr.length())
              var row   = table.tr[j].td;
              var rname = row[0].p.text().toString().replace(/[\s\.]+/g, "");
              rname = rname.replace(/\(.*\)/g,"").replace(/\%/,"").replace(/^(\d)/,"_$1");
              rname = rname.replace(/\//, "");
              var rval1 = getelement(row[1]);
              var rval2 = getelement(row[2]);
              var rval3 = getelement(row[3]);
              var rval4 = getelement(row[4]);

            }

            i++;
          }
					
					// Resolve the Promise with data:
					deferred.resolve(data);

          
					}).error(function (data) {
					if (requestTimedOut) {
						deferred.reject({
							error: errorMessages.Timeout.Error,
							message: errorMessages.Timeout.Message.format(appConfig.JSONPTimeout),
							data: data
						});
					} else {
						deferred.reject(data);
					}
				});
        



			// Start a $timeout which, if resolved, will fail the $http request sent (and assume a timeout):
			timeoutCountdown = $timeout(function() {
				requestTimedOut = true;
				timeoutPromise.resolve();
			}, appConfig.JSONPTimeout);

			return deferred.promise;
		};

      Array.prototype.chunk = function(chunkSize) {
        var array=this;
        return [].concat.apply([],
            array.map(function(elem,i) {
              return i%chunkSize ? [] : [array.slice(i,i+chunkSize)];
            })
            );
      };

		/**
		 * Gets Analyst Estimates for the given symbol.
		 * @param  {string}  stockSymbol The stock quote symbol (eg: "PG").
		 * @return {Deferred.promise}    A promise to be resolved when the request is successfully received.
		 */
		var getAnalystEstimatesForStock = function(stockSymbol) {
			var deferred = $q.defer();
			var timeoutPromise = $q.defer();
			var requestTimedOut = false;
			var timeoutCountdown = undefined;

      var query = 'select * from html where url=\'http://finance.yahoo.com/q/ae?s=' + stockSymbol + '\' and xpath=\'//*[@class="yfnc_tabledata1" or @class="yfnc_tablehead1"]\'';
//https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D'http%3A%2F%2Ffinance.yahoo.com%2Fq%2Fae%3Fs%3DT'%20and%20xpath%3D'%2F%2Ftable%5B%40class%3D%22yfnc_tabledata1%22%20or%20%40class%3D%22yfnc_tableout1%22%5D'&diagnostics=true&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys
//
			//var query = 'SELECT * FROM yahoo.finance.analystestimate WHERE symbol = "' + stockSymbol + '"';
			var format = '&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=JSON_CALLBACK';
			var url = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(query) + format;
			
			$http.jsonp(url, { timeout: timeoutPromise.promise })
				.success(function (data) {
          

					// Return YQL error message:
					if (typeof data.error !== 'undefined') {
						deferred.reject({
							error: errorMessages.YQL.Error,
							message: errorMessages.YQL.Message,
							data: data.error
						});

						return;
					}

          //console.log(data);


          //console.log('call');
          //getAnalystEstimatesForStock2('CAT');

          //console.log(data.query.results[0]);
          
          var aequery = data.query.results;
          var rows = [];
          var rowx = [];
          var rowN = 0;

          for (var key in aequery.td) {
            
            if(aequery.td[key].class === 'yfnc_tablehead1') {
              rowx.push({ period: key, value: aequery.td[key].content, num: rowN });
              rowN++;
            } else {
            
              rows.push({
                period: key,
                value: aequery.td[key].content === null ? aequery.td[key].font.content : aequery.td[key].content,
                num: rowN
              });
            }
          }


          //console.log(rowx);
          //console.log(rows);
          //console.log(aequery.th.chunk(5));
          //console.log(aequery.th);

          //var x = parseTable(aequery);
          //console.log(x);

          //console.log(aequery.length);

        
					var nbResults = data.query.count;

					// Fail the request, as no data has been received:
					if (nbResults === 0) {
						deferred.reject({
							error: errorMessages.NoData.Error,
							message: errorMessages.NoData.Message
						});
					}


					// Cancel the "timeout" $timeout:
					$timeout.cancel(timeoutCountdown);
					// Cancel the "timeout" Promise:
					timeoutPromise.reject();



									
					// Resolve the Promise with data:
					deferred.resolve(aequery);
				})
				.error(function (data) {
					if (requestTimedOut) {
						deferred.reject({
							error: errorMessages.Timeout.Error,
							message: errorMessages.Timeout.Message.format(appConfig.JSONPTimeout),
							data: data
						});
					} else {
						deferred.reject(data);
					}
				});


			// Start a $timeout which, if resolved, will fail the $http request sent (and assume a timeout):
			timeoutCountdown = $timeout(function() {
				requestTimedOut = true;
				timeoutPromise.resolve();
			}, appConfig.JSONPTimeout);

			return deferred.promise;
		};

		var convertQuarterObjectToArray = function(quarterData) {
			var earningsHistory = [];
			for (var key in quarterData) {
				earningsHistory.push({
					period: key,
					value: parseFloat(quarterData[key], 10)
				});
			}
			return earningsHistory;
		};

		/**
		 * Gets stock symbols matching the given partial name.
		 * @param  {string} partialStockSymbol The partial stock name to look for (eg: "goog" for "Google");
		 * @return {Deferred.promise}          A promise to be resolved when the request is successfully received.
		 */
		var getStockSymbol = function(partialStockSymbol) {
			var deferred = $q.defer();
			var timeoutPromise = $q.defer();
			var requestTimedOut = false;
			var timeoutCountdown = undefined;


			// Create a callback function, faking the presence of the "Yahoo!" librairy:
			var YAHOO = window.YAHOO = { Finance: { SymbolSuggest: { } } };

			YAHOO.Finance.SymbolSuggest.ssCallback = function(data) {
				// Cancel the "timeout" $timeout:
				$timeout.cancel(timeoutCountdown);
				// Cancel the "timeout" Promise:
				timeoutPromise.reject();

				// Resolve the Promise with data:
				deferred.resolve(data.ResultSet.Result);
			};
			
			// Proper URL:
			// http://autoc.finance.yahoo.com/autoc?query=google&callback=YAHOO.Finance.SymbolSuggest.ssCallback
			
			var url = 'http://autoc.finance.yahoo.com/autoc?query=' + partialStockSymbol + '&callback=YAHOO.Finance.SymbolSuggest.ssCallback';
			$.getScript(url);


			// Start a $timeout which, if resolved, will fail the $http request sent (and assume a timeout):
			timeoutCountdown = $timeout(function() {
				requestTimedOut = true;
				timeoutPromise.resolve();
			}, appConfig.JSONPTimeout);

			return deferred.promise;
		};
		
		
		// Return the public interface for the service:
		return {
			getHistoricalData: getHistoricalData,
			getLiveData: getLiveData,
			getLiveMarketData: getLiveMarketData,
			getCurrentData: getCurrentData,
			getCurrentDataWithDetails: getCurrentDataWithDetails,
			getStockSymbol: getStockSymbol,
			getNewsFeedForStock: getNewsFeedForStock,
			getDividendHistoryForStock: getDividendHistoryForStock,
			getAnalystEstimatesForStock: getAnalystEstimatesForStock
		};
	}]);
