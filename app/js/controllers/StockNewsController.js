'use strict';

/**
 * Stock News Controller.
 */
angular.module('stockWatcher.Controllers')
	.controller('StockNewsController', ['$scope', '$interval', 'stockService', 'errorMessages', 
		function ($scope, $interval, stockService, errorMessages) {

		// Set the default refresh interval for the table:
		$scope.refreshInterval = 60;

		// Set the initial list of news items:
		$scope.newsItems = [];


		var getNewsForStock = function() {
			var promise = stockService.getNewsFeedForStock($scope.symbol);
			promise.then(
				function (data) {
					$scope.newsItems = data;
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
		getNewsForStock();



		
		
		$scope.createRefresher = function() {
			return $interval(function() {
				getNewsForStock();
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
