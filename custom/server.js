const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

const app = express();
const users = [];
let todoList = [];

// Configure Passport with Local Strategy
passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        const user = users.find((user) => user.email === email);
        if (!user) {
            console.log('User not found');
            return done(null, false);
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Incorrect password');
            return done(null, false);
        }

        return done(null, user);
    })
);

passport.serializeUser((user, done) => done(null, user.email));
passport.deserializeUser((email, done) => {
    const user = users.find((user) => user.email === email);
    done(null, user);
});

// Express Middleware
app.use(express.urlencoded({ extended: false }));
app.use(session({ secret: 'yourSecret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/register', (req, res) => {
    res.render("register.ejs", { error: null });
});

// Registration Route
app.post('/register', async (req, res) => {
    const { email, password, confirm_password } = req.body;

    // Check if user exists in the list
    if (users.some((user) => user.email === email)) {
        return res.status(400).send('User already exists');
    }

    if (password !== confirm_password) {
        return res.render('register.ejs', { error: 'Passwords do not match' });
    }

    // Hash password and store new user in the list with a unique ID
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = users.length + 1; // Simple unique ID generation
    users.push({ id: userId, email, password: hashedPassword });
    res.status(201).send('User registered successfully');
});

app.get('/login', (req, res) => {
    res.render("login.ejs");
});

// Login Route
app.post(
    '/login',
    (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.redirect('/login');
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                return res.redirect('/'); // Adjust as needed
            });
        })(req, res, next);
    }
);

app.get('/users', (req, res) => {
    res.send(users);
});

app.get('/todos', (req, res) => {
    res.send(todoList);
});

// Sample Protected Route
app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('todoList.ejs', { todos: todoList, email: req.user.email });
    } else {
        res.redirect('/login');
    }
});

app.post('/add-todo', (req, res) => {
    if (req.isAuthenticated()) {
        const { newTodo } = req.body;
        let id = todoList.length + 1;
        todoList.push({ name: newTodo, id: id });
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

app.post('/delete/:id', (req, res) => {
    if (req.isAuthenticated()) {
        const { id } = req.params;
        todoList = todoList.filter(todo => todo.id !== parseInt(id));
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/login');
    });
});

// Start the Server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
