// public/core.js
var scotchTodo = angular.module('scotchTodo',[]);

function mainController($scope, $http,$timeout) {
    $scope.formData = {};
	$scope.loading = true;
    // when landing on the page, get all todos and show them
    /*$http.get('/api/todos')
        .success(function(data) {
			$scope.loading = false;
            $scope.todos = data;
            console.log(data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });*/

    // when submitting the add form, send the text to the node API
    $scope.createTodo = function() {
		$scope.loading = true;
		console.log("form data : "+JSON.stringify($scope.formData));
        $scope.formData.limit = 20;
        $scope.formData.page=0;
        $http.post('/api/todos', $scope.formData)
            .success(function(data) {
				$scope.loading = false;
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.todos = data;
                //console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };

    // delete a todo after checking it
    $scope.deleteTodo = function(id) {
		$scope.loading = true;
        $http.delete('/api/todos/' + id)
            .success(function(data) {
				$scope.loading = false;
                $scope.todos = data;
                console.log(data);
            })
            .error(function(data) {
                console.log('Error: ' + data);
            });
    };


    //inifinite scrolling
    $scope.busy = false;
    $scope.stopped = false;
    $scope.page = 0;
    $scope.limit = 5;
    $scope.todos = [];
    
    $scope.loadMoreProject = function() {
        if ($scope.stopped || $scope.busy) return;
        $scope.busy = true;
        $http({
            method: "GET",
            url: "http://localhost:8080/todos/" + $scope.page + '/' + $scope.limit,
        }).success(function (data, status) {
            if (data.length === 0) {
                $scope.stopped = true;
                $scope.busy = true;
                return;
            }
            //simulate 1s delay when request
            
                for (var i = 0; i < data.length; i++)
                    $scope.todos.push(data[i]);
            
            $scope.busy = false;
            $scope.page += 1;
        });
    };
    $scope.loadMoreProject();

}
scotchTodo.directive('whenScrolled', function() {
    return {
        
        
        restrict: 'A',
        link: function(scope, elm, attr) {
            var raw = elm[0];
            
            elm.bind('scroll', function() {
                if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
                    scope.$apply(attr.whenScrolled);
                 }
            });
        }
    };
});