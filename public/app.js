var routerApp = angular.module('routerApp', ['ui.router','ngAnimate','ngFileUpload']);
routerApp.config(function($stateProvider, $urlRouterProvider,$httpProvider) {
    $urlRouterProvider.otherwise('/home');
    $stateProvider
    // HOME STATES AND NESTED VIEWS ========================================
    .state('home', {
        url: '/home',
        templateUrl: 'partial-home.html',
        controller :'MainCtrl'
    })
    .state('register', {
        url: '/register',
        templateUrl: 'partial-register.html',
        controller: 'RegisterCtrl'
    })
    .state('login', {
        url: '/login',
        templateUrl: 'partial-login.html',
        controller: 'LoginCtrl'
    })
    .state('posts', {
        url: '/posts',
        templateUrl: 'partial-posts.html',
        controller: 'PostsCtrl'
    })
    .state('logout', {
        url: '/logout',
        controller: 'LogoutCtrl'
    });

    $httpProvider.interceptors.push('authInterceptor');
});

routerApp.constant('API_URL','http://todocodeship.herokuapp.com/');

routerApp.controller('MainCtrl', function($scope,$http,Upload,API_URL) {
    $scope.message = 'test';
    //a simple model to bind to and send to the server
    $scope.upload = function (files) {
        if (files && files.length) {
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                Upload.upload({
                    url: API_URL+'upload',
                    fields: {'username': $scope.username},
                    file: file
                }).progress(function (evt) {
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                }).success(function (message, status, headers, config) {
                    console.log('file ' + config.file.name + 'uploaded. Response: ' + JSON.stringify(message));
                });
            }
        }
    };
})
.controller('RegisterCtrl',function($scope,$http,$state,alert,authToken,API_URL){

    $scope.submit = function(){
        var url=API_URL + 'register';
        var user={
            email: $scope.email,
            password: $scope.password
        };
        $http.post(url,user)
        .success(function(res){
            alert('success','Account Created!','Welcome '+ res.user.email +'!');
            authToken.setToken(res.token);
        })
        .error(function(error){
            alert('warning','Oops!','could not register '+error.message);
        });
    }
})
.controller('HeaderCtrl', function($scope, authToken){
    $scope.isAuthenticated = authToken.isAuthenticated;
})
.controller('LoginCtrl', function($scope,$http,API_URL,alert,authToken){
    $scope.submit = function(){
        var url=API_URL + 'login';
        var user={
            email: $scope.email,
            password: $scope.password
        };
        $http.post(url,user)
        .success(function(res){
            alert('success','Welcome ','Thanks for coming back '+ res.user.email +'!');
            authToken.setToken(res.token);
        })
        .error(function(error){
            alert('warning','Something went wrong! '+error.message);
        });
    }
})
.controller('LogoutCtrl', function(authToken,$state){
    authToken.removeToken();
    $state.go('home');
})
.controller('PostsCtrl', function($scope,$http,API_URL,alert,authToken,socket){
    $scope.getPosts = function(){
        $http.get(API_URL+'posts')
        .success(function(posts){
            $scope.posts = posts;
            if($scope.posts.length===0)
                alert('warning','No posts to show');
        })
        .error(function(err){
            alert('warning','Unable to get Posts!',err.message);
        })
    }
    $scope.getPosts();
    $scope.isAuthenticated = authToken.isAuthenticated;
    $scope.postText ="";
    if($scope.count==undefined)
      $scope.count=0;
    $scope.ownBrowser = false;
    $scope.createPost = function(postText){
        var url=API_URL + 'create/post';
        var post={
            text: postText
        };
        socket.emit('send msg', postText);
        $http.post(url,post)
        .success(function(res){
            alert('success','Success');
            $scope.getPosts();
            $scope.postText="";
            $scope.ownBrowser = true;
        })
        .error(function(error){
            alert('warning','Oops!');
        });

    }
    socket.on('get msg', function(data) {
      console.log(data);
      $scope.count =$scope.count+1;
      $scope.$digest();
    });

});

routerApp.service('alert',function alert($rootScope,$timeout){
    var alertTimeout;
    return function(type,title,message,timeout){
        $rootScope.alert={
            hasBeenShown:true,
            show:true,
            type:type,
            message:message,
            title:title
        };
        $timeout.cancel(alertTimeout);
        alertTimeout = $timeout(function(){
            $rootScope.alert.show=false;
        },timeout || 2000);
    }
});

routerApp.factory('authToken', function($window){
    var storage = $window.localStorage;
    var cachedToken;
    var userToken = 'userToken';
    var authToken = {
        setToken: function(token){
            cachedToken = token;
            storage.setItem(userToken,token);
        },
        getToken: function(){
            if(!cachedToken)
                cachedToken = storage.getItem(userToken);

            return cachedToken;
        },
        isAuthenticated: function(){
            return !!authToken.getToken();
        },
        removeToken: function(){
            cachedToken = null;
            storage.removeItem(userToken);
        }
    };
    return authToken;
})
.factory('authInterceptor', function (authToken) {

    return {
      request: function(config){
          var token = authToken.getToken();

          if(token){
              config.headers.Authorization = 'Bearer ' + token;
          }

          return config;
      },
      response: function(response){
          return response;
        }
    };
})
.factory('socket', function(API_URL){
    return io.connect(API_URL);
});
