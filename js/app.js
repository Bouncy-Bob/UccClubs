

$(function() {
  var scannerInput="";
  var logs = null;
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
      console.log(this.el);
      this.open=false;
      this.render();
    },
    render: function() {
      if(this.open)
      {
        $(this.el).html(this.template(this.model.toJSON()));
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
          console.log("hey",this);
          self.userInfos = new UserInfos;
          self.userInfos.query = new Parse.Query(UserInfo);
          self.userInfos.query.containedIn("cardId",(logs.pluck("cardId")));
          console.log(logs.pluck("cardId"));
          self.userInfos.fetch({
            success:function(result){
              console.log("'lo",result);
              self.render();
            }
          });
        }
      });
      _.bindAll(this,'render');
    },
    render:function(){
      var self=this;
      this.$el.html(_.template($("#admin-template").html()));
      this.$("#members").html("");
      this.userInfos.each(function(userInfo){
        console.log(userInfo);
        var view = new UserInfoView({model: userInfo});
        self.$("#members").append(view.render().el);
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
      "click .log-out": "logOut",
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
      logs.query.equalTo("clubName", Parse.User.current().get("username"));
      //all logs from the club, name got by stripping off the "_Admin" bit off
      logs.query.greaterThanOrEqualTo("date",today);

      logs.fetch({
        success:function(result){
          console.log("hi",result);
        }
      });


      
    },
    render:function(){
      this.$("#app").html(_.template($("#scan-template").html()));
      this.delegateEvents();
    },
    logOut:function(){
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete self;
    },

    processScan:function(event){ 
      console.log("works");
       if(event.keyCode == 13)//enter were pressed
            {
              var cardId=(/^\d+$/.test(scannerInput))?(parseInt(scannerInput,10).toString(16)):"";
                //little test to make sure a not-number didn't get into the scanner input somehow
              scannerInput="";
              if(cardId=="")
              {
                console.log("someone messed on the keyboard");
              }
              else
              {
                console.log("SCANNER:\tlogged card hex ID "+cardId);
                //now we add the card to our collection
                if($.inArray(cardId,logs.pluck("cardId"))<0)
                {
                  logs.create(
                  {
                    clubName: Parse.User.current().get("username"),
                    cardId: cardId,
                    date: new Date()
                  });
                  console.log(logs);
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
          if(user.get("admin"))
        {
          new AdminPanelView();
        }
        else
        {
          new ScanView();
        }
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
      if (Parse.User.current()) {
        if(Parse.User.current().get("admin"))
        {
          new AdminPanelView();
        }
        else
        {
          new ScanView();
        }
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
