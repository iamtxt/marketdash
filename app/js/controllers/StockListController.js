'use strict';

/**
 * Stock List Controller.
 */
angular.module('stockWatcher.Controllers')
	.controller('StockListController', ['$scope', '$interval', 'stockService', 'errorMessages', 'storageService', 'applicationStorageService',
		function ($scope, $interval, stockService, errorMessages, storageService, applicationStorageService) {

		// Set the default refresh interval for the table:
		$scope.refreshInterval = 60;

		// Set the default sort order for the table:
		$scope.sortOrder = 'index';

		// Set the default sort direction for the table:
		$scope.sortReversed = false;
		

		// Retrieve the quotes to fetch from storage:
		var savedQuotes = applicationStorageService.getSavedStockSymbols();

		$scope.quotesToFetch = savedQuotes || [
			{
				symbol: 'YHOO',
				yahooSymbol: 'YHOO',
				liveData: {},
				index: 0
			},
			{
				symbol: 'TSLA',
				yahooSymbol: 'TSLA',
				liveData: {},
				index: 1
			},
      {
				symbol: 'MSFT',
				yahooSymbol: 'MSFT',
				liveData: {},
				index: 2
			},
      {
				symbol: 'ATVI',
				yahooSymbol: 'ATVI',
				liveData: {},
				index: 3
			},
      {
				symbol: 'FTNT',
				yahooSymbol: 'FTNT',
				liveData: {},
				index: 4
			},
      {
				symbol: 'CSCO',
				yahooSymbol: 'CSCO',
				liveData: {},
				index: 5
			}
		];
		$scope.stockQuotes = [];
		



		var getCurrentDataWithDetails = function() {
			var allYahooSymbols = [];
			for (var i = 0, nbStocks = $scope.quotesToFetch.length; i < nbStocks; i++) {
				allYahooSymbols.push($scope.quotesToFetch[i].yahooSymbol);
			}

			var promise = stockService.getCurrentDataWithDetails(allYahooSymbols);
			promise.then(
				function (data) {
					for (var i = 0, count = data.query.count; i < count; i++) {
						$scope.quotesToFetch[i].liveData = data.query.results.quote[i];
					}

					$scope.stockQuotes = $scope.quotesToFetch;
				},
				function (reason) {
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
		}
		getCurrentDataWithDetails();





		$scope.addStockSuggestions = [];

		$scope.$watch('addStockName', function (newValue) {
			if (typeof newValue !== 'undefined') {
				var promise = stockService.getStockSymbol(newValue);
				promise.then(
					function (data) {
						$scope.addStockSuggestions = data;
					},

					function (reason) {
						console.error(reason);
					}
				);
			}
		});





		/**
		 * Add a listener to the Modal, in order to set the focus on its input field when opened.
		 */
		$('#addStockModal').on('shown.bs.modal', function() {
			$('#addStockName').focus();
		});

		$scope.selectedStock = undefined;
		$scope.hasSelectedStock = false;

		$scope.setSelectedStock = function(selectedStock) {
			if (typeof selectedStock !== 'undefined') {
				$scope.selectedStock = selectedStock;
				$scope.hasSelectedStock = true;
			} else {
				$scope.selectedStock = undefined;
				$scope.hasSelectedStock = false;
				$scope.addStockName = undefined; // Reset the input
				$scope.addStockSuggestions = [];
			}
		};

		$scope.saveSelectedStock = function() {
			// Ensure that there will be no duplicates before saving the new array of quotes:
			var savedQuotes = applicationStorageService.getSavedStockSymbols();
			if (savedQuotes !== null) {
				var matchedSavedQuotes = $.grep(savedQuotes, function (savedQuote) {
					return savedQuote.yahooSymbol === $scope.selectedStock.symbol;
				});
				if (matchedSavedQuotes.length > 0) {
					return;
				}
			}


			// Add the selected symbol to the watchlist:
			$scope.quotesToFetch.push(
				{
					symbol: $scope.selectedStock.symbol,
					yahooSymbol: $scope.selectedStock.symbol,
					liveData: {},
					index: $scope.quotesToFetch.length
				}
			);

			// Store the updated quotes to fetch:
			var quotesToSerialize = [];
			for (var i = 0, nbQuotes = $scope.quotesToFetch.length; i < nbQuotes; i++) {
				var data = $scope.quotesToFetch[i];

				quotesToSerialize.push({
					symbol: data.symbol,
					yahooSymbol: data.yahooSymbol,
					liveData: {},
					index: data.index
				});
			}
			applicationStorageService.setSavedStocks(quotesToSerialize);

			// Refresh the stock list:
			getCurrentDataWithDetails();

			// Close Modal:
			$scope.closeAddStockModal();
		};

		$scope.closeAddStockModal = function() {
			// Reset saved data:
			$scope.setSelectedStock(undefined);
		}
		
		
		
		
		
		$scope.createRefresher = function() {
			return $interval(function() {
				getCurrentDataWithDetails();
			}, $scope.refreshInterval*1000);
		};
		
		$scope.destroyRefresher = function() {
			if (typeof refresher !== 'undefined') {
				$interval.cancel(refresher);
				refresher = undefined;
			}
		};
		
		$scope.refreshIntervalChanged = function() {
			$scope.destroyRefresher();
			$scope.createRefresher();
		};

		$scope.setRefreshInterval = function(interval) {
			$scope.refreshInterval = interval;
			$scope.refreshIntervalChanged();
		};
		
		var refresher = $scope.createRefresher();
		
		$scope.$on('$destroy', function() {
			// Make sure that the "refresher" $interval is destroyed:
			$scope.destroyRefresher();
        });
	}]);
