function logMilestone(message) {
    console.log(" ================== " + message + " ================== ")
}

var config = {
    apiKey: "AIzaSyBLRlLea7agrJVWbyxElaV1ZAOTeSvGOQI",
    authDomain: "project-5850803671810303460.firebaseapp.com",
    databaseURL: "https://project-5850803671810303460.firebaseio.com",
    storageBucket: "project-5850803671810303460.appspot.com",
    messagingSenderId: "866427805819"
};

firebase.initializeApp(config);

var app = angular.module('trumpy', [
    'ngSanitize',
    'ui.router',
    'ngMaterial',
    'firebase',
    'xml'
]);

app.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('brown')
        .accentPalette('lime');
});

app.run(RunBlock);

RunBlock.$inject = ['$state', '$rootScope'];

function RunBlock($state, $rootScope) {
    // $state.go('home');
    $rootScope.$on('$stateChangeError', function $stateChangeError(event, toState,
        toParams, fromState, fromParams, error) {
        console.group();
        console.error('$stateChangeError', error);
        console.error(error.stack);
        console.info('event', event);
        console.info('toState', toState);
        console.info('toParams', toParams);
        console.info('fromState', fromState);
        console.info('fromParams', fromParams);
        console.groupEnd();
    });
}

app.config(ConfigBlock);

ConfigBlock.$inject = ['$stateProvider', '$urlRouterProvider', '$httpProvider'];

function ConfigBlock($stateProvider, $urlRouterProvider, $httpProvider) {

    logMilestone("Config");

    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    $httpProvider.interceptors.push('xmlHttpInterceptor');

    var HomeState = {
        name: 'home',
        abstract: true,
        template: '<ui-view></ui-view>'
    };

    var FeedListState = {
        name: 'feedList',
        parent: 'home',
        url: '/',
        controller: function($scope, $firebaseArray) {
            logMilestone("feedList");
            console.log($scope);
            var ref = firebase.database().ref().child("feeds");
            $scope.feeds = $firebaseArray(ref);
            console.log($scope);
        },
        templateUrl: 'views/feed-list.tmpl.html'
    };

    var FeedViewState = {
        name: 'feedView',
        parent: 'home',
        url: '/feed/:id',
        controller: function($scope, $stateParams, $firebaseArray) {
            logMilestone("feedView");
            console.log($stateParams);
            var ref = firebase.database().ref().child("items").orderByChild('feedId').equalTo($stateParams.id);
            $scope.items = $firebaseArray(ref);
            console.log($scope);
        },
        templateUrl: 'views/feed-view.tmpl.html'
    };

    var FeedAddState = {
        name: 'feedAdd',
        parent: 'home',
        url: '/add',
        controller: function($scope, $http) {
            logMilestone("feedAdd");
            $scope.newFeed = {
                "url": "https://changelog.com/podcast/feed"
            };
            var ref = firebase.database().ref();
            $scope.saveFeed = function(feed) {
                console.log(feed);
                var feedId = encodeURIComponent(feed.url).replace(/\./g, '%2E');
                console.log(feedId);
                $http.get(feed.url).then(function(response) {
                    console.log(response.data);
                    var channel = response.data.rss.channel;
                    console.log(channel);
                    var items = channel.item;
                    console.log(items);
                    items.forEach(function(item) {
                        console.log(item);
                        item.feedId = feedId;
                        item.pubDate = new Date(item.pubDate);
                        var guid = encodeURIComponent(item.guid.__text || item.guid).replace(/\./g, '%2E');
                        console.log(guid)
                        ref.child("items").child(guid).set(JSON.parse(JSON.stringify(item)));
                    });
                    delete channel.item;
                    console.log(channel);
                    ref.child("feeds").child(feedId).set(JSON.parse(JSON.stringify(channel)));
                }, function(error) {
                    console.log(error)
                });
            }
            console.log($scope);
        },
        templateUrl: 'views/feed-add.tmpl.html'
    };

    $stateProvider.state('home', HomeState);
    $stateProvider.state('feedList', FeedListState);
    $stateProvider.state('feedView', FeedViewState);
    $stateProvider.state('feedAdd', FeedAddState);
    $urlRouterProvider.otherwise('/');
}

app.controller('NavbarCtrl', function($scope, $firebaseAuth) {
    $scope.authObj = $firebaseAuth();
    $scope.firebaseUser = $scope.authObj.$getAuth();

    $scope.login = function(authType) {
        switch (authType) {
            case 'google':
            default:
                // login with Google
                $scope.authObj.$signInWithPopup(authType).then(function(firebaseUser) {
                    console.log("Signed in as:", firebaseUser.uid);
                    console.log($scope.authObj.$getAuth());
                }).catch(function(error) {
                    console.log("Authentication failed:", error);
                });
        }
    }
});
