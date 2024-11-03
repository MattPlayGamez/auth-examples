require('dotenv/config')
const express = require('express')
const Authenticator = require('seamless-auth')
const app = express()

let todoList = []

const auth = new Authenticator("Todo List", 12, "#MAGA", { "expiresIn": "1h" }, 3, [])
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }))

const checkAuth = async (req, res, next) => {
    let isAuth = await auth.isAuthenticated(req)
    if (!isAuth) return res.redirect('/login')
    next()
}

app.get('/', checkAuth, (req, res) => {
    res.render('todoList.ejs', { email: req.user.email, todos: todoList })
})

app.get('/login', (req, res) => {
    res.render('login.ejs')
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body
    const user = await auth.login(email, password)
    res.cookie('token', user.jwt_token)
    console.log(user)
    res.redirect('/')
})

app.get('/register', (req, res) => {
    res.render('register.ejs', { error: null })
})

app.post('/register', async (req, res) => {
    const { email, password, confirm_password } = req.body

    if (password !== confirm_password) {
        res.render('register.ejs', { error: 'Passwords do not match' })
    }

    await auth.register({
        email: email,
        password: password,
        wants2FA: false
    })
    res.redirect('/login')
})

app.get('/users', (req, res) => {
    res.send(auth.users)
})

app.get('/logout', (req, res) => {
    res.clearCookie('token')
    res.redirect('/login')
})

app.post('/add-todo', (req, res) => {
    const { newTodo } = req.body
    todoList.push({
        id: todoList.length + 1,
        name: newTodo
    })
    res.redirect('/')
})

app.post('/delete/:id', (req, res) => {
    const { id } = req.params
    todoList = todoList.filter(todo => todo.id != id)
    res.redirect('/')
})

app.listen(process.env.PORT, () => console.log('Server running on port ' + process.env.PORT))