app.filter('startFrom',function(){
  return function(data, start){
    if(data!=undefined)
      return data.slice(start);
 }
});

app.factory("CurrentUser", function(){
  var user = {};

  var setUser = function(user)
  {
    this.user = user;
  }

  var getUser = function()
  {
    return this.user;
  }

  var User = function(){
    return this.user;
  }

  return {
    setUser:setUser
  }
})

app.factory("ImageService", function(){
  var addImage = function(filename, data, type, callback)
  {
    if(checkSession(true))
    {
      var user = getStoredValue("_id");
      var sessionId = getStoredValue("sessionId");
      var dataUrl = "/php/image.php";
      doAjaxCall(dataUrl, {"user":user,"sessionId":sessionId,"function":"insert", "filename": filename, "data": data, "type":type},callback);
    }
  }

  var removeImage = function(filename, type, callback)
  {
    if(checkSession(true))
    {
      var user = getStoredValue("_id");
      var sessionId = getStoredValue("sessionId");
      var dataUrl = "/php/image.php";
      doAjaxCall(dataUrl, {"user":user,"sessionId":sessionId,"function":"remove", "filename": filename,"type":type},callback);
    }
  }

  var resizeImage = function(element, type,width, height, callback)
  {
    if(element.files[0])
    {
      var file = element.files[0];
      var reader = new FileReader();
      reader.onloadend = function() {
        var tempImg = new Image();
        tempImg.src = reader.result;

        tempImg.onload = function() {
            var MAX_WIDTH = width;
            var MAX_HEIGHT = height;
            var tempW = tempImg.width;
            var tempH = tempImg.height;
            if (tempW > tempH) {
                if (tempW > MAX_WIDTH) {
                   tempH *= MAX_WIDTH / tempW;
                   tempW = MAX_WIDTH;
                }
            } else {
                if (tempH > MAX_HEIGHT) {
                   tempW *= MAX_HEIGHT / tempH;
                   tempH = MAX_HEIGHT;
                }
            }

            var canvas = document.createElement('canvas');
            canvas.width = tempW;
            canvas.height = tempH;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(this, 0, 0, tempW, tempH);
            var dataURL = canvas.toDataURL(file.type);

            var d = dataURL.substr(dataURL.indexOf('base64,') + 7);
            var decoded = atob(d); // atob decodes base 64
            var size = decoded.length;
            callback(dataURL, size)
          }
       }
       reader.readAsDataURL(file);
     }
  }

  return {
    addImage:addImage,
    removeImage:removeImage,
    resizeImage:resizeImage
  };
})


  app.factory('DataFormatFactory', function() {
    var parseHtml = function(text)
    {
      if(text!=undefined)
        return $.parseHTML(text)[0];
    }
    var secondsToUiString = function(seconds, hideTime)
    {
      return dateTimeToUiString(secondsToDateTime(seconds),hideTime);
    }
    var dateTimeToUiString = function(date,hideTime)
    {
    	var year = date.getFullYear();
    	var month = date.getMonth()+1;
    	var day = date.getDate();
    	var hour = date.getHours();
    	var minute = date.getMinutes();
      if(hideTime)
        return year+"."+zeroFill(month)+"."+zeroFill(day);
    	return year+"."+zeroFill(month)+"."+zeroFill(day) + " " + zeroFill(hour) +":"+zeroFill(minute);
    };
    var secondsToDateTime=function(secs, hoursAdd)
    {
    	var t = new Date(1970,0,1);
    	t.setSeconds(secs);
    	if(hoursAdd!=undefined)
    		t.setHours(t.getHours()+hoursAdd);
    	return t;
    }
    var zeroFill = function(i) {
    	return (i < 10 ? '0' : '') + i
    }
    var showCellData =   function(stat,header){
  		var value = stat[header.value];
  		var format = header.format;
  		var retVal = "";
  		if(value== null)
  		{
  			retVal = "NULL";
  		}
  		else if(value== undefined)
  		{
  			retVal = "undefined";
  		}
  		else
  		{
  			switch (format)
  			{
  				case "date": retVal = dateTimeToUiString(secondsToDateTime(value.sec,2))
  					break;
  				default:
  					retVal = value;
  					break;

  			}
  		}
  		return retVal ;
  	};
    var getString = function(value)
  	{
  		if(texts!=undefined)
  		{
  			var text = texts[value];
  			if(text==undefined)
  			 	return "'"+value+"' "+texts["notFound"];
  			else
  				return text;
  		}
  		else {
  			return "Texts not loaded";
  		}
  	}
    return {
      parseHtml:parseHtml,
      dateTimeToUiString:dateTimeToUiString,
      showCellData:showCellData,
      getString:getString,
      zeroFill:zeroFill,
      secondsToUiString:secondsToUiString,
      secondsToDateTime:secondsToDateTime
    };
  });


