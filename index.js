const { nanoid } = require("nanoid");
const express = require('express');
const cors = require('cors');
const app = express();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const salt = "$2b$10$TBx7fI7TfQ9JvzvDlcHDd.";
const port = process.env.PORT || 3001

app.set('view engine', 'ejs')
const db_name = 'heroku_8757a67bd286b80' //CookeryDB
const db = mysql.createPool({
    host: 'eu-cdbr-west-02.cleardb.net', //localhost
    user: 'b82d03ce253fe2', //root
    password: '313e5fa0', //
    database: db_name, //heroku_8757a67bd286b80
    multipleStatements: true
})

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(express.json({limit: '50mb'}));
app.use(express.static('images'));

function base64save(base64Data, name, path) {  
      try
      {
          // Decoding base-64 image
          // Source: http://stackoverflow.com/questions/20267939/nodejs-write-base64-image-file
          function decodeBase64Image (dataString)
          {
            var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            var response = {};
  
            if (matches.length !== 3)
            {
              return new Error('Invalid input string');
            }
  
            response.type = matches[1];
            response.data = new Buffer(matches[2], 'base64');
  
            return response;
          }
  
          var imageBuffer                      = decodeBase64Image(base64Data);
          var userUploadedFeedMessagesLocation = path;
  
          var uniqueRandomImageName            = name;
  
          var userUploadedImagePath            = userUploadedFeedMessagesLocation +
                                                 uniqueRandomImageName
  
          try
          {
          require('fs').writeFile(userUploadedImagePath, imageBuffer.data,
                                  function()
                                  {
                                    console.log('DEBUG - feed:message: Saved to disk image attached by user:', userUploadedImagePath);
                                  });
          }
          catch(error)
          {
              console.log('ERROR:', error);
          }
  
      }
      catch(error)
      {
          console.log('ERROR:', error);
      }
    }
  

app.get('/products/get', (req, res) => {
    const sqlSelect = "SELECT * FROM products ORDER BY products.usage DESC";
    db.query(sqlSelect, (err, result) => {
        console.log(`error: ${err}`);
        console.log(`result: ${result}`);
        res.send(result)
    })
})

app.post('/products/insert', (req, res) => {
    const productName = req.body.productName;

    const sqlInsert = "INSERT INTO products (name, selected) VALUES (?, ?)";
    db.query(sqlInsert, [productName, 0], (err, result) => {
        console.log(`error: ${err}`);
        console.log(`result: ${result}`);
    })
})

app.get('/users/get', (req, res) => {
    const userEmail = req.query.userEmail;
    const userPassword = req.query.userPassword;
    (async function main () {
        const userPasswordHashed = await bcrypt.hash(userPassword, salt);
        const sqlSelect = `SELECT 
            id, name, likes, mail, likedPostsIdes, image
            FROM users 
        WHERE mail = '${userEmail}' AND password = '${userPasswordHashed}'`;
        db.query(sqlSelect, (err, result) => {
            console.log(`error: ${err}`);
            console.log(`result: ${result}`);
            res.send(result)
        })
    })();
})

app.post('/users/insert', (req, res) => {
    (async function main () {
        const userName = req.body.userName;
        const userEmail = req.body.userEmail;
        const userPassword = await bcrypt.hash(req.body.userPassword, salt);

        const sqlInsert = "INSERT INTO users (name, mail, password) VALUES (?, ?, ?)";
        db.query(sqlInsert, [userName, userEmail, userPassword], (err, result) => {
            console.log(`error: ${err}`);
            console.log(`result: ${result}`);
            res.send(err)
        })
    })();
})

app.get('/user/reciepes/get', (req, res) => {
    const sqlSelect = `SELECT * FROM reciepes WHERE userId = ${req.query.id}`;
    db.query(sqlSelect, (err, result) => {
        console.log(`error: ${err}`);
        console.log(`result: ${result}`);
        res.send(result)
    })
})


app.get('/recipes/get', (req, res) => {
    const sqlSelect = `SELECT * FROM reciepes ORDER BY reciepes.rating ASC LIMIT 30`;
    db.query(sqlSelect, (err, result) => {
        console.log(`error: ${err}`);
        console.log(`result: ${result}`);
        res.send(result)
    })
})

