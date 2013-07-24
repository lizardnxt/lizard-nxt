'use strict';


var app = angular.module("lizard-nxt", ['Components']);

app.config(function($interpolateProvider) {
  $interpolateProvider.startSymbol('{[{');
  $interpolateProvider.endSymbol('}]}');
 });


app.controller("BoxAwesome",
    ["$scope", function($scope){
    $scope.box = {
        disabled: true,
        content: 'empty'
	};

    $scope.close_box = function(){
        $scope.box.disabled = true;
        if ($scope.box.content.marker){
            $scope.box.content.marker._icon.classList.remove('selected-icon');        
        }
        $scope.box.content = 'empty';
    };

    $scope.$on('open_box', function(message, content) {
        if ($scope.box.content.marker !== undefined){
            $scope.box.content.marker._icon.classList.remove('selected-icon');        
        }
        $scope.$apply(function() {
            $scope.box.content = content;
            $scope.box.disabled = false;
        });
        $scope.$broadcast(content.type, content);
    });

    // Close the box from another scope using $rootScope.$broadcast
    $scope.$on('close_box', function(message, content) {
        $scope.close_box();
    });
}]);


app.controller("InfoPoint", ["$scope", "state", function($scope, state) {
    $scope.content = null;
    $scope.state = state;
    $scope.counter = 0;

    var infoPoint = function(content) {
        // content must have properties .loaded_model and .point.
        var lonlat = content.point;
        var $layer = document.getElementsByClassName("workspace-wms-layer")[0];  // there is only one
        $scope.infourl = $layer.dataset['workspaceWmsUrl'].split('/wms')[0] + '/data?' + "REQUEST=gettimeseries&LAYERS=" + content.loaded_model + "&SRS=EPSG:4326&POINT="+lonlat.lng.toString() + ',' + lonlat.lat.toString() + '&random=' + $scope.counter;
    }

    $scope.$on("infopoint", function(message, content) {
        $scope.content = content;
        $scope.$apply(function() {
            console.log("open box infopoint");
            infoPoint(content);
            // var lonlat = content.point;
            // var $layer = document.getElementsByClassName("workspace-wms-layer")[0];  // there is only one
            // $scope.infourl = $layer.dataset['workspaceWmsUrl'].split('/wms')[0] + '/data?' + "REQUEST=gettimeseries&LAYERS=" + content.loaded_model + "&SRS=EPSG:4326&POINT="+lonlat.lng.toString() + ',' + lonlat.lat.toString();
        });        
    });

    $scope.$watch('state', function(newvalue, oldvalue) {
        // When this function is called, it is already in an apply.
        if ($scope.content === null) {return;}
        //$scope.counter += 1;
        $scope.counter = newvalue.time.at;

        console.log("open box infopoint yeah", newvalue.time.at);
        infoPoint($scope.content);
    }, true);

}]);

app.controller("InfoLine", ["$scope", "state", function($scope, state) {
    $scope.content = null;
    $scope.state = state;

    var infoLine = function(content) {
        var $layer = document.getElementsByClassName("workspace-wms-layer")[0];  // there is only one
        var url = $layer.dataset['workspaceWmsUrl'].split('/wms')[0] + '/data';
        var linestring = 'LINESTRING+(' + content.firstpoint.lng.toString() + '+' + content.firstpoint.lat.toString() + '%2C' + 
                    content.endpoint.lng.toString() + '+' + content.endpoint.lat.toString() + ')';
        var requestData = 'request=getprofile&srs=epsg:4326&layers=' + content.loaded_model + '&line=' + linestring + '&time=' + state.time.at;
        $scope.infourl = url +'?' + requestData;
    }

    $scope.$on("infoline", function(message, content) {
        $scope.content = content;
        $scope.$apply(function() {
            infoLine(content);
        });        
    });

    $scope.$watch('state', function(newvalue, oldvalue) {
        // When this function is called, it is already in an apply.
        if ($scope.content === null) {return;}

        //console.log("open box infoline yeah");
        infoLine($scope.content);
    }, true);

}]);



/* Directives */

angular
    .module('Components', [])
    .directive('jqSchlider', function () {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="schlider"></div>',
            scope: {
                'ngEnabled': '=',
                'max':       '=',
                'at':        '=',
                'orientation': '@'
            },
            link: function (scope, element, attrs) {
                if (scope.orientation != 'vertical'){
                    scope.orientation = 'horizontal';
                }
                element.slider({
                    stop : function(event, ui) {},
                    orientation: scope.orientation
                });

                element.on('slidestop', function(event, ui){
                    scope.$apply(function(){
                        scope.$parent.slider.at = ui.value;
                    });
                });

                scope.$watch('max', function (value) {
                    element.slider('option', 'max', value);
                });

                scope.$watch('at', function (value) {
                    element.slider('option', 'value', value);
                });

                scope.$watch('ngEnabled', function (value) {
                    element.attr('enabled', value);

                    if ((value) || (value === 'true')) {
                        element.slider('enable');
                    }
                    else {
                        element.slider('disable');
                    }
                });
            }
        };
    });

app.factory('leaflet', function (clientstate, socket, scenario, state, $rootScope) {
    if (debug) {
        console.log('initializing leaflet...');
    }
    map.on('click', function onMapClick(e) {
        if (clientstate.program_mode === MODE_NAVIGATE) {
            if (debug){
                console.log("click in navigate mode");
                    };
        } else if (clientstate.program_mode === MODE_MANHOLE) {
            if (debug){
                console.log("click in manhole mode");
            };
            $(".btn-manhole").click(); // disable button
            socket.emit('add_manhole', e.latlng.lng, e.latlng.lat, 100.0,
                function() {
                    if (debug){
                        console.log('emit manhole placement');
                    };
                });
        } else if (clientstate.program_mode === MODE_RAIN) {
            if (debug){
                console.log("click in rain mode");
            };
            $(".btn-rain").click(); // disable button
            socket.emit('add_rain', e.latlng.lng, e.latlng.lat, 500.0, 0.01,
                function() {
                    if (debug){
                        console.log('emit rain');
                    };
                });
        } else if (clientstate.program_mode === MODE_INFO_POINT){
            $rootScope.$broadcast('open_box', {
                type: 'infopoint', 
                point: e.latlng,
                loaded_model: state.loaded_model
            });
        } else if (clientstate.program_mode === MODE_INFO_LINE){
            /*
http://localhost:5000/3di/data?request=getprofile&layers=DelflandiPad&srs=EPSG%3A900913&line=LINESTRING+(487690.73298813+6804234.0094661%2C488588.86807036+6803985.5891242)&time=28

            */
            if (clientstate.first_click === null) {
                clientstate.first_click = e.latlng;
                showalert("Now click a second time to draw a line.");
                return;
            }

            $rootScope.$broadcast('open_box', {
                type: 'infoline',
                firstpoint: clientstate.first_click,
                endpoint: e.latlng,
                loaded_model: state.loaded_model
            });

            clientstate.first_click = e.latlng;

        } else {
            if (debug) {
                console.log("click in unhandled mode: " + clientstate.program_mode);
            }
        }

    });

    return {
        emitExtent: function () {
            var bounds = map.getBounds();
            var extent_list = [
                bounds._southWest.lat, bounds._southWest.lng,
                bounds._northEast.lat, bounds._northEast.lng
                ];
            socket.emit(
                'set_map_location', extent_list,
                function() {
                    if (debug){
                        console.log('emit map location', extent_list);
                    }
                });
        }


    }
});
