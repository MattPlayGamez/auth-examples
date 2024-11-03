require('dotenv/config')
const express = require('express')
const app = express()
const { auth, requiresAuth } = require('express-openid-connect');

let todoList = [];

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: 'http://localhost:3000',
    clientID: '1evHIpkGpNObh3rRjs3U66UyrloP8t2c',
    issuerBaseURL: 'https://testdevthingy.eu.auth0.com'
  };
app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }));

app.use(auth(config));



app.get('/', (req, res) => {
    req.oidc.isAuthenticated() ? res.render('todoList.ejs', { email: req.oidc.user.email, username: req.oidc.user.nickname, todos: todoList }) : res.redirect('/login')
})

app.get('/todos', (req, res) => {
    res.send(todoList);
});

app.post('/add-todo', requiresAuth(), (req, res) => {
    const { newTodo } = req.body;
    let id = todoList.length + 1;
    todoList.push({ name: newTodo, id: id });

});

app.get('/user', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
})

app.post('/delete/:id', requiresAuth(), (req, res) => {
    const { id } = req.params;
    todoList = todoList.filter(todo => todo.id !== parseInt(id));
    res.redirect('/');
});

app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`)
})