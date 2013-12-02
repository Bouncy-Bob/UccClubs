

$(function() {
  var user;
  Parse.$ = jQuery;

  // Initialize Parse with your Parse application javascript keys
  Parse.initialize("ycnTm4Y7C3phZ23SRk7lRRGuOp7PWi83VFKXfew5", "ZfUcjY4ffqQOzZ2LKn2QbWMgAemUqnmOKjJeoihD");

  var AppState = Parse.Object.extend("AppState", {
      defaults: {
        filter: "all"
      }
  });

  var StartView = Parse.View.extend({
    events: {
      "click #button-login": "goToLogin",
      "click #button-reg": "goToRegister"
    },

    el: "#app",
    
    initialize: function() {
      _.bindAll(this, "goToLogin","goToRegister");
      this.render();
    },

    goToLogin: function(e) {
          new LogInView();
          self.undelegateEvents();
          delete self;
    },

    goToRegister: function(e) {
          new RegisterView();
          self.undelegateEvents();
          delete self;
    },
      
    render: function() {
      this.$el.html(_.template($("#start-template").html()));
      this.delegateEvents();
    }
  });

  var RegisterView = Parse.View.extend({
    events: {
      "submit .register-form": "register"
    },

    el: "#app",
    
    initialize: function() {
      _.bindAll(this, "register");
      this.render();
      console.log($(".register-form"));
    },

    register: function(e) {
      var self = this,
          over18=Date.parse(this.$("#reg-date").val())<=(new Date().setDate(new Date().getYear()-18)),
          user=new Parse.User({
            username:this.$("#reg-username").val(),
            password:this.$("#reg-password").val(),
            email:this.$("#reg-email").val(),
            friends:new Array()
          });

      alert(this.$("#reg-date").val());
      if(!over18)
      {
        this.$(".error").val("You must be over 18. Sorry!");
      }
      else
      { 
        user.signUp(null,{
          success:function(u){

            new MenuView();
            self.undelegateEvents();
            delete self;
          },
          error:function(u,e){
            this.$("#error").val(e.message);
            this.$("#error").css('display','inline');
          }
        });
      }
      return false;
    },

    render: function() {
      this.$el.html(_.template($("#register-template").html()));
      this.delegateEvents();
    }
  });

  var LogInView = Parse.View.extend({
    events: {
      "submit form.login-form": "logIn",
    },

    el: "#app",

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    },
    
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
          new MenuView();
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
    }
  });

  var MenuView = Parse.View.extend({
    events: {
      "click #menu-buddies": "showBuddies",
      "click #menu-buds": "buds",
      "click #menu-redeem": "redeem",
      "click #menu-king": "kingOfBeers"
    },

    el: "#app",

    render: function() {
      this.$el.html(_.template($("#menu-template").html()));
      this.delegateEvents();
    },
    
    initialize: function() {
      _.bindAll(this, "showBuddies","buds","redeem","kingOfBeers");
      this.render();
    },

    showBuddies:function(){
      new BuddiesView();
      self.undelegateEvents();
      delete self;
    },

    buds:function(){
      alert("what does this do");
      //what does this do
    },

    redeem:function(){
      alert("what does this do");
      //might want to be a bit more specific to how this works
      //like does a popup happen or what
    },

    kingOfBeers:function(){
      alert("what does this do");
      //what the fuck is this
      //no seriously
    }
  });

  var BuddiesView = Parse.View.extend({
    events: {
        "click #back":"back"
    },

    el: "#app",

    render: function() {
      this.$el.html(_.template($("#buddies-template").html()));
      this.delegateEvents();
    },
    
    initialize: function() {
      var self=this;
      Parse.User.current().fetch({
        success:function(current){
          self.buddies = new BuddyList;
          self.buddies.query=new Parse.Query(Buddy);
          self.buddies.query.containedIn("username",current.get("friends"));
          console.log(current.get("friends"))
          self.buddies.fetch({
            success:function(buddies){
              console.log(buddies);
              buddies.each(function(buddy){
                var view = new BuddyView({model:buddy});
                self.$("#buddies-list").append(view.render().el);
              });
            }
          });
          self.render();
        }
      });
      _.bindAll(this, "back");
      
    },
    back:function(){
      new MenuView;
      this.undelegateEvents();
      delete this;
    }
  });

  var BuddyList=Parse.Collection.extend({});

  var Buddy=Parse.User.extend({});

  var BuddyView = Parse.View.extend({
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#buddy-template').html()),

    // The DOM events specific to an item.
    events: {},

    initialize: function() {
      _.bindAll(this);
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    },
  });

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
        new MenuView();
      } else {
        new StartView();
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