app.get('/recipes_by_title/get', (req, res) => {
    const sqlSelect = `SELECT * FROM reciepes WHERE LOWER(title) LIKE '%${req.query.title}%' LIMIT 10`;
    console.log(sqlSelect)
    db.query(sqlSelect, (err, result) => {
        console.log(`error: ${err}`);
        console.log(`result: ${result}`);
        res.send(result)
    })
})

app.get('/recipes_by_products/get', (req, res) => {
    const sqlSelect = `SELECT * FROM reciepes WHERE id IN (SELECT DISTINCT recipe_id FROM recipes_and_products WHERE product_name IN ("${req.query.products.join('", "')}"));`;
    db.query(sqlSelect, (err, result) => {
        console.log(`error: ${err}`);
        console.log(`result: ${result}`);
        for (let product of req.query.products) {
            const sqlInsert = `UPDATE ${db_name}.products SET products.usage = products.usage + 1 WHERE name = '${product}'`;
            db.query(sqlInsert)
        }
        res.send(result)
    })
})

app.get('/starredRecipes/get', (req, res) => {
    const sqlSelect = `SELECT * FROM reciepes WHERE id IN (${req.query.recipesIdes.filter(item => item !== '').join(', ')});`;
    db.query(sqlSelect, (err, result) => {
        console.log(`error: ${err}`);
        console.log(`result: ${result}`);
        res.send(result)
    })
})

app.post('/recipes/likes/update', (req, res) => {
    const type = req.body.type;
    const recipeId = req.body.recipeId;
    const userId = req.body.userId;
    if (type > 0) {
        let sqlUpdate = `
        SELECT rating FROM reciepes WHERE id = ${recipeId};
        UPDATE reciepes SET rating = rating + ${type} WHERE id = ${recipeId};
        UPDATE ${db_name}.users SET users.likedPostsIdes = CONCAT(COALESCE(users.likedPostsIdes,''), ';${recipeId};') WHERE id = ${userId}`
        db.query(sqlUpdate, (err, result) => {
            console.log(err)
            console.log(result) 
            res.send(result)
        })
    } else {
        let sqlUpdate = `
        SELECT rating FROM reciepes WHERE id = ${recipeId};
        UPDATE reciepes SET rating = rating + ${type} WHERE id = ${recipeId};
        UPDATE users SET likedPostsIdes = REPLACE(likedPostsIdes, ';${recipeId};', '') WHERE id = ${userId}`
        db.query(sqlUpdate, (err, result) => {
            console.log(err)
            res.send(result)
        })
    }
})

app.post('/reciepes/insert', (req, res) => {
    const cook = JSON.stringify(req.body.cook);
    const description = JSON.stringify(req.body.description);
    const lstOfProducts = req.body.lstOfProducts;
    const products = JSON.stringify(req.body.products);
    const time = req.body.time;
    const title = req.body.title;
    const userId = req.body.userId;
    const images = JSON.parse(req.body.images);
    const images2 = []
    for (let image of Object.keys(images)) {
        images2.push(image)
        base64save(images[image], image, './images/reciepes/')
    }
    const sqlInsert = `INSERT INTO ${db_name}.reciepes (
        title, userId, time, cook, lstOfProducts, products, description, comments, images
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(sqlInsert, [title, userId, time, cook, JSON.stringify(lstOfProducts), products, description, JSON.stringify([]), JSON.stringify(images2)], (err, result) => {
        console.log(`error: ${err}`);
        console.log(`result: ${result}`);
        for (let product of lstOfProducts) {
            let sqlInsert = `INSERT INTO ${db_name}.recipes_and_products (
                recipe_id, product_name
            ) VALUES (?, ?)`;
            db.query(sqlInsert, [result.insertId, product])
            sqlInsert = `UPDATE ${db_name}.products SET products.usage = products.usage + 1 WHERE name = '${product}'`;
            db.query(sqlInsert)
        }
        res.send(images2)
    })
})

app.post('/user/image/upload', (req, res) => {
    let ID = nanoid()
    let new_image_name = `${ID}${req.body.name}`
    base64save(req.body.imageBase64, new_image_name, './images/users/')

    const sqlUpdate = `UPDATE users 
        SET image = '${new_image_name}' 
    WHERE id = ${req.body.userId};`;
    db.query(sqlUpdate, (err, result) => {
        if (!err) {
            res.send(new_image_name)
        }
    })
})

app.listen(port, () => {
    console.log(`running on port ${port}`);
})
