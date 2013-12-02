

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
            friends:new Array(),
            buds:0
          });

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
      "click #menu-king": "kingOfBeers",
      "click #log-out": "logOut",
      "click #debug-addBud": "addBud"
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
      this.undelegateEvents();
      delete this;
    },

    buds:function(){
      new BudsView();
      this.undelegateEvents();
      delete this;
    },

    redeem:function(){
      alert("I really don't think a webpage can open a QR scanner rody");
      //might want to be a bit more specific to how this works
      //like does a popup happen or what
    },

    kingOfBeers:function(){
      new KingsView();
      this.undelegateEvents();
      delete this;
    },

    logOut:function(){
      console.log("logging out");
      Parse.User.logOut();
      new StartView;
      self.undelegateEvents();
      delete self;
    },

    addBud:function(){
      var code=(Math.random()*100000).toString();
      while(code.length<5)
      {
        code="0"+code;
      }
      var bud=new Bud({free:false,used:false,owner:Parse.User.current(),code:code});
      var mess=new Mess({to:Parse.User.current(),bud:bud,message:"Debug cyber-bud!"});
      console.log(mess);
      bud.save({
        error:function(bud,error){
          console.log(error.message);
        }
      });
      mess.save({
        error:function(mess,error){
          console.log(error.message);
        }
      });
      Parse.User.current().set("buds",Parse.User.current().get("buds")+1);
      Parse.user.current().save();
      console.log("added your pint");
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

  var BudsView = Parse.View.extend({
    events: {
        "click #back":"back",
        "click #send":"send"
    },

    el: "#app",

    template: _.template($('#buds-template').html()),

    render: function() {
      $(this.el).html(this.template(this.json));
      this.delegateEvents();
    },
    
    initialize: function() {
      var self=this;
      self.charity=0;
      self.free=0;
      Parse.User.current().fetch({
        success:function(current){
          console.log("preparing sent query");

          //list of buds you sent
          self.budsSent = new MessList;
          self.budsSent.query=new Parse.Query(Mess);
          self.budsSent.query.equalTo("from",current);
          self.budsSent.fetch({
            success:function(buds){
              buds.each(function(bud){
                var view = new BudView({model:bud});
                self.$("#buds-sent").append(view.render().el);
              });
            }
          });

          //list of buds you've received
          self.budsRecd = new MessList;
          self.budsRecd.query=new Parse.Query(Mess);
          self.budsRecd.query.exists("from");
          self.budsRecd.query.equalTo("to",current);
          self.budsRecd.fetch({
            success:function(buds){
              buds.each(function(bud){
                var view = new BudView({model:bud});
                self.$("#buds-received").append(view.render().el);
              });
            }
          });

          //list of buds you've redeemed
          self.budsRedd = new MessList;
          self.budsRedd.query=new Parse.Query(Mess);
          self.budsRedd.query.equalTo("from",null);
          self.budsRedd.query.equalTo("to",current);
          self.budsRedd.fetch({
            success:function(buds){
              buds.each(function(bud){
                var view = new BudView({model:bud});
                self.$("#buds-redeemed").append(view.render().el);
              });
            }
          });

          //list of buds to use
          self.buds = new BudList;
          self.buds.query=new Parse.Query(Bud);
          self.buds.query.equalTo("owner",Parse.User.current());
          self.buds.query.equalTo("used",false);
          self.chBuds=new Array();
          self.frBuds=new Array();
          self.buds.fetch({
            success:function(buds){
              buds.each(function(bud){
                if(bud.get("free"))
                {
                  self.frBuds.push(bud);
                }
                else
                {
                  self.chBuds.push(bud);
                }
              });
              self.json={};
              self.json.free=self.frBuds.length;
              self.json.charity=self.chBuds.length;
              self.render();
            }
          });
        }
      });
      _.bindAll(this, "back");
      
    },

    send:function(){
      var self=this;
      var stringTo = this.$('#sendTo').val();
      //take either a charity bud (one you can't use) or a free bud to send
      var bud = (chBuds.length==0?frBuds.shift():chBuds.shift());

      //presuming this is verboten
      if(stringTo==Parse.User.current.getUsername())
      {
        alert("You can't send one to yourself!");
        return;
      }

      //get the user to send it to
      var sendToQ= new Parse.Query(Parse.User);
      sendToQ.equalTo("username",stringTo);
      sendToQ.first({
        //make sure he exists
        success:function(receiver){
          if(receiver==undefined){
            alert("That guy doesn't exist!")
          }
          else
          {
            //send the bud to him, unlock if it's a charity one
            bud.set("owner",receiver);
            bud.set("free".true);
            receiver.set("buds",receiver.get("buds")+1);
            Parse.user.current().set("buds",Parse.User.current().get("buds")+1);
            //send him a message too
            var message = new Mess({
              from:Parse.User.current(),
              to:receiver,
              bud:bud,
              message:this.$('#mess').val()
            });
            //refresh the page
            self.render();
            bud.save();
            message.save();
            receiver.save();
            Parse.User.current().save();
            
          }
        }
      });
    },

    use:function(){
      //PUT SOME INDICATION OF IT BEING USED HERE
      var bud = frBuds.shift();
      bud.set("used",true);
      bud.save();
      alert("This bud is now used. CODE: "+bud.get("code"));
      this.render();
    },

    back:function(){
      new MenuView;
      this.undelegateEvents();
      delete this;
    }
  });

  var MessList=Parse.Collection.extend({});

  var Mess = Parse.Object.extend("Message",{});

  var Bud=Parse.Object.extend("Bud",{});

  var BudView = Parse.View.extend({
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#bud-template').html()),

    // The DOM events specific to an item.
    events: {},

    initialize: function() {

      //want both names before rendering
      this.hasFrom=false;
      this.hasTo=false;

      _.bindAll(this);

      //set up the json to use in the template
      this.json={};
      this.json.message=this.model.get("message");
      var self=this;

      //if it's a new 'charity' bud it isn't from anyone
      if(this.model.get("from")==undefined){
        this.json.from="Budweiser Corp";
        this.hasFrom=true;
      }
      else
      {
         this.model.get("from").fetch({
          success:function(from){
            self.json.from=from.getUsername();
            self.hasFrom=true;
            self.render();
          }
        });
      }

      //all buds are sent to someone
      this.model.get("to").fetch({
        success:function(to){
          self.json.to=to.getUsername();
          self.hasTo=true;
          self.render();
        }
      });
    },

    render: function() {
      if(this.hasFrom&&this.hasTo)
      {
        $(this.el).html(this.template(this.json));
      }
      console.log(this.hasFrom,this.hasTo);
      return this;
    }
  });
  
  var BudList = Parse.Collection.extend({});

  var KingsView=Parse.View.extend({
    events: {
        "click #back":"back",
    },

    el: "#app",

    template: _.template($('#kings-template').html()),

    render: function() {
      $(this.el).html(this.template(this.json));
      this.delegateEvents();
    },
    
    initialize: function() {
      var self=this;
      var kings = new Kings;
      kings.query=new Parse.Query(Parse.User);
      kings.query.limit(5);
      kings.query.descending("buds");
      kings.fetch({
        success:function(kings){
          kings.each(function(king){
            console.log(king);
            var view = new KingView({model:king});
            self.$("#kings").append(view.render().el);
          });
        }
      });
      this.render();
    },
    back:function(){
      new MenuView;
      this.undelegateEvents();
      delete this;
    }
  });

  var Kings = Parse.Collection.extend({});

  var KingView = Parse.View.extend({
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#king-template').html()),

    // The DOM events specific to an item.
    events: {},

    initialize: function() {

      _.bindAll(this);

      //set up the json to use in the template
      this.render();
    },

    render: function() {
      
        $(this.el).html(this.template(this.model.toJSON()));
     
      return this;
    }
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
