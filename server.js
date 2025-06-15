const express = require('express');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const { sequelize, User, File } = require('./models');
const { sessionSecret, uploadDir } = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

// EJS setup with layouts
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: sessionSecret, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Upload directory setup
const absUpload = path.isAbsolute(uploadDir) ? uploadDir : path.join(__dirname, uploadDir);
if (!fs.existsSync(absUpload)) fs.mkdirSync(absUpload, { recursive: true });
app.use('/uploads', express.static(absUpload));

// Make user available in templates
app.use((req, res, next) => { res.locals.user = req.user || null; next(); });

// Passport strategy
passport.use(new LocalStrategy(async (username, pass, done) => {
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return done(null, false);
    const ok = await bcrypt.compare(pass, user.password);
    if (!ok) return done(null, false);
    return done(null, user);
  } catch (e) { done(e); }
}));

passport.serializeUser((u, d) => d(null, u.id));
passport.deserializeUser(async (id, d) => {
  try { d(null, await User.findByPk(id)); }
  catch(e){ d(e); }
});

// File storage
const storage = multer.diskStorage({
  destination: absUpload,
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Auth middleware
const ensureAuth = (req, res, next) => req.isAuthenticated() ? next() : res.redirect('/login');
const ensureAdmin = (req, res, next) => req.isAuthenticated() && req.user.isAdmin ? next() : res.status(403).send('Forbidden');

// Routes
app.get('/', (req, res) => res.render('index', { title: 'Home' }));

app.get('/signup', (req, res) => res.render('signup', { title: 'Sign Up' }));
app.post('/signup', async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  await User.create({ username: req.body.username, password: hash });
  res.redirect('/login');
});

app.get('/login', (req, res) => res.render('login', { title: 'Login' }));
app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }));
app.get('/logout', (req, res) => { req.logout(); res.redirect('/'); });

app.get('/upload', ensureAuth, (req, res) => res.render('upload', { title: 'Upload File' }));
app.post('/upload', ensureAuth, upload.single('file'), async (req, res) => {
  await File.create({
    filename: req.file.filename,
    original: req.file.originalname,
    uploaderId: req.user.id,
    ip: req.ip,
    mime: req.file.mimetype,
    size: req.file.size
  });
  res.redirect('/');
});

// My Uploads page
app.get('/my-uploads', ensureAuth, async (req, res) => {
  const files = await File.findAll({
    where: { uploaderId: req.user.id },
    order: [['createdAt', 'DESC']]
  });
  res.render('my-uploads', {
    title: 'My Uploads',
    files
  });
});

app.get('/f/:id', async (req, res) => {
  const file = await File.findByPk(req.params.id, { include: [{ model: User, as: 'uploader' }] });
  if (!file) return res.status(404).send('Not found');
  const host = req.protocol + '://' + req.get('host');
  const meta = {
    site_name: 's.soul.lol',
    title: file.original,
    description: `wasted ${Math.round(file.size/1024)} KB on this`,
    url: host + '/f/' + file.id,
    image: host + '/uploads/' + file.filename,
    image_type: file.mime,
    image_width: 600,
    image_height: 315,
    twitter_card: 'summary_large_image'
  };
  res.render('file', { title: file.original, file, meta });
});

app.get('/admin', ensureAdmin, (req, res) => {
  File.findAll({ include: { model: User, as: 'uploader' }, order: [['createdAt','DESC']] })
    .then(files => res.render('admin', { title: 'Admin Dashboard', files }));
});

sequelize.sync().then(() => app.listen(PORT, () => console.log(`Listening on ${PORT}`))).catch(console.error);
