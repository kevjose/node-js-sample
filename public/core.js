// public/core.js
var scotchTodo = angular.module('scotchTodo',[]);

function mainController($scope, $http) {
    $scope.formData = {};
	$scope.loading = true;
    // when landing on the page, get all todos and show them
    $http.get('/api/todos')
        .success(function(data) {
			$scope.loading = false;
            $scope.todos = data;
            console.log(data);
        })
        .error(function(data) {
            console.log('Error: ' + data);
        });

    // when submitting the add form, send the text to the node API
    $scope.createTodo = function() {
		$scope.loading = true;
		console.log("form data : "+JSON.stringify($scope.formData));
        $http.post('/api/todos', $scope.formData)
            .success(function(data) {
				$scope.loading = false;
                $scope.formData = {}; // clear the form so our user is ready to enter another
                $scope.todos = data;
                console.log(data);
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

}
