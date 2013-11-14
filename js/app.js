

$(function() {
  var scannerInput="";
  var logs = null;
  var user;
  Parse.$ = jQuery;

  // Initialize Parse with your Parse application javascript keys
  Parse.initialize("qZdryhcPeunhMLO1dlVYYtV0Vohnqg1L9jLwLGAe",
                   "z5qa1zlwK0eN468e1vxbkvvaHScxbqeX9myRC9pH");

  var AppState = Parse.Object.extend("AppState", {
      defaults: {
        filter: "all"
      }
  });

  var Log = Parse.Object.extend("Logs",{
    initialize:function(){

    }
  });

  var Logs = Parse.Collection.extend({
    model:Log,
    initialize:function(){

    },

  });


  var UserInfoView = Parse.View.extend({
    tagName:"li",
    template: _.template($("#player-template").html()),
    closedTemplate:_.template($('#closed-player-template').html()),
    events:{
      "click .toggle": "toggleView"
    },
    initialize:function()
    {
      _.bindAll(this, 'render', 'toggleView');
      this.open=false;
      this.render();
    },
    render: function() {
      if(this.open)
      {
        var json = this.model.toJSON();
        var arrayToCount = logs.pluck("cardId");
        var count=0;
        for(var i=0;i<arrayToCount.length;i++)
        {
          if(json["cardId"]==arrayToCount[i])count++;
        }
        json["count"]=count;
        console.log(count);
        $(this.el).html(this.template(json));
      }
      else
      {
        $(this.el).html(this.closedTemplate(this.model.toJSON()));
      }
      return this;
    },
    toggleView:function()
    {
      console.log("button pressed");
      this.open=!this.open;
      this.render();
    }
  });

  var UserInfo = Parse.Object.extend("UserInfo",{
  });

  var UserInfos = Parse.Collection.extend({
    model:UserInfo
  });

  var AdminPanelView = Parse.View.extend({
    el: $("#app"),
    events: {
      "click .log-out": "logOut",
    },    
    initialize:function(){
      var self=this;
      //summon the logs
      logs = new Logs;

      var today=new Date();

      logs.query = new Parse.Query(Log);
      logs.query.equalTo("clubName", Parse.User.current().get("username").split("_")[0]);
      logs.fetch({
        success:function(result){
          /*self.userInfos = new UserInfos;
          self.userInfos.query = new Parse.Query(UserInfo);
          self.userInfos.query.containedIn("cardId",(logs.pluck("cardId")));
          self.userInfos.fetch({
            success:function(result){
              self.render();
            }
          });*/
        }
      });
    self.render();
      _.bindAll(this,'render');
    },
    render:function(){
      var self=this;
      this.$el.html(_.template($("#admin-template").html()));
      /*this.$("#members").html("");
      this.userInfos.each(function(userInfo){
        var view = new UserInfoView({model: userInfo});
        self.$("#members").append(view.render().el);
      });*/

      //graph stuff
      var data = [];
      var intermediate = [];
      var aMonthAgo = new Date();
      aMonthAgo.setDate(aMonthAgo.getDate()-30);
      aMonthAgo=Math.floor(aMonthAgo/(24*60*60*1000));
      var graphLogs = logs.pluck("date");

      for(var i=0;i<graphLogs.length;i++)
      {
        var roundedLog = Math.floor(graphLogs[i]/(24*60*60*1000));
        var daysAgo = roundedLog - aMonthAgo;
        if(daysAgo>=0)intermediate.push(daysAgo);
      }

      for(var i=0;i<intermediate.length;i++)
      {
        for(var j=0;j<i;j++)
        {
          if(intermediate[i]<intermediate[j])
          {
            var tmp=intermediate[i];
            intermediate[i]=intermediate[j];
            intermediate[j]=tmp;
          }
        }
      }

      for(var i=0;i<intermediate.length;i++)
      {
        var size = intermediate.filter(function(value) { return value == intermediate[i] }).length;
        var inArray=false;
        for(var j=0;j<data.length;j++)
        {
          if(data[j][0]==intermediate[i])
          {
            inArray=true;
          }
        }
        if(!inArray)
        {
          data.push([intermediate[i],size]);
        }
      }

      self.$("#graph").plot([data],{
        series:{lines:{show:true},points:{show:true}},
        xaxis:{show:false},
        yaxis:{min:0,tickSize:1,tickDecimals:0}
      });


      this.delegateEvents();
    },
    logOut:function(){
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete self;
    }
  });

 

  var ScanView = Parse.View.extend({
    el: $("body"),
    events: {
      "click .go-back": "goBack",
      "keypress": "processScan",
    },    
    initialize:function(){
      _.bindAll(this,'render');
      this.render();

      //summon the logs for today
      //assumption: a person will sign in once per day per club at most
      logs = new Logs;

      var today=new Date();
      today.setHours(0);
      today.setMinutes(0);
      today.setSeconds(0);

      logs.query = new Parse.Query(Log);
      logs.query.equalTo("clubName", user);
      //all logs from the club, name got by stripping off the "_Admin" bit off
      logs.query.greaterThanOrEqualTo("date",today);

      logs.fetch();
    },
    render:function(){
      this.$("#app").html(_.template($("#scan-template").html()));
      this.delegateEvents();
    },
    goBack:function(){
      new LogInView();
      this.undelegateEvents();
      delete self;
    },

    processScan:function(event){ 
       if(event.keyCode == 13)//enter were pressed
            {
              var cardId=(/^\d+$/.test(scannerInput))?(parseInt(scannerInput,10).toString(16)):"";
                //little test to make sure a not-number didn't get into the scanner input somehow
              scannerInput="";
              if(cardId=="")
              {
              }
              else
              {
                console.log("SCANNER:\tlogged card hex ID "+cardId);
                //now we add the card to our collection
                if($.inArray(cardId,logs.pluck("cardId"))<0)
                {
                  logs.create(
                  {
                    clubName: user,
                    cardId: cardId,
                    date: new Date()
                  });
                }
              }
              
            }
      else{
        if(event.keyCode>=48&&event.keyCode<58)scannerInput+=((event.keyCode)-48).toString();
          //if a decimal number, append to code
        else scannerInput="";
          //someone's planking on keyboard
        if(scannerInput.length>10)scannerInput=scannerInput.substring(scannerInput.length-10);
          //truncate to 10 digits, seems to be the hard number the scanners output
      }
    },
  });

  var LogInView = Parse.View.extend({
    events: {
      "submit form.login-form": "logIn",
      "change #club": "goToScan"
    },

    el: "#app",
    
    initialize: function() {
      _.bindAll(this, "logIn");
      this.render();
    },

    logIn: function(e) {
      var self = this,
          username = this.$("#login-username").val(),
          password = this.$("#login-password").val();
      
      Parse.User.logIn(username, password, {
        success: function(user) {
          new AdminPanelView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
          this.$(".login-form button").removeAttr("disabled");
        }
      });

      this.$(".login-form button").attr("disabled", "disabled");

      return false;
    },

    goToScan:function()
    {
      new ScanView();
      this.undelegateEvents();
      delete this;
    },

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    }
  });

  // The main view for the app
  var AppView = Parse.View.extend({
    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("body"),

    initialize: function() {
      this.render();
    },

    render: function() {
      if (Parse.User.current()) 
      {
        new AdminPanelView();
      } else {
        new LogInView();
      }
    }
  });

  var AppRouter = Parse.Router.extend({
    routes: {
      "all": "all",
      "active": "active",
      "completed": "completed"
    },

    initialize: function(options) {
    },

    all: function() {
      state.set({ filter: "all" });
    },

    active: function() {
      state.set({ filter: "active" });
    },

    completed: function() {
      state.set({ filter: "completed" });
    }
  });

  var state = new AppState;

  new AppRouter;
  new AppView;
  Parse.history.start();
});
