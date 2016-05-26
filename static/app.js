var app = angular.module('analysis', ['ngRoute']);
app.config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider) {
    $routeProvider.when('/', {
        controller: 'ChartCtrl',
        templateUrl: 'static/chart.html',
        reloadOnSearch: false
    })
    .otherwise({
        redirectTo : '/'
    });
}]);

app.controller('ChartCtrl', function($scope, $http) {
	$scope.message = 'ciao'


	$scope.init = function() {
		
        $http.get('/data').then(function(response) {
			$scope.chart = response.data
		})
	}

    $scope.forward = function(newindex) {
        $http.get('/data?index='+newindex).then(function(response) {
            $scope.chart = response.data
        })       
    }

	$scope.init()
});


app.directive('plotly', [
    '$window',
    function($window) {
        return {
            restrict: 'E',
            template: '<div id="chart"></div><div id="hover"></div>',
            scope: {
                data: '=',
                layout: '=',
                options: '='
            },
            link: function(scope, element) {
                var graph = element[0].children[0];
                var hoverInfo = element[0].children[1];
                var initialized = false;

                function onUpdate() {
                    //No data yet, or clearing out old data
                    if (!(scope.data)) {
                        if (initialized) {
                            Plotly.Plots.purge(graph);
                            graph.innerHTML = '';
                        }
                        return;
                    }
                    //If this is the first run with data, initialize
                    if (!initialized) {
                        initialized = true;
                        Plotly.newPlot(graph, scope.data, scope.layout, scope.options);
                    }
                    graph.layout = scope.layout;
                    graph.data = scope.data;
                    Plotly.redraw(graph);
                    Plotly.Plots.resize(graph);

                    /*
                    graph.on('plotly_hover', function(data){
                        console.log(data)
                        var infotext = data.points.map(function(d){
                          return ('Lat= '+d.x+', Lon= '+d.y+' Temp='+d.z);
                        });
                      
                        hoverInfo.innerHTML = infotext.join('<br/>');
                    })
                     .on('plotly_unhover', function(data){
                        hoverInfo.innerHTML = '';
                    })*/
                }

                function onResize() {
                    if (!(initialized && scope.data)) return;
                    Plotly.Plots.resize(graph);
                }

                scope.$watchGroup([
                    function() {
                        return scope.layout;
                    },
                    function() {
                        return scope.data;
                    }
                ], function(newValue, oldValue) {
                    if (angular.equals(newValue, oldValue)) return;
                    onUpdate();
                }, true);

                scope.$watch(function() {
                    return {
                        'h': element[0].offsetHeight,
                        'w': element[0].offsetWidth
                    };
                }, function(newValue, oldValue) {
                    if (angular.equals(newValue, oldValue)) return;
                    onResize();
                }, true);

                angular.element($window).bind('resize', function() {
                    onResize();
                });

                onUpdate()
            }
        };
    }
]);
