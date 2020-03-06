// import depedensi yang diperlukan
const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const jwt = require('jsonwebtoken')

//membuat aplikasi dengan framework express
const app = express()

//inisialisasi secrete key yang digunakan oleh JWT
const secretKey = 'thisisverysecretkey'

//enable body parser agar dapat menerima request application/json
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}))

//inisialisai koneksi ke db
const db = mysql.createConnection({
    host:'localhost',
    port:'3306',
    user:'root',
    password:'',
    database: 'masker'
})

//melakukan koneksi ke db
db.connect((err)=>{
    if(err) throw err
    console.log('Database connected');
})

//fungsi untuk mengecek tken dari jwt
const isAuthorized = (request, result, next)=>{
    //cek apakah user sudah mengirim header 'x-api-key'
    if(typeof(request.headers['x-api-key'])=='undefined'){
        return result.status(403).json({
            success: false,
            message: 'Unauthorized. Token is not provided'
        })
    }

    //get token dari header
    let token = request.headers['x-api-key']

    //melakukan verifikasi token yang dikirim user
    jwt.verify(token, secretKey, (err, decoded)=>{
        if(err){
            return result.status(401).json({
                success: false,
                message: 'Unauthorized. Token is invalid'
            })
        }
    })

    //lanjut ke next request
    next()
}

// -----list end point----- //

//endpoint login untuk mendapatkan token dan harus admin admin
app.get('/login', (request, result)=>{
    let data = request.body

    if (data.username == 'admin' && data.password == 'admin') {
        let token = jwt.sign(data.username + '|' + data.password, secretKey)

        result.json({
            success: true,
            message: 'Login success, welcome back Admin!!!!',
            token: token
        })
    }
    result.json({
        success: false,
        message: 'You are not person with username admin and have password admin!'
    })
})


/************* CRUD USERS ****************/
// endpoint menampilkan data users dengan menggunakan token
app.get('/user', isAuthorized, (req, res)=>{
    let sql = `
        select username, created_at from user
    `

    db.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: "success get all user",
            data: result
        })
    })
})

// endpoint menambahkan data users dengan menggunakan token
app.post('/user',isAuthorized, (req, res) => {
    let data = req.body
    let sql = `
        insert into user (username, password)
        values ('`+data.username+`', '`+data.password+`')`

    db.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: 'user created',
            data: result
        })
    })
})

// endpoint menampilkan data users dengan id menggunakan token
app.get('/user/:id', isAuthorized, (req, res)=>{
    let sql = `
        select * from user
        where id = `+req.params.id+`
        limit 1`

    db.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: 'Success get user detail',
            data: result[0]
        })
    })
})

// endpoint mengubah data users dengan id menggunakan token
app.put('/user/:id', isAuthorized, (req, res)=>{
    let data = req.body

    let sql = `
        update user
        set username = '`+data.username+`',password = '`+data.password+`'
        where id = '`+req.params.id+`'
        `
    db.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: 'Data has been update',
            data: result
        })
    })
})

// endpoint menghapus data users dengan id menggunakan token
app.delete('/user/:id', isAuthorized, (req, res)=>{
    let sql = `
        delete from user
        where id ='`+req.params.id+`'
    `
    db.query(sql, (err, result)=>{
        if  (err) throw err
        res.json({
            message: ' Data has been deleted',
            data: result
        })
    })
})

/********************** CRUD MASKSHOP ***************/
// endpoint get data masker yang ada di database
app.get('/mask', isAuthorized, (req, res) => {
    let sql = `
        select nama_masker, jenis_masker, harga, stock, created_at from maskshop
    `

    db.query(sql, (err, result) => {
        if (err) throw err

        res.json({
            success: true,
            message: 'Success get all mask',
            data: result
        })
    })
})

// endpoint add data masker ke dataase
app.post('/mask', isAuthorized, (request, result) => {
    let data = request.body

    let sql = `
        insert into maskshop (nama_masker, jenis_masker, harga, stock)
        values ('`+data.nama_masker+`', '`+data.jenis_masker+`', '`+data.harga+`', '`+data.stock+`');
    `

    db.query(sql, (err, result) => {
        if (err) throw err
    })

    result.json({
        success: true,
        message: 'New mask available!'
    })
})

// endpoint menampilkan data books dengan id menggunakan token
app.get('/mask/:id', isAuthorized, (req, res)=>{
    let sql = `
        select * from maskshop
        where id = `+req.params.id+`
        limit 1
    `
    db.query(sql, (err, result)=>{
        if (err) throw err
        res.json({
            message: 'Success get mask detail',
            data: result[0]
        })
    })
})

// endpoint edit data masker ke database
app.put('/mask/:id', isAuthorized, (request, result) => {
    let data = request.body

    let sql = `
        update maskshop
        set nama_masker = '`+data.nama_masker+`', jenis_masker = '`+data.jenis_masker+`', harga = '`+data.harga+`', stock = '`+data.stock+`'
        where id = `+request.params.id+`
        `

    db.query(sql, (err, result) => {
        if (err) throw err

        result.json({
            success: true,
            message: 'Data masker berhasil diubah!',
            data: result
        })
    })
})

// endpoint hapus data buku dari database
app.delete('/mask/:id', isAuthorized, (request, result) => {
    let sql = `
        delete from maskshop 
        where id = `+request.params.id+`
    `

    db.query(sql, (err, res) => {
        if (err) throw err
        result.json({
            success: true,
            message: 'Data masker berhasil dihapus',
            data: result
        })
    })
})

/********* TRANSAKSI PEMBELIAN MASKER **************/
// endpoint post data maskshop dengan id bisa menambahkan dan 
// mengubah data maskshop menggunakan token
app.post('/mask/:id/buy', (req, res) => {
    let data = req.body

    db.query(`
        insert into user_mask (user_id, mask_id)
        values ('`+data.user_id+`', '`+req.params.id+`')
    `, (err, result) => {
        if (err) throw err
    })

    db.query(`
        update maskshop
        set stock = stock - 1
        where id = '`+req.params.id+`'
    `, (err, result) => {
        if (err) throw err
    })

    res.json({
        message: "Maks has been purchased by user"
    })
})

// endpoint menampilkan(get) data users right join data maskshop
// dengan id menggunakan token
app.get('/user/:id/mask', (req, res) => {
    db.query(`
        select maskshop.nama_masker, maskshop.jenis_masker, maskshop.harga, maskshop.stock
        from user
        right join user_mask on user.id = user_mask.user_id
        right join maskshop on user_mask.mask_id = maskshop.id
        where user.id = '`+req.params.id+`'
    `, (err, result) => {
        if (err) throw err

        res.json({
            message: "success get user's maskshop",
            data: result
        })
    })
})

// jalankan aplikasi pada port 6000
app.listen(6000, () => {
    console.log('App is running on port 6000')
})

