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
		
        $http.get('http://localhost:9999/data').then(function(response) {
			$scope.chart = response.data
		})
	}

    $scope.forward = function(newindex) {
        $http.get('http://localhost:9999/data?index='+newindex).then(function(response) {
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
            template: '<div></div>',
            scope: {
                data: '=',
                layout: '=',
                options: '='
            },
            link: function(scope, element) {
                var graph = element[0].children[0];
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




app.directive("matrix", function ()
  {
    return {
        restrict: 'E',
        scope: {
            matx: '='
        },
        template: "<canvas id='pgcanvas' width='1000' height='1000' />",
        link: function(scope, element, attrs) {
           console.log(element);
           scope.canvas = element.find('canvas')[0];
           scope.context = scope.canvas.getContext('2d');

            scope.$watchGroup([
                function() {
                    return scope.matx;
                }                 
            ], function(newValue, oldValue) {
                if (angular.equals(newValue, oldValue)) return;
                onUpdate()
            }, true);

            function getColor(x, y) {
                if(scope.matx[x][y] <10) {
                    return "#0033cc"
                }
                if(scope.matx[x][y] > 10 && scope.matx[x][y] < 20) {
                    return "#66ccff"
                }
                if(scope.matx[x][y] > 15 && scope.matx[x][y] < 20) {
                    return "#99ff99"
                }  
                if(scope.matx[x][y] > 20 && scope.matx[x][y] < 25) {
                    return "#ffcc66"
                }
                if(scope.matx[x][y] > 25 && scope.matx[x][y] < 30) {
                    return "#ff6600"
                } 

                return "#b32d00"              

            }

            function onUpdate() {
                /*
                 scope.context.mozImageSmoothingEnabled = false;
                 scope.context.webkitImageSmoothingEnabled = false;
                 scope.context.msImageSmoothingEnabled = false;
                 scope.context.imageSmoothingEnabled = false;*/
                //scope.context.scale(5,5);
                for (var x = 0; x < scope.matx.length; ++x) {
                    for (var y = 0; y < scope.matx[0].length; ++y) {  
                        dim = 1                      
                        if (scope.matx[x][y] != null) {
                            scope.context.fillStyle = getColor(x,y);
                        } else {
                            scope.context.fillStyle = "#000"
                        } 
                        scope.context.fillRect(x*dim, y*dim, dim, dim);                      
                    }
                }
            }

        }        
    };
});