app.controller('AppCtrl', ['$scope', '$mdBottomSheet','$mdSidenav', '$mdDialog','DataFormatFactory','$interval','$mdToast','CurrentUser', function($scope, $mdBottomSheet, $mdSidenav, $mdDialog,$dataFormatFactory,$interval,$mdToast, $currentUser){
  $scope.dataFormatFactory = $dataFormatFactory;
  $scope.user={};
  $scope.RememberMe = true;
  $scope.CrossTab = true;
  $scope.getTabFromHash = function(){
    var hash = location.hash;
    if(hash.indexOf('#')>=0)
    {
      if(hash.indexOf('?')>=0)
      {
        return hash.substring(hash.indexOf('#')+1,hash.indexOf('?'));
      }
      else {
        return hash.substring(hash.indexOf('#')+1);
      }
    }
    else {
      return "startTab";
    }
  }
  $scope.tab = $scope.getTabFromHash();
  $scope.alerts = [];
  $scope.showSearch = false;
  $scope.PrimaryColor = getStoredValue('PrimaryColor')==""?ThemeColors[5]:getStoredValue('PrimaryColor');
  $scope.Colors = ThemeColors;
  $scope.AccentColor = getStoredValue('AccentColor')==""?ThemeColors[4]:getStoredValue('AccentColor');
  $scope.DarkTheme = getStoredValue('DarkTheme') =="true"?true:false;
  $scope.selectedLanguage = getStoredValue('pageLanguage');
  $scope.Languages = Languages;
  $scope.News = {};
  $scope.MenuTypes = {};
  $scope.menu = [];

    $scope.applyMenu = function()
    {
      for(var index in $scope.menu)
      {
        var item = $scope.menu[index];
        if(item.signInRequired)
        {
          switch(item.type){
            case $scope.MenuTypes.User:
              item.visible = $scope.user.email != undefined;
            break;
            case $scope.MenuTypes.Admin:
              item.visible = $scope.user.role == "admin";
            break;
            case $scope.MenuTypes.Default:
              item.visible = true;
            break;
          }
        }
      }
    }


  $scope.changeDarkTheme = function(dark)
  {
    $scope.DarkTheme = dark;
    storeValue('DarkTheme', dark);
    $scope.saveTheme();
  }

  $scope.changeTheme = function(primColor, accColor)
  {
    //quickfix idk why controller isnt updating the value
    if(primColor === accColor)
    {
      showError("Use different colors.")
    }
    else {
      $scope.PrimaryColor = primColor;
      $scope.AccentColor = accColor;
      storeValue('PrimaryColor', primColor);
      storeValue('AccentColor', accColor);
    }
    $scope.saveTheme();
  }

  $scope.saveTheme = function()
  {
    var data = {};
    data.theme = {};
    data.theme.primaryColor = $scope.PrimaryColor;
    data.theme.accentColor = $scope.AccentColor;
    data.theme.darkTheme = $scope.DarkTheme;
    $scope.saveSettings(data);
  }

  $scope.removeInvalidImages = function(){
    if(checkSession(false))
    {
      var user = getStoredValue("_id");
      var sessionId = getStoredValue("sessionId");
      var dataUrl = "/php/image.php"
      doAjaxCall(dataUrl, {"user":user,"sessionId":sessionId,"function":"removeInvalid"},function(data){
        if(data.CRUDstatus.Success!=true)
        {
          showError(data.CRUDstatus.Error);
        }
        else
        {
          showToast("Success");
        }
      });
    }
  }

  $scope.restartServer = function(secret){
    if(checkSession(false)&&secret!="")
    {
      secret = $.sha256(secret);
      var dataUrl ="/php/restartServer.php"
      doAjaxCall(dataUrl, {"secret":secret},function(data){
          showToast(data.return);
      });
    }
  }

  $scope.saveSettings = function(data)
  {
    if(checkSession(false))
    {
      var user = getStoredValue("_id");
      var sessionId = getStoredValue("sessionId");
      var dataUrl = "/php/user.php"
      if(user.length>0 && sessionId.length>0)
      {
        doAjaxCall(dataUrl, {"user":user,"sessionId":sessionId,"function":"saveSettings", "settings":data},function(data){
          if(data.CRUDstatus.Success!=true)
          {
            showError(data.CRUDstatus.Error);
          }
          else
          {
            showToast("Success");
          }
        });
      }
    }
  }


  $scope.changeLanguage = function(language, save)
  {
    if(checkSession(false)&&save)
    {
      $scope.saveSettings({"language":language});
    }
    storeValue("pageLanguage",language);
    document.cookie="pageLanguage="+language;
    $scope.getTexts(language);
  }

  $scope.addAlert = function(alert) {
    $scope.alerts.push(alert);
  };

  $scope.showSimpleToast = function(msg) {
      $mdToast.show(
        $mdToast.simple()
          .textContent(msg)
          .position('top right')
          .hideDelay(3000)
      );
  };

  $scope.closeAlert = function(index) {
    if(index==undefined)
    {
      $scope.alerts = [];
    }
    else {
      $scope.alerts.splice(index, 1);
    }
  };

  $scope.loadMetaTags = function()
  {
    for(var index in metagTags)
    {
      var metatag = metagTags[index];
      var htmlTag = $("<meta />");
      htmlTag.attr("name", metatag.name);
      htmlTag.attr("content", metatag.content);
      $("head").append(htmlTag);
    }
  }

  $scope.loadInitData  = function()
  {
      var dataUrl = "/php/getInitData.php?";
      doAjaxCall(dataUrl,{}, function(data)  {
          ForceScriptReload =  Boolean(data.ForceScriptReload);
          storeValue("ForceScriptReload", ForceScriptReload)
          MaxFileSize = parseInt(data.MaxFileSize);
          storeValue("MaxFileSize", MaxFileSize)
          $scope.$apply(function(){
          $scope.menu = data.menu;
          $scope.MenuTypes = data.menuTypes;
          $scope.applyMenu();
        })
    });
  }

  $scope.login = function(manual, pwd)
  {
        var userEmail = getStoredValue("email");
        var user = getStoredValue("_id");
        if(userEmail.length > 0 || userId.length > 0){

            if(manual)
            {
              RememberMe = $scope.RememberMe;
              CrossTab  = $scope.CrossTab;
              storeValue("rememberMe",$scope.RememberMe);
              storeValue("crossTab",$scope.CrossTab);
            }
            else {
              $scope.RememberMe = getStoredValue("rememberMe");
              $scope.CrossTab = getStoredValue("crossTab");
            }
            var data = {"userEmail":userEmail,"user":user, "manual": manual, "RememberMe":$scope.RememberMe, "function" :"login"};
            var userData = getClientInfos();
            if(userData!=null)
              data.userData = JSON.stringify(userData)
            if(pwd!=undefined)
              data.pwd = pwd;
            else {
              data.sessionId = getStoredValue("sessionId");
            }
            var dataUrl = "/php/user.php";
            doAjaxCall(dataUrl,data, function(data){
              /*if(data.News.date2.sec)
              {
                var date1 = $dataFormatFactory.secondsToUiString(data.News.date1.sec);
                var date2 = $dataFormatFactory.secondsToUiString(data.News.date2.sec);
              }*/
              if(data.CRUDstatus.Success!=true)
              {
  							showError(data.CRUDstatus.Error);
                removeValue();
              }
              else
              {
                for(var index in data.News)
                {
                  var news = data.News[index];
                  $scope.News[index] = news;
                }
                removeOldMsgs();

                var expire=undefined;
                if($scope.RememberMe==true)
                  expire=7;

                for(var key in data.user)
                {
                  storeValue(key,data.user[key],expire);
                }
                storeValue("sessionId",data.sessionId.$id,expire);
                storeValue("_id",data.user._id.$id,expire);
                $("#username").val("");
                $("#password").val("");
                $scope.selectedTab($scope.tab);
                if(manual)
                  $scope.selectedTab('startTab');
                $scope.$apply(function(){
                  if(data.user.settings!=undefined)
                  {
                    if(data.user.settings.theme!=undefined)
                    {
                      $scope.PrimaryColor=data.user.settings.theme.primaryColor;
                      $scope.AccentColor=data.user.settings.theme.accentColor;
                      $scope.DarkTheme=data.user.settings.theme.darkTheme=="true"?true:false;
                    }
                    if(data.user.settings.language!=undefined)
                    {
                      $scope.changeLanguage(data.user.settings.language);
                    }
                  }

                  $currentUser.setUser(data.user);
                  $scope.user = $currentUser.user;//data.user;

                  $scope.applyMenu();
                });
              }
            });
        } else {
          showError('Please fill all necessary fields');
        }
  }

  $scope.startloading = function()
  {
    //$scope.applyMenu();

    $(document).ajaxStart(function(){
			$(".loading").show();
		})
		.ajaxStop(function(){
			$(".loading").hide();
		});
    getRememberMe()
    if(checkSession(false))
    {
      $scope.login(false);
    }
    else {
      $scope.selectedTab($scope.tab);
    }
  }

  function getRememberMe()
  {
    var value = "";
    value = sessionStorage.getItem("rememberMe");
    if(value=="" || value==undefined|| value == null)
      value = localStorage.getItem("rememberMe");
      if(value=="" || value==undefined|| value == null)
        value = true;
    $scope.RememberMe = value;
    RememberMe = value;

    value = "";
    value = sessionStorage.getItem("crossTab");
    if(value=="" || value==undefined|| value == null)
      value = localStorage.getItem("crossTab");
    if(value=="" || value==undefined|| value == null)
      value =true;

    $scope.CrossTab =value;
    CrossTab =value;
  }

  var loadScriptCount = 1;
  $scope.loadscript = function(index) {
      return function(data, textStatus, jqXHR) {
        localStorage.setItem(this.scriptname, data);
        var scriptTag = $("<script></script>");
        scriptTag.text(data);
        scriptTag.attr("type", "text/javascript");
        scriptTag.attr("src", this.src);
        $("head").append(scriptTag);
        if(loadScriptCount == Object.keys(scripts).length)
          $scope.startloading();
        loadScriptCount++;
      };
  };


  $scope.loadScripts = function()
  {
    $scope.loadInitData();
    for(var index in scripts)
    {
      var entry = scripts[index]
      var name = entry.name;
      var script = localStorage.getItem(name);
      if(script!=undefined && script!="undefined" && !ForceScriptReload)
      {
        //loadscript from localStorage
        var scriptTag = $("<script></script>");
        scriptTag.text(script);
        scriptTag.attr("type", "text/javascript");
        scriptTag.attr("src", entry.url);
        $("head").append(scriptTag);
        if(index == Object.keys(scripts).length)
          $scope.startloading();
      }
      else {
        //load script from source
        var url = entry.url;
        $.ajax({
          url: url,
          dataType: "script",
          success: $scope.loadscript(),
          context: {scriptname: name, index : index, src : url}
        });
      }
    }
  }

  $scope.load = function()
  {
    //$scope.loadMetaTags();
    $scope.loadInitData();
    //$scope.startloading();
    //$scope.loadScripts();
  }


  $scope.getTexts = function(language)
  {
    $.getJSON('../lang/'+language+'.json',{}, function(data) {
      texts = data;
      storeValue("texts",JSON.stringify(texts));
      //$scope.load();
    }).error(function(data) {
      showError("something went wrong");
    });
  }

  ForceScriptReload = getStoredValue("ForceScriptReload")=="true";
  if(($scope.selectedLanguage == "") || (getStoredValue("texts") == "") || (ForceScriptReload == true))
  {
    switch(navigator.language){
      case 'de':
      case "de-DE":
        $scope.changeLanguage("de")
        break;
      case 'en':
      case "en-US":
      case "en-UK":
        $scope.changeLanguage("en")
        break;
      default:
        $scope.changeLanguage("de")
        break;
    }
  }
  else {
    texts = JSON.parse(getStoredValue("texts"));
    //$scope.load();
  }

    $scope.toggleSidenav = function(menuId) {
      $mdSidenav(menuId).toggle();
    };



      $scope.selectedTab = function(setTab)
      {
        $mdSidenav("left").close();
        $interval.cancel(cpuIntervalId);
        //clearInterval(cpuIntervalId);
        $scope.tab = setTab;
        $(".navbar-collapse").collapse('hide');
        $mdDialog.cancel();
        switch($scope.tab)
        {
          case "mediaTab":
              var params = {};
              params.id =  $scope.getParamFromUrl("id");
              params.type=  $scope.getParamFromUrl("type");
              angular.element('[ng-controller="MediaCtrl"]').scope().init(params);
              break;
          case "workoutsTab":
             getExcercises(true, undefined, "musclegroup", "1");
             angular.element('[ng-controller="WorkoutController"]').scope().getWorkoutsAngular();
             break;
          case "bugTab":
            if($scope.user.role == "admin")
            {
              angular.element('[ng-controller="BugCtrl"]').scope().showBugs = true;
              angular.element('[ng-controller="BugCtrl"]').scope().getBugs();
            }
            else {
              angular.element('[ng-controller="BugCtrl"]').scope().showBugs = false;
            }
            break;
          case "excercisesTab":
             angular.element('[ng-controller="ExcerciseController"]').scope().getExcercisesAngular();
             break;
          case "userInfoTab":
            angular.element('[ng-controller="UserCtrl"]').scope().getUserInfo();
            break;
          case "shishaTab":
            var params = {};
            params.id =  $scope.getParamFromUrl("id");
            params.type=  $scope.getParamFromUrl("type");
            //angular.element('[ng-controller="ShishaCtrl"]').scope().init(params);
            break;
          case "signupTab":
             break;
          case "imprintTab":
            break;
          case "privacyTab":
            break;
          case "loginTab":
            break;
          case "settingsTab":
            break;
          case "versionTab":
            if($scope.user.role == "admin")
              angular.element('[ng-controller="VersionCtrl"]').scope().showAdd = true;
            else {
              angular.element('[ng-controller="VersionCtrl"]').scope().showAdd = false;
            }
            angular.element('[ng-controller="VersionCtrl"]').scope().getVersions();
            break;
          case "logoutTab":
            $scope.logout();
            break;
          case "statisticTab":
            angular.element('[ng-controller="StatsCtrl"]').scope().getStatistics();
              break;
          case "usersTab":
            angular.element('[ng-controller="UsersCtrl"]').scope().getUsers();
              break;
          case "dashboardTab":
            angular.element('[ng-controller="DashboardCtrl"]').scope().getSrvInfo();
            //getSrvInfo();
            break;
          case "startTab":
          default:
              if(checkSession(false))
              {
                $scope.tab = "startTab";
                angular.element('[ng-controller="StartPageCtrl"]').scope().getStartPageContent();
              }
              else
              {
                $scope.tab = "mainTab";
              }
              break;
        }

      }
  $scope.getParamFromUrl = function(param){
    var url = window.location.href; // or window.location.href for current url
    var myRe = new RegExp(param+"=([^&]+)");
    var captured = myRe.exec(url);
    var result = captured ? captured[1] : false;
    return result;
  }

  $scope.loginForm = function()
  {
    var user = $("#username").val().trim();
    var pwd = $('#password').val()
    if(user.length > 0 && pwd.length > 0){
      storeValue("email",user);
      pwd = $.sha256(user+pwd);
      $scope.login(true, pwd);
    }
    else {
      showError('Please fill all necessary fields');
    }
  }

  $scope.signup = function()
  {
    var email = $("#usernameSignUp").val().trim();
    		var pwd = $.sha256(email+$('#passwordSignUp').val().trim());
    		var pwd2 = $.sha256(email+$('#passwordSignUp2').val().trim());

    		if(pwd==pwd2)
    		{
          var dataUrl = "/php/user.php";
          var user = getStoredValue("_id");
          //var sessionId = getStoredValue("sessionId");
          var data = {}
          data.function = "signup";
          data.email = email;
      		data.pwd = pwd;
      		data.firstname =$("#firstnameSignUp").val().trim();
      		data.lastname = $("#lastnameSignUp").val().trim();
      		data.city = $("#citySignUp").val().trim();
      		data.country =$("#countrySignUp").val().trim();
      		data.street = $("#streetSignUp").val().trim();
          var userData = getClientInfos();
          if(userData!=null)
    				data.userData = JSON.stringify(userData);

          doAjaxCall(dataUrl,data,function(data)
    			//	doAjaxCall(dataUrl, {"email":email,"sessionId":sessionId},function(data)
    				{
    					if(data.CRUDstatus.Success!=true)
    					{
    						showError(data.CRUDstatus.Error);
    						removeValue("username");
    						removeValue("password");
    						removeValue("session");
    					}
    					else
    					{
    						showSuccess(data.status);
    						$('#passwordSignUp').val("");
    						$('#passwordSignUp2').val("");
    						$('#usernameSignUp').val("");
    						$('#firstnameSignUp').val("");
    						$('#lastnameSignUp').val("");
    						$('#countrySignUp').val("");
    						$('#citySignUp').val("");
    						$('#streetSignUp').val("");
    						//$('.content').hide();
    						//$('#mainContent').show();
    					}
    				});
    		}
    		else
    		{
    			showError("Passwords are not equal");
    		}

  }


  $scope.logout = function()
  {
  	var user = getStoredValue("_id");
  	var sessionId = getStoredValue("sessionId");
  	if(user.length > 0 && sessionId.length > 0){
      var dataUrl = "/php/user.php";
      var user = getStoredValue("_id");
      var sessionId = getStoredValue("sessionId");
      var data = {"user":user,"sessionId":sessionId,"function":"logout"};
      var userData = getClientInfos();
      if(userData!=null)
        data.userData = JSON.stringify(userData);
      doAjaxCall(dataUrl,data,function(data){
        if(data.CRUDstatus.Success!=true)
        {
          showError(data.CRUDstatus.Error);
        }
        else {
          $scope.$apply(function(){
            $scope.RememberMe = true;
            $scope.CrossTab = true;
            $currentUser.user = {};
            $scope.user = {};
            $scope.News ={};
            $scope.applyMenu();
            removeValue();
            $scope.selectedTab('startTab');
          });
        }
  	  });
    }
    else {
  	}

  }

    $scope.isSelected = function(checkTab){
      return this.tab === checkTab;
    }



    $scope.loadMetaTags();
    $scope.startloading();
    $scope.loadInitData();




    $(document).on('click', 'a', function (e) {
      e.preventDefault();
      var $this = $(this),
          url = $this.attr("href"),
          title = $this.attr("title");
      if(title!=""&&title!=undefined)
      {
        history.pushState({
            url: url,
            title: title
        }, title, url);
        document.title = title;
      }
    });

$(window).on('popstate', function (e) {
    var state = e.originalEvent.state;
    if (state !== null) {
        document.title = state.title;

        var selectedTab = state.url.replace("#","")
        if(selectedTab.indexOf("?")>-1)
          selectedTab = selectedTab.substring(0,selectedTab.indexOf("?"))
        $scope.selectedTab(selectedTab)
    } else {
        document.title = 'Uups';
    }
});

  }]);


  app.controller('FabSpeedDialCtrl', function($scope, $timeout) {
    $scope.location = window.location.origin;
    $scope.fabSpeedDial = {
      hidden : false,
      isOpen : false,
      hover : false,
      items : [
        { name: "Mail", icon: "mdi mdi-email", direction: "bottom" ,url:"mailto:?Subject="+$scope.location+"&amp;Body=I%20saw%20this%20and%20thought%20of%20you!%20 "+$scope.location},
        { name: "Facebook", icon: "mdi mdi-facebook-box", direction: "top" ,url:"http://www.facebook.com/sharer.php?u="+$scope.location},
        { name: "Google Plus", icon: "mdi mdi-google-plus", direction: "bottom",url:"https://plus.google.com/share?url="+$scope.location }
      ],
    };

    $scope.$watch('fabSpeedDial.isOpen', function(isOpen) {
      if (isOpen) {
        $timeout(function() {
          $scope.fabSpeedDial.tooltipVisible = $scope.fabSpeedDial.isOpen;
        }, 600);
      } else {
        $scope.fabSpeedDial.tooltipVisible = $scope.fabSpeedDial.isOpen;
      }
    });
  });

  app.directive('userAvatar', function() {
    return {
      replace: true,
      template: '<svg class="user-avatar" viewBox="0 0 128 128" height="64" width="64" pointer-events="none" display="block" > <path fill="#FF8A80" d="M0 0h128v128H0z"/> <path fill="#FFE0B2" d="M36.3 94.8c6.4 7.3 16.2 12.1 27.3 12.4 10.7-.3 20.3-4.7 26.7-11.6l.2.1c-17-13.3-12.9-23.4-8.5-28.6 1.3-1.2 2.8-2.5 4.4-3.9l13.1-11c1.5-1.2 2.6-3 2.9-5.1.6-4.4-2.5-8.4-6.9-9.1-1.5-.2-3 0-4.3.6-.3-1.3-.4-2.7-1.6-3.5-1.4-.9-2.8-1.7-4.2-2.5-7.1-3.9-14.9-6.6-23-7.9-5.4-.9-11-1.2-16.1.7-3.3 1.2-6.1 3.2-8.7 5.6-1.3 1.2-2.5 2.4-3.7 3.7l-1.8 1.9c-.3.3-.5.6-.8.8-.1.1-.2 0-.4.2.1.2.1.5.1.6-1-.3-2.1-.4-3.2-.2-4.4.6-7.5 4.7-6.9 9.1.3 2.1 1.3 3.8 2.8 5.1l11 9.3c1.8 1.5 3.3 3.8 4.6 5.7 1.5 2.3 2.8 4.9 3.5 7.6 1.7 6.8-.8 13.4-5.4 18.4-.5.6-1.1 1-1.4 1.7-.2.6-.4 1.3-.6 2-.4 1.5-.5 3.1-.3 4.6.4 3.1 1.8 6.1 4.1 8.2 3.3 3 8 4 12.4 4.5 5.2.6 10.5.7 15.7.2 4.5-.4 9.1-1.2 13-3.4 5.6-3.1 9.6-8.9 10.5-15.2M76.4 46c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6-.9 0-1.6-.7-1.6-1.6-.1-.9.7-1.6 1.6-1.6zm-25.7 0c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6-.9 0-1.6-.7-1.6-1.6-.1-.9.7-1.6 1.6-1.6z"/> <path fill="#E0F7FA" d="M105.3 106.1c-.9-1.3-1.3-1.9-1.3-1.9l-.2-.3c-.6-.9-1.2-1.7-1.9-2.4-3.2-3.5-7.3-5.4-11.4-5.7 0 0 .1 0 .1.1l-.2-.1c-6.4 6.9-16 11.3-26.7 11.6-11.2-.3-21.1-5.1-27.5-12.6-.1.2-.2.4-.2.5-3.1.9-6 2.7-8.4 5.4l-.2.2s-.5.6-1.5 1.7c-.9 1.1-2.2 2.6-3.7 4.5-3.1 3.9-7.2 9.5-11.7 16.6-.9 1.4-1.7 2.8-2.6 4.3h109.6c-3.4-7.1-6.5-12.8-8.9-16.9-1.5-2.2-2.6-3.8-3.3-5z"/> <circle fill="#444" cx="76.3" cy="47.5" r="2"/> <circle fill="#444" cx="50.7" cy="47.6" r="2"/> <path fill="#444" d="M48.1 27.4c4.5 5.9 15.5 12.1 42.4 8.4-2.2-6.9-6.8-12.6-12.6-16.4C95.1 20.9 92 10 92 10c-1.4 5.5-11.1 4.4-11.1 4.4H62.1c-1.7-.1-3.4 0-5.2.3-12.8 1.8-22.6 11.1-25.7 22.9 10.6-1.9 15.3-7.6 16.9-10.2z"/> </svg>'
    };
  });
  app.directive( 'media', function () {
    return {
      templateUrl: 'scripts/templates/mediaTmpl.html'
    };
  });
  app.directive( 'excercises', function () {
    return {
      templateUrl: 'scripts/templates/excerciseTmpl.html'
    };
  });
  app.directive( 'workouts', function () {
    return {
      templateUrl: 'scripts/templates/workoutTmpl.html'
    };
  });

  app.directive( 'login', function () {
    return {
      templateUrl: 'scripts/templates/loginTmpl.html'
    };
  });

  app.directive( 'logout', function () {
    return {
      templateUrl: 'scripts/templates/loginTmpl.html'
    };
  });

  app.directive( 'signup', function () {
    return {
      templateUrl: 'scripts/templates/signupTmpl.html'
    };
  });

  app.directive( 'statistics', function () {
    return {
      templateUrl: 'scripts/templates/statsTmpl.html'
    };
  });

  app.directive( 'dashboard', function () {
    return {
      templateUrl: 'scripts/templates/dashboardTmpl.html'
    };
  });
  app.directive( 'startTab', function () {
    return {
      templateUrl: 'scripts/templates/startTmpl.html'
    };
  });

  app.directive( 'user', function () {
    return {
      templateUrl: 'scripts/templates/userTmpl.html'
    };
  });

  app.directive( 'bugs', function () {
    return {
      templateUrl: 'scripts/templates/bugsTmpl.html'
    };
  });
  app.directive( 'version', function () {
    return {
      templateUrl: 'scripts/templates/versionTmpl.html'
    };
  });
  app.directive( 'users', function () {
    return {
      templateUrl: 'scripts/templates/usersTmpl.html'
    };
  });
  app.directive( 'privacy', function () {
    return {
      templateUrl: 'scripts/templates/privacyTmpl.html'
    };
  });
  app.directive( 'imprint', function () {
    return {
      templateUrl: 'scripts/templates/imprintTmpl.html'
    };
  });
  app.directive( 'settings', function () {
    return {
      templateUrl: 'scripts/templates/settingsTmpl.html'
    };
  });

  app.directive( 'shishaTobacco', function () {
    return {
      templateUrl: 'scripts/templates/shishaTobaccoTmpl.html'
    };
  });
  app.directive( 'shishaCoal', function () {
    return {
      templateUrl: 'scripts/templates/shishaCoalTmpl.html'
    };
  });

  app.directive('errSrc', function() {
  return {
    link: function(scope, element, attrs) {
      element.bind('error', function() {
        if (attrs.src != attrs.errSrc) {
          attrs.$set('src', attrs.errSrc);
        }
      });
    }
  }
});

  app.config(function($mdThemingProvider) {
    var themeCount = 0;
    for(var index in ThemeColors)
    {
      var color = ThemeColors[index];
      for(var index2  in ThemeColors)
      {
        var accentColor = ThemeColors[index2];
        if(color!=accentColor)
        {
          $mdThemingProvider.theme(color+accentColor).primaryPalette(color).accentPalette(accentColor)
          $mdThemingProvider.theme(color+accentColor+"dark").primaryPalette(color).accentPalette(accentColor).dark();
          themeCount +=2;
        }
      }
    }
        //  $mdThemingProvider.theme('grey').primaryPalette('grey')
      $mdThemingProvider.setDefaultTheme('greygreen');
      $mdThemingProvider.alwaysWatchTheme(true);
  });

  app.config(['$mdIconProvider', function($mdIconProvider) {
    $mdIconProvider
      .iconSet('demo', '/thirdParty/font/custom.svg', 24)
      .iconSet('material', '/thirdParty/fonts/materialdesignicons-webfont.svg', 24);
  }]);

angular.module('application.templates', []).run(['$templateCache', function($templateCache) {

}]);
