const
  dotenv = require('dotenv').load({silent: true}),
  express = require('express'),
  mongoose = require('mongoose'),
  flash = require('connect-flash'),
  logger = require('morgan'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  MongoDBStore = require('connect-mongodb-session')(session),
  passport = require('passport'),
  passportConfig = require('./config/passport.js'),
  request = require('request'),
  Yelp = require('yelp'),
  ejs = require('ejs'),
  ejsLayouts = require('express-ejs-layouts'),
  bodyParser = require('body-parser'),
  oauthSignature = require('oauth-signature'),
  n = require('nonce')(),
  qs = require('querystring'),
  _ = require('lodash'),
  userRoutes = require('./routes/users.js'),
  postRoutes = require('./routes/posts.js'),
  port  = (process.env.PORT || 3000),
  Post = require('./models/Post.js'),
  methodOverride = require('method-override')


    // environment port
    mongoConnectionString = process.env.MONGODB_URL || 'mongodb://localhost/passport-authentication'


    // mongoose connection
    mongoose.connect(mongoConnectionString, (err) => {
      console.log(err || "Connected to MongoDB (passport-authentication)")
    })

    // will store session information as a 'sessions' collection in Mongo
  const store = new MongoDBStore({
  uri: mongoConnectionString,
  collection: 'sessions'
    });

  //middleware
  app = express()
  app.use(methodOverride('_method'))
  app.set('view engine', 'ejs')
  app.use(ejsLayouts)
  app.use(express.static(__dirname + '/public'))
  app.use(logger('dev'))
  app.use(cookieParser())
  app.use(bodyParser.urlencoded({extended: true}))
  app.use(bodyParser.json())
  app.use(flash())
  app.use(session({
	   secret: 'boooooooooom',
	   cookie: {maxAge: 60000000},
	   resave: true,
	   saveUninitialized: false,
	   store: store
  }))
  app.use(passport.initialize())
  app.use(passport.session())


   var yelp = new Yelp({
  consumer_key: process.env.OAUTH_CONSUMER_KEY,
  consumer_secret: process.env.consumerSecret,
  token: process.env.oauth_token,
  token_secret: process.env.tokenSecret,
  });

  app.get('/search' , (req, res) => {
    if (req.query.location){
    yelp.search({term:'happy+hour', location:req.query.location})
    .then(function(data){
     var businesses = data.businesses
     var businessesJustTheGoodStuff = businesses.map((b) => {
     return {name: b.name, id: b.id, rating: b.rating, location: b.location}
     })
     res.render('pages/search', {businesses: businessesJustTheGoodStuff})
    })
  } else {
      res.redirect('/')
    }
  })

  app.get('/posts/search', (req, res) => {
    Post.find({neighborhood: req.query.neighborhood}, (err, posts) => {
      console.log("this be the posts and stuff: " + posts)
      var filteredPosts = _.uniqBy(posts, 'business_name')
      res.render('posts/search', {filteredPosts})
    })
  })

  // // currentUser:
  app.use((req, res, next) => {
  	app.locals.currentUser = req.user
  	app.locals.loggedIn = !!req.user
  	next()
  })




  //root route
  app.get('/', (req, res) => {
  	res.render('pages/home')
  })



  app.get('/business/:id', (req, res) => {
    yelp.business(req.params.id, function(err, data){
      Post.find({business_id: req.params.id}, (err, posts) => {
        if (err) return console.log(error);
        console.log(data);
        res.render('pages/business', {biz: data, posts})
      })
    })
  })

  app.use('/posts', postRoutes)
  app.use('/', userRoutes)

  app.listen(port, (err) => {
    console.log (err || "Server Running On Port " + port)
  })
