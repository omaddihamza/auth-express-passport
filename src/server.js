if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

const express = require("express")
const app = express();
const bcrypt = require("bcrypt")
const passport = require("passport")
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')
const mongoose = require('mongoose')
const User = require('./model/user');
const initializePassport = require('../passport-config')
const path = require("path");

initializePassport(
  passport,
  async (email)  => {
    return await User.findOne({ email: email });
  },
  async id => {
    return await User.findById(id);
  } 
)

app.set("view-engine", "ejs")
// Set the correct views directory
app.set("views", path.join(__dirname, "views"));


app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use(session({
    secret : process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized :false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'));

// Connexion à MongoDB
mongoose.connect("mongodb://localhost:27017/userdb")
    .then(() => console.log('MongoDB connecté'))
    .catch(err => console.error('Erreur de connexion :', err));


app.get("/", checkAuthenticated, (req, res)=>{
    res.render("index.ejs", {name : req.user.name})
})

app.get("/login",checkNoAuthenticated, (req, res)=>{
    res.render("login.ejs")
})

app.post("/login",checkNoAuthenticated, passport.authenticate('local',{
    successRedirect:'/',
    failureRedirect:'/login',
    failureFlash: true
}))
    

app.get("/register", checkNoAuthenticated,  (req, res)=>{
    res.render("register.ejs")
})

app.post("/register", checkNoAuthenticated, async (req, res)=>{
   try{

     const {name, email, password} = req.body;
      const hashedPassword = await bcrypt.hash(password, 10)
   
        const user = new User({
            name,
            email,
            password: hashedPassword
           });
          await user.save()
       res.redirect("/login")
   }catch{
     res.redirect("/register")
   }
})

app.delete('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send('Error logging out');
      }
      res.redirect('/login');
    });
  });
  

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect('/login')
}

function checkNoAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/')
    }
    next()
}
app.listen(3000)